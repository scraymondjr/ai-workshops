"""Bronze loader. file_sha256 is provided. load_file is the D0 exercise."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from pathlib import Path


@dataclass
class LoadResult:
    path: Path
    skipped: bool = False
    batch_id: str | None = None
    loaded: int = 0
    rejected: int = 0


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_file(con, path: Path) -> LoadResult:
    """Load one JSONL file into bronze.

    A known SHA-256 is a no-op. One transaction per file. Malformed lines go to
    bronze._rejects. loaded + rejected must equal the number of lines.
    """
    raise NotImplementedError("LEARNER_TODO: implement load_file")
