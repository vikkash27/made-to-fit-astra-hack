"""Fetch and cache actually read sources, preserving provenance and page locations."""

import io
import ipaddress
import socket
from urllib.parse import urlparse
import httpx
from bs4 import BeautifulSoup
from pypdf import PdfReader
from app.errors import DomainError
from app.store import uid, now


def public_url(url):
    parsed = urlparse(url)
    if (
        parsed.scheme != "https"
        or not parsed.hostname
        or parsed.username
        or parsed.password
        or parsed.port not in (None, 443)
    ):
        raise DomainError("invalid_source_url", "Sources must use public HTTPS URLs", 422)
    try:
        ips = socket.getaddrinfo(parsed.hostname, 443, type=socket.SOCK_STREAM)
    except OSError:
        raise DomainError(
            "source_unreachable", "Source hostname could not be resolved", 502, retryable=True
        )
    if not ips or any(not ipaddress.ip_address(info[4][0]).is_global for info in ips):
        raise DomainError(
            "invalid_source_url", "Private and reserved source addresses are disallowed", 422
        )
    return url


def download_public(url, limit, timeout=30):
    # No provider authorization headers on source or signed-download connections.
    with httpx.Client(timeout=timeout, follow_redirects=False, trust_env=False) as client:
        for _ in range(4):
            public_url(url)
            with client.stream("GET", url) as response:
                if response.is_redirect:
                    url = str(response.url.join(response.headers["location"]))
                    continue
                response.raise_for_status()
                chunks = []
                size = 0
                for chunk in response.iter_bytes():
                    size += len(chunk)
                    if size > limit:
                        raise DomainError(
                            "source_too_large", "Remote asset exceeds byte limit", 413
                        )
                    chunks.append(chunk)
                return b"".join(chunks), response.headers.get("content-type", ""), url
    raise DomainError("source_redirect_limit", "Too many source redirects", 502)


class Research:
    def __init__(self, store, artifacts):
        self.store, self.artifacts = store, artifacts

    def fetch(self, project_id, url, timeout=30):
        cached = self.store.all("source", project_id=project_id, url=url)
        if cached:
            return cached[-1]
        try:
            data, mime, final_url = download_public(url, 8 * 1024 * 1024, timeout)
        except (httpx.HTTPError, ValueError):
            raise DomainError(
                "source_unreachable", "Could not retrieve source document", 502, retryable=True
            )
        if data.startswith(b"%PDF"):
            reader = PdfReader(io.BytesIO(data))
            pages = [
                dict(page=i + 1, text=(p.extract_text() or "")[:12000])
                for i, p in enumerate(reader.pages[:8])
            ]
            title = (
                str(reader.metadata.title or urlparse(url).path)
                if reader.metadata
                else urlparse(url).path
            )
            extension = "pdf"
            mime = "application/pdf"
        elif "html" in mime or "text/" in mime:
            soup = BeautifulSoup(data, "html.parser")
            title = soup.title.get_text(strip=True) if soup.title else urlparse(url).hostname
            for node in soup(["script", "style", "nav", "footer"]):
                node.decompose()
            pages = [dict(page=None, text=soup.get_text(" ", strip=True)[:60000])]
            extension = "html"
        else:
            raise DomainError("unsupported_source", "Source must be PDF or readable HTML/text", 422)
        a = self.artifacts.save_bytes(
            data,
            f"source.{extension}",
            role="source_document",
            mime_type=mime,
            project_id=project_id,
        )
        source = dict(
            id=uid("source"),
            project_id=project_id,
            url=url,
            final_url=final_url,
            title=title,
            publisher=urlparse(final_url).hostname,
            retrieved_at=now(),
            sha256=a["sha256"],
            artifact=a,
            pages=pages,
            document_revision=None,
            document_date=None,
        )
        with self.store.transaction():
            self.store.put("source", source)
        return source
