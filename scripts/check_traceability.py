#!/usr/bin/env python3
"""Traceability gate: requirement ids must be minted, cited and verified.

Two greps keep the requirement chain honest (see
.claude/rules/caip-requirement-ids.md):

  1. anti link-rot -- every `§REQ:<id>` citation in code/tests/docs must
     resolve to an `@id(...)` declared in a `.feature` file;
  2. coverage -- every declared id must be cited by at least one
     implementation file AND at least one test file.

Link-rot is always an error: a citation of a deleted or renamed id is a
lie the next reader will believe. Missing coverage is reported as a
warning by default -- a requirement can legitimately be specified before
it is built -- and becomes an error under `--strict`, which is what you
run once the backlog is meant to be empty.

Run from the repository root:  python3 scripts/check_traceability.py
Exit code 0 = chain intact, 1 = broken (the CI job fails on it).
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

FEATURE_ID = re.compile(r"@id\(([A-Z0-9-]+)\)")
CITATION = re.compile(r"§REQ:([A-Za-z0-9-]+)")

CODE_SUFFIXES = {".py", ".ts", ".tsx", ".js", ".jsx", ".css"}
# CAIP mirrors and AI bookkeeping: generated beside the .feature files and
# never hand-edited. They quote requirement ids in prose, which is narration,
# not a citation -- scanning them would report link-rot that does not exist.
SKIP_SUFFIXES = (
    ".ai.log.yaml", ".ai.trace.jsonl", ".changes.log.yaml", ".gherkin.yaml",
)

SKIP_DIRS = {
    ".git", "node_modules", "__pycache__", "dist", "build", ".venv", "venv",
    ".caep", ".claude", ".github", "graft", ".vitest", ".pytest_cache", "coverage",
}


def walk(base: Path):
    for path in base.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT)
        if any(part in SKIP_DIRS for part in rel.parts):
            continue
        if path.name.endswith(SKIP_SUFFIXES):
            continue
        yield path


def is_test(path: Path) -> bool:
    name = path.name
    parts = path.parts
    return (
        "tests" in parts
        or "test" in parts
        or name.startswith("test_")
        or ".test." in name
        or ".spec." in name
    )


def main(argv: list[str]) -> int:
    strict = "--strict" in argv
    declared: dict[str, Path] = {}
    for feature in ROOT.rglob("*.feature"):
        if any(part in SKIP_DIRS for part in feature.relative_to(ROOT).parts):
            continue
        for rid in FEATURE_ID.findall(feature.read_text(encoding="utf-8")):
            declared[rid] = feature.relative_to(ROOT)

    cited_by_code: dict[str, set[str]] = {}
    cited_by_test: dict[str, set[str]] = {}
    unknown: list[tuple[str, str]] = []

    for path in walk(ROOT):
        if path.suffix not in CODE_SUFFIXES and path.suffix not in {".md", ".yml", ".yaml"}:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        rel = str(path.relative_to(ROOT))
        for rid in CITATION.findall(text):
            if rid not in declared:
                unknown.append((rid, rel))
                continue
            if path.suffix not in CODE_SUFFIXES:
                continue  # docs may cite; they are neither code nor test evidence
            bucket = cited_by_test if is_test(path) else cited_by_code
            bucket.setdefault(rid, set()).add(rel)

    errors: list[str] = []
    warnings: list[str] = []
    for rid, rel in sorted(set(unknown)):
        errors.append(f"link-rot: §REQ:{rid} cited in {rel} resolves to no @id(...) in any .feature")

    for rid in sorted(declared):
        gaps = []
        if rid not in cited_by_code:
            gaps.append("no code file implements it")
        if rid not in cited_by_test:
            gaps.append("no test file verifies it")
        if gaps:
            (errors if strict else warnings).append(
                f"coverage: {rid} ({declared[rid]}) -- {', '.join(gaps)}"
            )

    print(f"requirements declared : {len(declared)}")
    print(f"cited by code         : {len(cited_by_code)}")
    print(f"cited by tests        : {len(cited_by_test)}")

    if warnings:
        print(f"\nNot yet implemented ({len(warnings)}):")
        for warning in warnings:
            print(f"  - {warning}")

    if errors:
        print("\nTraceability chain broken:", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        return 1

    print("\nTraceability chain intact" + (" (strict)." if strict else "; no link-rot."))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
