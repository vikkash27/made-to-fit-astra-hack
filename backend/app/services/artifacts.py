import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from app.errors import DomainError
from app.store import uid, now
from app.services.build_guide import build_guide, guide_markdown


class Artifacts:
    def __init__(self, store, settings):
        self.store, self.settings = store, settings
        self.root = store.directory / "artifacts"
        self.root.mkdir(exist_ok=True)

    def public(self, a):
        return {k: v for k, v in a.items() if k != "path"}

    def register(self, path, **metadata):
        data = path.read_bytes()
        a = dict(
            id=uid("artifact"),
            path=str(path.relative_to(self.store.directory)),
            filename=path.name,
            sha256=hashlib.sha256(data).hexdigest(),
            size_bytes=len(data),
            created_at=now(),
            **metadata,
        )
        a["url"] = f"/artifacts/{a['id']}"
        self.store.put("artifact", a)
        return self.public(a)

    def save_bytes(self, data, filename, **metadata):
        directory = self.root / uid("upload")
        directory.mkdir()
        path = directory / filename
        tmp = path.with_suffix(".tmp")
        tmp.write_bytes(data)
        os.replace(tmp, path)
        with self.store.transaction():
            return self.register(path, **metadata)

    def path(self, key):
        a = self.store.get("artifact", key)
        path = Path(a["path"])
        if not path.is_absolute():
            path = self.store.directory / path
        path = path.resolve()
        if not path.is_relative_to(self.root) or not path.is_file():
            raise DomainError("artifact_missing", "Registered artifact unavailable", 404)
        return a, path

    def build(self, revision_id):
        revision = self.store.get("revision", revision_id)
        if revision["manifest"]:
            return revision["manifest"]
        parent = (
            self.store.get("revision", revision["parent_id"]) if revision["parent_id"] else None
        )
        with tempfile.TemporaryDirectory(prefix="cad-", dir=self.store.directory) as temporary:
            temp = Path(temporary)
            input_path = temp / "input.json"
            input_path.write_text(
                json.dumps(
                    dict(
                        spec=revision["spec"],
                        parent_spec=revision.get(
                            "lock_basis_spec", parent["spec"] if parent else None
                        ),
                        revision_id=revision_id,
                        spec_hash=revision["spec_hash"],
                        sources={
                            "evidence": revision.get("evidence_snapshot", []),
                            "documents": revision.get("sources_snapshot", []),
                        },
                    )
                )
            )
            out = temp / "output"
            try:
                result = subprocess.run(
                    [sys.executable, "-m", "app.cad.worker", str(input_path), str(out)],
                    capture_output=True,
                    text=True,
                    timeout=self.settings.cad_job_timeout_seconds,
                )
            except subprocess.TimeoutExpired:
                raise DomainError(
                    "cad_timeout", "Native CAD worker exceeded deadline", 503, retryable=True
                )
            if result.returncode:
                # Worker inputs are bounded and contain no credentials. Keep full diagnostics server-side.
                (self.store.directory / "last-cad-error.txt").write_text(result.stderr[-12000:])
                raise DomainError(
                    "cad_failed",
                    "Native CAD build failed; inspect last-cad-error.txt",
                    422,
                    details={"exit_code": result.returncode},
                )
            manifest = json.loads((out / "result.json").read_text())
            published = self.root / uid("build")
            os.replace(out, published)
            try:
                with self.store.transaction():
                    r = self.store.get("revision", revision_id)
                    if r["manifest"]:
                        shutil.rmtree(published)
                        return r["manifest"]
                    artifacts = []
                    for f in manifest.pop("artifact_files"):
                        metadata = {
                            k: v
                            for k, v in f.items()
                            if k not in ["filename", "sha256", "size_bytes"]
                        }
                        a = self.register(
                            published / f["filename"],
                            revision_id=revision_id,
                            spec_hash=r["spec_hash"],
                            **metadata,
                        )
                        artifacts.append(a)
                    by_file = {a["filename"]: a for a in artifacts}
                    for p in manifest["parts"]:
                        p["preview_artifact"] = by_file[p.pop("preview_filename")]
                        p["mesh_artifact"] = by_file[p.pop("mesh_filename")]
                        p["exports"] = [by_file[k] for k in p.pop("export_filenames")]
                    manifest["preview"]["assembly_artifact"] = by_file[
                        manifest["preview"].pop("assembly_filename")
                    ]
                    guide = build_guide(r, manifest)
                    guide_path = published / "build-guide.md"
                    guide_path.write_text(guide_markdown(guide), encoding="utf-8")
                    artifacts.append(
                        self.register(
                            guide_path,
                            revision_id=revision_id,
                            spec_hash=r["spec_hash"],
                            role="build_guide",
                            mime_type="text/markdown",
                        )
                    )
                    r["build_guide"] = guide
                    manifest["artifacts"] = artifacts
                    r["manifest"] = manifest
                    r["artifacts"] = artifacts
                    r["checks"] = manifest["checks"]
                    r["state"] = "checked" if self.eligible(r) else "failed_checks"
                    r["built_at"] = now()
                    self.store.put("revision", r)
                    return manifest
            except BaseException:
                shutil.rmtree(published, ignore_errors=True)
                raise

    @staticmethod
    def eligible(r):
        checks = r["checks"]
        required = {"cad_validity", "unit_bounds_sanity", "locked_constraints"}
        return bool(
            r["manifest"]
            and r["artifacts"]
            and checks
            and required.issubset({c["check_id"] for c in checks})
            and all(
                c["status"] == "pass" for c in checks if c.get("required", c["status"] != "unknown")
            )
            and all(
                c["revision_id"] == r["id"] and c["spec_hash"] == r["spec_hash"] for c in checks
            )
        )

    def accept(self, revision_id, request):
        def apply():
            r = self.store.get("revision", revision_id)
            p = self.store.get("project", r["project_id"])
            if p["active_accepted_revision_id"] == r["id"] and r["state"] == "accepted":
                return r
            if (
                r["parent_id"] != request.expected_active_parent
                or p["active_accepted_revision_id"] != request.expected_active_parent
            ):
                raise DomainError("stale_parent", "Active accepted parent changed")
            if (
                p["inventory_hash"] != r["inventory_hash"]
                or p["draft_version"] != r["draft_version"]
            ):
                raise DomainError("stale_inventory", "Draft changed after candidate was frozen")
            if not self.eligible(r):
                raise DomainError(
                    "candidate_ineligible",
                    "Complete matching artifacts and required passing checks needed",
                )
            for a in r["artifacts"]:
                registered, path = self.path(a["id"])
                if (
                    a["revision_id"] != r["id"]
                    or a["spec_hash"] != r["spec_hash"]
                    or hashlib.sha256(path.read_bytes()).hexdigest() != a["sha256"]
                    or registered["sha256"] != a["sha256"]
                ):
                    raise DomainError("artifact_integrity", "Artifact identity/hash mismatch")
            r["state"] = "accepted"
            r["accepted_at"] = now()
            p["active_accepted_revision_id"] = r["id"]
            p["spec"] = r["spec"]
            self.store.put("revision", r)
            self.store.put("project", p)
            return r

        return self.store.operation(
            f"accept:{revision_id}",
            request.client_operation_id,
            request.model_dump(mode="json"),
            apply,
        )
