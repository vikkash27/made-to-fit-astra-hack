from app.errors import DomainError
from app.schemas import ProjectCreate, ProjectEdit, ConfirmRequest, CandidateRequest, DesignSpec
from app.store import uid, now, digest
import copy
import math
from app.jobs import public_job
from app.cad.engine import locks_preserved


def inventory_hash(project):
    return digest(
        dict(
            components=[
                {k: v for k, v in c.items() if k != "visual_asset_id"}
                for c in project["components"]
            ],
            preferences=project["preferences"],
        )
    )


def assert_draft(project, expected):
    if project["draft_version"] != expected:
        raise DomainError(
            "stale_draft",
            "Draft changed; refresh before retrying",
            details={"draft_version": project["draft_version"]},
        )


class Projects:
    def __init__(self, store):
        self.store = store

    def create(self, request: ProjectCreate):
        data = request.model_dump(mode="json")
        data.update(
            id=uid("project"),
            schema_version=1,
            draft_version=1,
            active_accepted_revision_id=None,
            selected_concept_id=None,
            created_at=now(),
            updated_at=now(),
            agent_response_id=None,
        )
        if request.spec:
            data["components"] = request.spec.model_dump(mode="json")["components"]
        data["inventory_hash"] = inventory_hash(data)
        with self.store.transaction():
            self.store.put("project", data)
        return self.get(data["id"])

    def get(self, key):
        p = self.store.get("project", key)
        p.pop("agent_response_id", None)
        p["revisions"] = [
            {k: r[k] for k in ("id", "parent_id", "state", "spec_hash", "created_at", "diff")}
            for r in self.store.all("revision", project_id=key)
        ]
        p["candidate_ids"] = [r["id"] for r in p["revisions"] if r["state"] != "accepted"]
        history = self.store.all("job")
        p["jobs"] = [public_job(j, history) for j in history if j["project_id"] == key]
        p["photos"] = self.store.all("photo", project_id=key)
        selected = (
            self.store.get("concept", p["selected_concept_id"])
            if p["selected_concept_id"]
            else None
        )
        missing = []
        for c in p["components"]:
            if selected and c["part_id"] not in selected["used_part_ids"]:
                continue
            for axis, name in enumerate(["length", "width", "assembled_height"]):
                if c["size_mm"][axis] is None or not c["dimensions_confirmed"]:
                    missing.append(
                        dict(
                            part_id=c["part_id"],
                            field=name,
                            question=f"Confirm {name} of {c['name']} in mm",
                            proposed_value_mm=c["size_mm"][axis],
                        )
                    )
        p["brief"] = dict(
            draft_version=p["draft_version"],
            inventory_hash=p["inventory_hash"],
            intent_mode=p["intent_mode"],
            goal=p["goal"],
            selected_concept_id=p["selected_concept_id"],
            selected_concept=(
                {
                    name: selected[name]
                    for name in (
                        "title",
                        "purpose",
                        "used_part_ids",
                        "unused_part_ids",
                        "additional_hardware",
                        "software_firmware_dependencies",
                        "layout_rationale",
                        "supported_family",
                        "assumptions",
                    )
                }
                if selected
                else None
            ),
            preferences=p["preferences"],
            missing_questions=missing,
        )
        return p

    def edit(self, key, request: ProjectEdit):
        with self.store.transaction():
            p = self.store.get("project", key)
            assert_draft(p, request.expected_draft_version)
            for field in request.model_fields_set - {"expected_draft_version"}:
                value = getattr(request, field)
                if value is None and field != "goal":
                    raise DomainError("invalid_input", f"{field} cannot be null", 422)
                p[field] = value.model_dump(mode="json") if field == "preferences" else value
            if p["intent_mode"] == "idea" and not (p["goal"] and p["goal"].strip()):
                raise DomainError("goal_required", "Idea mode requires a goal", 422)
            p["draft_version"] += 1
            p["inventory_hash"] = inventory_hash(p)
            p["updated_at"] = now()
            self.store.put("project", p)
        return self.get(key)

    def confirm(self, key, request: ConfirmRequest):
        with self.store.transaction():
            p = self.store.get("project", key)
            assert_draft(p, request.expected_draft_version)
            existing = {c["part_id"]: c for c in p["components"]}
            ids = [c.part_id for c in request.components]
            if len(ids) != len(set(ids)) or set(ids) & set(request.remove_part_ids):
                raise DomainError("invalid_input", "Duplicate or conflicting component IDs", 422)
            for part_id in request.remove_part_ids:
                if part_id not in existing:
                    raise DomainError("not_found", "Unknown component ID", 404)
                if existing[part_id]["locked_fields"]:
                    raise DomainError(
                        "locked_constraint", "Remove locks explicitly before removing component"
                    )
                del existing[part_id]
            for c in request.components:
                value = c.model_dump(mode="json")
                old = existing.get(c.part_id)
                if c.crop:
                    photo = self.store.get("photo", c.crop.photo_id)
                    if photo["project_id"] != key:
                        raise DomainError(
                            "invalid_reference", "Photo belongs to a different project", 422
                        )
                for eid in c.evidence_ids:
                    evidence = self.store.get("evidence", eid)
                    if evidence["project_id"] != key or evidence["part_id"] != c.part_id:
                        raise DomainError(
                            "invalid_reference", "Evidence belongs to another component", 422
                        )
                if old:
                    value["component_version"] = old["component_version"] + 1
                    if c.visual_asset_id not in (None, old["visual_asset_id"]):
                        raise DomainError(
                            "invalid_reference", "Assets attach through job completion", 422
                        )
                    value["visual_asset_id"] = old["visual_asset_id"]
                    if old["visual_asset_id"] and (
                        old["size_mm"] != value["size_mm"] or old["identity"] != value["identity"]
                    ):
                        asset = self.store.get("asset", old["visual_asset_id"])
                        asset["calibration"]["status"] = "needs_review"
                        asset["calibration"]["method"] = (
                            "component dimensions or identity changed; alignment review required"
                        )
                        self.store.put("asset", asset)
                    # Explicit user confirmation may review/unlock fields; agent has no such tool.
                    if old.get("identity") != value["identity"]:
                        value["evidence_ids"] = []
                    self.store.put(
                        "component_version",
                        dict(
                            id=uid("component"),
                            project_id=key,
                            previous=old,
                            current=value,
                            reviewed_at=now(),
                        ),
                    )
                elif c.visual_asset_id:
                    raise DomainError(
                        "invalid_reference", "New component cannot claim an asset", 422
                    )
                existing[c.part_id] = value
            if len(existing) > 10:
                raise DomainError("limit_exceeded", "At most 10 enclosure components", 422)
            for decision in request.evidence_decisions:
                evidence = self.store.get("evidence", decision.evidence_id)
                component = existing.get(evidence["part_id"])
                if evidence["project_id"] != key or not component:
                    raise DomainError("invalid_reference", "Evidence is not in this inventory", 422)
                axis = {"length": 0, "width": 1, "assembled_height": 2}.get(evidence["field"])
                if decision.acceptance == "accepted" and axis is not None:
                    proposed = evidence["proposed_value_mm"]
                    accepted = component["size_mm"][axis]
                    if evidence["applicability"] == "chip_only":
                        raise DomainError(
                            "chip_dimensions_not_module",
                            "Chip-only evidence cannot establish module dimensions; use a reviewed user measurement",
                            422,
                        )
                    if (
                        proposed is None
                        or accepted is None
                        or not math.isclose(proposed, accepted, abs_tol=1e-7, rel_tol=0)
                    ):
                        raise DomainError(
                            "evidence_value_mismatch",
                            "Accepted dimension must match this proposal; use user_override for a different reviewed measurement",
                            422,
                        )
                    if decision.evidence_id not in component["evidence_ids"]:
                        component["evidence_ids"].append(decision.evidence_id)
                evidence["acceptance"] = decision.acceptance
                evidence["reviewed_at"] = now()
                self.store.put("evidence", evidence)
            p["components"] = list(existing.values())
            p["draft_version"] += 1
            p["inventory_hash"] = inventory_hash(p)
            p["updated_at"] = now()
            self.store.put("project", p)
        return self.get(key)

    def review_locks(self, key, request):
        with self.store.transaction():
            p = self.store.get("project", key)
            assert_draft(p, request.expected_draft_version)
            if p["active_accepted_revision_id"] != request.expected_active_parent:
                raise DomainError("stale_parent", "Active parent changed before lock review")
            parent = (
                self.store.get("revision", request.expected_active_parent)
                if request.expected_active_parent
                else None
            )
            parent_spec = parent["spec"] if parent else p.get("spec")
            if not parent_spec or not parent_spec["enclosure"]:
                raise DomainError(
                    "unsupported_locks", "Parameter locks currently apply to enclosure helpers", 422
                )
            components = {c["part_id"]: c for c in p["components"]}
            if not set(request.component_locked_fields).issubset(components):
                raise DomainError("invalid_reference", "Unknown component lock target", 422)
            review = dict(
                id=uid("lock_review"),
                project_id=key,
                parent_id=parent["id"] if parent else None,
                enclosure_locked_fields=request.enclosure_locked_fields,
                component_locked_fields=request.component_locked_fields,
                reviewed_at=now(),
            )
            self.store.put("lock_review", review)
            p["lock_review_id"] = review["id"]
            for part_id, fields in request.component_locked_fields.items():
                components[part_id]["locked_fields"] = fields
            p["components"] = list(components.values())
            p["draft_version"] += 1
            p["inventory_hash"] = inventory_hash(p)
            self.store.put("project", p)
        return self.get(key)

    def lock_basis(self, project, parent):
        basis = copy.deepcopy(parent["spec"] if parent else project.get("spec"))
        if not basis:
            return None
        parent_id = parent["id"] if parent else None
        key = project.get("lock_review_id")
        if key:
            review = self.store.get("lock_review", key)
            if review["parent_id"] == parent_id:
                basis["enclosure"]["locked_fields"] = review["enclosure_locked_fields"]
                for component in basis["components"]:
                    if component["part_id"] in review["component_locked_fields"]:
                        component["locked_fields"] = review["component_locked_fields"][
                            component["part_id"]
                        ]
        return basis

    def candidate(self, key, request: CandidateRequest):
        def create():
            p = self.store.get("project", key)
            assert_draft(p, request.expected_draft_version)
            if request.parent_revision_id != p["active_accepted_revision_id"]:
                raise DomainError("stale_parent", "Expected active accepted parent changed")
            spec = request.spec.model_dump(mode="json")
            if spec["printer_volume_mm"] is None:
                # Product target chosen by the user. Applies to new candidates only, including Astra.
                spec["printer_model"] = "bambu_p2s"
                spec["printer_volume_mm"] = [256, 256, 256]
            if request.spec.enclosure:
                # Engineering candidates may propose layout, never silently confirm or change inventory dimensions.
                accepted = {c["part_id"]: c for c in p["components"]}
                selected = (
                    self.store.get("concept", p["selected_concept_id"])
                    if p["selected_concept_id"]
                    else None
                )
                expected_ids = set(selected["used_part_ids"]) if selected else set(accepted)
                if selected and selected["supported_family"] == "requires_extension":
                    raise DomainError(
                        "unsupported_concept",
                        "Selected concept requires unsupported CAD features",
                        422,
                    )
                if not expected_ids.issubset(accepted) or expected_ids != {
                    c.part_id for c in request.spec.components
                }:
                    raise DomainError(
                        "inventory_mismatch",
                        "Candidate components must match the selected project's reviewed parts",
                    )
                for c in request.spec.components:
                    old = accepted[c.part_id]
                    for field in [
                        "size_mm",
                        "dimensions_confirmed",
                        "component_version",
                        "identity",
                        "dimensions_source",
                        "evidence_ids",
                    ]:
                        if (
                            spec["components"][
                                [x["part_id"] for x in spec["components"]].index(c.part_id)
                            ][field]
                            != old[field]
                        ):
                            raise DomainError(
                                "unreviewed_dimensions",
                                "Confirm component changes before proposing CAD",
                                details={"part_id": c.part_id, "field": field},
                            )
            parent = (
                self.store.get("revision", request.parent_revision_id)
                if request.parent_revision_id
                else None
            )
            if parent and parent["project_id"] != key:
                raise DomainError("invalid_reference", "Parent belongs to another project", 422)
            basis = self.lock_basis(p, parent)
            if basis:
                violations = locks_preserved(request.spec, DesignSpec.model_validate(basis))
                if violations:
                    raise DomainError(
                        "locked_constraint",
                        "Candidate changes locked parent values",
                        details=violations,
                    )
            for c in request.spec.components:
                old = next((x for x in p["components"] if x["part_id"] == c.part_id), None)
                if old:
                    if not set(old["locked_fields"]).issubset(c.locked_fields):
                        raise DomainError(
                            "locked_constraint", "Candidate cannot remove reviewed component locks"
                        )
                    for field in old["locked_fields"]:
                        if c.model_dump(mode="json")[field] != old[field]:
                            raise DomainError(
                                "locked_constraint",
                                "Candidate changes reviewed component lock",
                                details={"part_id": c.part_id, "field": field},
                            )
            before = parent["spec"] if parent else {}
            diff = [
                dict(field=k, before=before.get(k), after=v)
                for k, v in spec.items()
                if before.get(k) != v
            ]
            r = dict(
                id=uid("revision"),
                project_id=key,
                parent_id=request.parent_revision_id,
                state="candidate",
                spec=spec,
                spec_hash=digest(spec),
                inventory_hash=p["inventory_hash"],
                draft_version=p["draft_version"],
                diff=diff,
                request=request.request,
                created_at=now(),
                manifest=None,
                checks=[],
                artifacts=[],
                error=None,
                lock_basis_spec=basis,
                evidence_snapshot=self.store.all("evidence", project_id=key),
                sources_snapshot=[
                    {k: v for k, v in source.items() if k != "pages"}
                    for source in self.store.all("source", project_id=key)
                ],
                goal_snapshot=p["goal"],
                concept_snapshot=(
                    copy.deepcopy(self.store.get("concept", p["selected_concept_id"]))
                    if p["selected_concept_id"]
                    else None
                ),
            )
            self.store.put("revision", r)
            return r

        return self.store.operation(
            f"candidate:{key}", request.client_operation_id, request.model_dump(mode="json"), create
        )

    def select_concept(self, key, concept_id, request):
        with self.store.transaction():
            p = self.store.get("project", key)
            assert_draft(p, request.expected_draft_version)
            concept = self.store.get("concept", concept_id)
            if concept["project_id"] != key:
                raise DomainError("not_found", "Concept not in project", 404)
            if (
                concept["inventory_hash"] != p["inventory_hash"]
                or request.inventory_hash != p["inventory_hash"]
            ):
                raise DomainError(
                    "stale_inventory", "Concept inventory changed; regenerate proposals"
                )
            if concept["draft_version"] != p["draft_version"]:
                raise DomainError("stale_draft", "Concept was proposed for an older brief")
            p["selected_concept_id"] = concept_id
            p["goal"] = concept["goal"]
            p["draft_version"] += 1
            p["updated_at"] = now()
            self.store.put("project", p)
            concept["selected"] = True
            self.store.put("concept", concept)
        return self.get(key)
