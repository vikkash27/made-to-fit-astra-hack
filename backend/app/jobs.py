from concurrent.futures import ThreadPoolExecutor
import threading
import time
from datetime import datetime
from app.errors import DomainError
from app.store import uid, now

TERMINAL = {"ready", "failed", "unknown_submission", "cancelled"}


def public_job(job, history=()):
    """Observed wall-clock timings only; no invented vendor percent or ETA."""
    result = {k: v for k, v in job.items() if k not in ("private", "payload")}
    samples = []
    for previous in list(history)[-100:]:
        if (
            previous["id"] == job["id"]
            or previous["kind"] != job["kind"]
            or previous["stage"] != "ready"
        ):
            continue
        if job["kind"] == "visual_asset" and any(
            previous.get("payload", {}).get(k) != job.get("payload", {}).get(k)
            for k in ("tier", "quality_override")
        ):
            continue
        try:
            duration = (
                datetime.fromisoformat(previous["updated_at"])
                - datetime.fromisoformat(previous["created_at"])
            ).total_seconds()
        except (ValueError, KeyError):
            continue
        if duration >= 1:
            samples.append(duration)
    samples = samples[-20:]
    result["timing"] = dict(
        sample_count=len(samples),
        observed_range_seconds=[round(min(samples)), round(max(samples))] if samples else None,
        basis="completed jobs of the same kind; Rodin tier and detail matched",
    )
    return result


class Jobs:
    def __init__(self, store, settings):
        self.store, self.settings = store, settings
        self.executor = ThreadPoolExecutor(max_workers=3, thread_name_prefix="made-to-fit")
        self.cad_lock = threading.Lock()
        self.handlers = {}
        self.running = set()
        self.guard = threading.Lock()
        self.stop = threading.Event()

    def public(self, job):
        return public_job(job, self.store.all("job"))

    def get(self, key):
        return self.public(self.store.get("job", key))

    def create(
        self, kind, project_id, payload, operation_id, revision_id=None, part_id=None, private=None
    ):
        scope = f"job:{kind}:{project_id}:{revision_id or ''}:{part_id or ''}"

        def insert():
            self.store.get("project", project_id)
            if kind == "visual_asset":
                count = len(self.store.all("job", kind=kind, project_id=project_id))
                if count >= self.settings.max_visual_jobs_per_project:
                    raise DomainError(
                        "budget_exceeded", "Visual generation project budget reached", 429
                    )
            j = dict(
                id=uid("job"),
                job_id=None,
                kind=kind,
                project_id=project_id,
                revision_id=revision_id,
                part_id=part_id,
                stage="queued",
                result=None,
                error=None,
                events=[],
                created_at=now(),
                updated_at=now(),
                client_operation_id=operation_id,
                payload=payload,
                private=private or {},
            )
            j["job_id"] = j["id"]
            self.store.put("job", j)
            return self.public(j)

        job = self.store.operation(scope, operation_id, payload, insert)
        self.dispatch(job["id"])
        return self.get(job["id"])

    def update(self, key, stage=None, **values):
        with self.store.transaction():
            j = self.store.get("job", key)
            if stage:
                j["stage"] = stage
                j["events"].append(dict(stage=stage, at=now()))
            j.update(values)
            j["updated_at"] = now()
            self.store.put("job", j)
        return j

    def event(self, key, tool, status, summary):
        with self.store.transaction():
            j = self.store.get("job", key)
            j["events"].append(dict(tool=tool, status=status, summary=summary, at=now()))
            self.store.put("job", j)

    def dispatch(self, key):
        with self.guard:
            if key in self.running or self.store.get("job", key)["stage"] in TERMINAL:
                return
            self.running.add(key)
            self.executor.submit(self._run, key)

    def _run(self, key):
        started = time.monotonic()
        try:
            j = self.store.get("job", key)
            handler = self.handlers[j["kind"]]
            result = handler(j)
            latest = self.store.get("job", key)
            if latest["stage"] not in TERMINAL and not (
                j["kind"] == "visual_asset" and result is None
            ):
                self.update(
                    key,
                    "ready",
                    result=result,
                    elapsed_seconds=round(time.monotonic() - started, 3),
                )
        except DomainError as error:
            self.update(
                key,
                "unknown_submission" if error.code == "unknown_submission" else "failed",
                error=error.public(),
            )
        except Exception as error:
            # Exception strings can contain provider URLs/tokens; only expose class.
            self.update(
                key,
                "failed",
                error=dict(
                    code="job_failed",
                    message=f"Operation failed ({type(error).__name__})",
                    details=None,
                    retryable=True,
                ),
            )
        finally:
            with self.guard:
                self.running.discard(key)

    def recover(self):
        for j in self.store.all("job"):
            if j["stage"] in TERMINAL:
                continue
            if j["kind"] == "visual_asset":
                if j["private"].get("task_uuid") and j["private"].get("subscription_key"):
                    self.dispatch(j["id"])
                elif j["stage"] == "queued":
                    self.dispatch(j["id"])
                else:
                    self.update(
                        j["id"],
                        "unknown_submission",
                        error=dict(
                            code="unknown_submission",
                            message="Interrupted paid submission; no automatic resubmission",
                            details=None,
                            retryable=False,
                        ),
                    )
            elif j["kind"] == "cad_build" or j["stage"] == "queued":
                self.dispatch(j["id"])
            else:
                self.update(
                    j["id"],
                    "failed",
                    error=dict(
                        code="interrupted",
                        message="Job interrupted by restart; saved state preserved. Retry with a new operation ID.",
                        details=None,
                        retryable=True,
                    ),
                )

    def close(self):
        self.stop.set()
        self.executor.shutdown(wait=True, cancel_futures=True)
