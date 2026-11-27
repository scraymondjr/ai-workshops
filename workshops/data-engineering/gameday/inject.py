"""Apply a game-day fault to a copy of a landing zone. The detectors are the learner's."""

from __future__ import annotations

import shutil
from pathlib import Path

import yaml


def load_faults(path: Path | None = None) -> list[dict]:
    file = path or Path(__file__).with_name("faults.yml")
    return yaml.safe_load(file.read_text())


def apply_fault(landing: Path, fault: dict, dest: Path) -> Path:
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(landing, dest)
    inject = fault.get("inject") or {}
    if "delete_tree" in inject:
        spec = inject["delete_tree"]
        target = dest / spec["day"] / spec["system"]
        if target.exists():
            shutil.rmtree(target)
    if "redeliver" in inject:
        spec = inject["redeliver"]
        source = dest / spec["day"] / spec["path"]
        if source.exists():
            replay = source.with_name(source.name + ".redelivered")
            shutil.copyfile(source, replay)
    if "rename_column" in inject:
        spec = inject["rename_column"]
        file = dest / spec["day"] / spec["path"]
        if file.exists():
            file.write_text(file.read_text().replace(spec["from"], spec["to"], 1))
    if "blank_fraction" in inject:
        spec = inject["blank_fraction"]
        file = dest / spec["day"] / spec["path"]
        if file.exists():
            lines = file.read_text().splitlines()
            changed = []
            for index, line in enumerate(lines):
                if line and index % 2 == 0:
                    changed.append(line.replace(f'"{spec["field"]}":', f'"{spec["field"]}": null, "{spec["field"]}__blank":', 1))
                else:
                    changed.append(line)
            file.write_text("\n".join(changed) + ("\n" if lines else ""))
    if "truncate_fraction" in inject:
        spec = inject["truncate_fraction"]
        file = dest / spec["day"] / spec["path"]
        if file.exists():
            lines = [line for line in file.read_text().splitlines() if line]
            keep = max(1, int(len(lines) * float(spec["keep"])))
            file.write_text("\n".join(lines[:keep]) + "\n")
    if "write" in inject:
        spec = inject["write"]
        target = dest / spec["path"]
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(spec["body"])
    if "rewrite" in inject:
        spec = inject["rewrite"]
        target = dest / spec["path"]
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(spec["body"])
    if "replace_with_stale" in inject:
        spec = inject["replace_with_stale"]
        fresh = dest / spec["fresh"]
        stale = dest / spec["stale"]
        fresh.parent.mkdir(parents=True, exist_ok=True)
        if stale.exists():
            shutil.copyfile(stale, fresh)
        else:
            fresh.write_text("STALE KB EXPORT\n")
    (dest / "_fault.txt").write_text(fault["id"] + "\n")
    return dest
