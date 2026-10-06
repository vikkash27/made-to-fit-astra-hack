"""Small JSON record store; all state transitions run inside SQLite transactions."""

import hashlib
import json
import sqlite3
import threading
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from app.errors import DomainError


def uid(prefix):
    return f"{prefix}_{uuid.uuid4().hex}"


def now():
    return datetime.now(timezone.utc).isoformat()


def encode(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False)


def digest(value):
    return hashlib.sha256(encode(value).encode()).hexdigest()


class Store:
    def __init__(self, directory: Path):
        self.directory = directory.resolve()
        self.directory.mkdir(parents=True, exist_ok=True)
        self.lock = threading.RLock()
        self.db = sqlite3.connect(self.directory / "state.sqlite3", check_same_thread=False)
        self.db.execute("PRAGMA journal_mode=WAL")
        self.db.execute("PRAGMA busy_timeout=5000")
        self.db.execute("CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT)")
        version = self.db.execute(
            "SELECT value FROM metadata WHERE key='schema_version'"
        ).fetchone()
        if version and version[0] != "1":
            raise RuntimeError("Unsupported database schema; preserve files and migrate explicitly")
        self.db.execute("INSERT OR IGNORE INTO metadata VALUES ('schema_version','1')")
        self.db.execute(
            "CREATE TABLE IF NOT EXISTS records (kind TEXT, id TEXT, data TEXT, PRIMARY KEY(kind,id))"
        )
        self.db.execute(
            "CREATE TABLE IF NOT EXISTS operations (scope TEXT, key TEXT, hash TEXT, result TEXT, PRIMARY KEY(scope,key))"
        )
        self.db.commit()

    @contextmanager
    def transaction(self):
        with self.lock:
            self.db.execute("BEGIN IMMEDIATE")
            try:
                yield
                self.db.commit()
            except BaseException:
                self.db.rollback()
                raise

    def put(self, kind, record):
        self.db.execute(
            "INSERT OR REPLACE INTO records VALUES (?,?,?)", (kind, record["id"], encode(record))
        )

    def get(self, kind, key):
        with self.lock:
            row = self.db.execute(
                "SELECT data FROM records WHERE kind=? AND id=?", (kind, key)
            ).fetchone()
        if not row:
            raise DomainError("not_found", f"Unknown {kind} ID", 404)
        return json.loads(row[0])

    def all(self, record_kind, **where):
        with self.lock:
            rows = self.db.execute(
                "SELECT data FROM records WHERE kind=? ORDER BY rowid", (record_kind,)
            ).fetchall()
        return (
            [
                r
                for row in rows
                if all((r := json.loads(row[0])).get(k) == v for k, v in where.items())
            ]
            if where
            else [json.loads(row[0]) for row in rows]
        )

    def operation(self, scope, key, request, action):
        with self.transaction():
            hashed = digest(request)
            row = self.db.execute(
                "SELECT hash,result FROM operations WHERE scope=? AND key=?", (scope, key)
            ).fetchone()
            if row:
                if row[0] != hashed:
                    raise DomainError(
                        "operation_conflict", "Operation ID was used with different input"
                    )
                return json.loads(row[1])
            result = action()
            self.db.execute(
                "INSERT INTO operations VALUES (?,?,?,?)", (scope, key, hashed, encode(result))
            )
            return result
