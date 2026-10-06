"""Official Responses SDK adapter with no model fallback or automatic paid retries."""

import time
from openai import OpenAI, APIError, APITimeoutError, APIConnectionError
from app.errors import DomainError
from app.store import uid, now


class Astra:
    def __init__(self, settings, store):
        self.settings, self.store = settings, store

    def client(self, timeout=None):
        if not self.settings.openai_api_key:
            raise DomainError("provider_not_configured", "Set OPENAI_API_KEY in backend .env", 503)
        return OpenAI(
            api_key=self.settings.openai_api_key,
            max_retries=0,
            timeout=timeout or self.settings.model_job_timeout_seconds,
        )

    def call(self, job_id, *, parse=None, deadline=None, **parameters):
        remaining = (
            (deadline - time.monotonic()) if deadline else self.settings.model_job_timeout_seconds
        )
        if remaining <= 0:
            raise DomainError("model_budget_exceeded", "Model wall-time budget exhausted", 503)
        count = len(self.store.all("usage", job_id=job_id))
        if count >= self.settings.max_model_calls_per_job:
            raise DomainError("model_budget_exceeded", "Model call budget exhausted", 429)
        ledger = dict(
            id=uid("usage"),
            job_id=job_id,
            provider="openai",
            model=self.settings.openai_model,
            status="started",
            started_at=now(),
            usage=None,
            response_id=None,
        )
        with self.store.transaction():
            self.store.put("usage", ledger)
        started = time.monotonic()
        parameters.update(
            model=self.settings.openai_model, max_output_tokens=self.settings.max_output_tokens
        )
        try:
            with self.client(remaining) as client:
                response = (
                    client.responses.parse(text_format=parse, **parameters)
                    if parse
                    else client.responses.create(**parameters)
                )
        except (APITimeoutError, APIConnectionError):
            ledger["status"] = "unknown_result"
            with self.store.transaction():
                self.store.put("usage", ledger)
            raise DomainError(
                "provider_timeout",
                "OpenAI request interrupted; no automatic retry; existing state preserved",
                503,
                retryable=True,
            )
        except APIError as error:
            ledger.update(status="failed", http_status=getattr(error, "status_code", None))
            with self.store.transaction():
                self.store.put("usage", ledger)
            raise DomainError(
                "provider_error",
                "OpenAI request failed",
                502,
                details={"http_status": getattr(error, "status_code", None)},
                retryable=True,
            )
        except ValueError:
            ledger["status"] = "invalid_model_output"
            with self.store.transaction():
                self.store.put("usage", ledger)
            raise DomainError(
                "invalid_model_output",
                "Structured model output failed validation; retrieved evidence and accepted state preserved",
                502,
                retryable=True,
            )
        ledger.update(
            status=response.status,
            response_id=response.id,
            usage=response.usage.model_dump() if response.usage else None,
            elapsed_seconds=round(time.monotonic() - started, 3),
        )
        with self.store.transaction():
            self.store.put("usage", ledger)
        if response.status != "completed":
            raise DomainError(
                "model_incomplete",
                "OpenAI returned an incomplete response; saved state preserved",
                502,
                details={"status": response.status},
            )
        refusals = [
            c
            for item in response.output
            if item.type == "message"
            for c in item.content
            if c.type == "refusal"
        ]
        if refusals:
            raise DomainError("model_refusal", "Model declined this request", 422)
        if parse and response.output_parsed is None:
            raise DomainError(
                "invalid_model_output", "Model did not return the requested structured output", 502
            )
        return response


def citations(response):
    return [
        a.model_dump()
        for item in response.output
        if item.type == "message"
        for content in item.content
        if content.type == "output_text"
        for a in content.annotations
        if a.type == "url_citation"
    ]
