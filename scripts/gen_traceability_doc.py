#!/usr/bin/env python3
"""Generate docs/traceability.md from the citations actually in the tree.

The matrix requirement -> code -> test is worth having only if it cannot
drift, so it is not written by hand: this script reads the `@id(...)`
declared in the .feature files and the `§REQ:<id>` markers found in the
source, and renders what it finds. Run it after touching either side:

    python3 scripts/gen_traceability_doc.py
"""
from __future__ import annotations

import re
from collections import defaultdict
from pathlib import Path

from check_traceability import (  # the checker owns the scanning rules
    CITATION,
    CODE_SUFFIXES,
    FEATURE_ID,
    ROOT,
    SKIP_DIRS,
    is_test,
    walk,
)

OUT = ROOT / "docs" / "traceability.md"

# "@id(X) @functional @c4-container" on one line, "Scenario: title" on the next.
SCENARIO = re.compile(
    r"@id\((?P<id>[A-Z0-9-]+)\)(?P<tags>[^\n]*)\n\s*Scenario(?: Outline)?:\s*(?P<title>[^\n]+)"
)


def read_features() -> dict[str, dict]:
    """Every declared requirement, with its title, tags and owning feature."""
    declared: dict[str, dict] = {}
    for feature in sorted(ROOT.rglob("*.feature")):
        if any(part in SKIP_DIRS for part in feature.relative_to(ROOT).parts):
            continue
        text = feature.read_text(encoding="utf-8")
        title_match = re.search(r"^Feature:\s*(.+)$", text, re.MULTILINE)
        feature_title = title_match.group(1).strip() if title_match else feature.stem
        for m in SCENARIO.finditer(text):
            declared[m.group("id")] = {
                "title": m.group("title").strip(),
                "kind": "non funzionale" if "non-functional" in m.group("tags") else "funzionale",
                "document": feature.stem.replace(".feature", ""),
                "document_title": feature_title,
            }
        # A scenario whose tag line the regex missed must still be listed.
        for rid in FEATURE_ID.findall(text):
            declared.setdefault(rid, {
                "title": "(titolo non risolto)",
                "kind": "funzionale",
                "document": feature.stem.replace(".feature", ""),
                "document_title": feature_title,
            })
    return declared


def read_citations() -> tuple[dict[str, set[str]], dict[str, set[str]]]:
    code: dict[str, set[str]] = defaultdict(set)
    tests: dict[str, set[str]] = defaultdict(set)
    for path in walk(ROOT):
        if path.suffix not in CODE_SUFFIXES:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        rel = str(path.relative_to(ROOT))
        for rid in set(CITATION.findall(text)):
            (tests if is_test(path) else code)[rid].add(rel)
    return code, tests


def files_cell(files: set[str]) -> str:
    if not files:
        return "— *nessuno*"
    return "<br/>".join(f"[`{f}`](../{f})" for f in sorted(files))


def main() -> int:
    declared = read_features()
    code, tests = read_citations()

    by_doc: dict[str, list[str]] = defaultdict(list)
    for rid in sorted(declared):
        by_doc[declared[rid]["document"]].append(rid)

    covered = sum(1 for r in declared if code.get(r) and tests.get(r))

    lines: list[str] = []
    w = lines.append

    w("# Tracciabilità: requisito → codice → test")
    w("")
    w("> **Documento generato.** Non modificarlo a mano: rigeneralo con")
    w("> `python3 scripts/gen_traceability_doc.py`. Le righe qui sotto sono le")
    w("> citazioni `§REQ:<id>` realmente presenti nel codice, non una promessa.")
    w(">")
    w(f"> Stato: **{covered} requisiti su {len(declared)}** implementati e verificati.")
    w("")
    w("## Come funziona la catena")
    w("")
    w("Ogni artefatto cita **solo il livello immediatamente sopra di sé**: il")
    w("codice cita il requisito che soddisfa, il test cita il requisito che")
    w("verifica, e il requisito porta i collegamenti al materiale di analisi.")
    w("Nessuno salta un anello — un commento nel codice che cita un nodo C4 o un")
    w("documento è il sintomo di un collegamento mancante *sul requisito*.")
    w("")
    w("```mermaid")
    w("flowchart LR")
    w('    F["<b>.feature</b><br/>@id(...)"]')
    w('    C["<b>codice</b><br/>§REQ:…"]')
    w('    T["<b>test</b><br/>§REQ:…"]')
    w('    F -->|"soddisfatto da"| C')
    w('    F -->|"verificato da"| T')
    w('    C -.->|"stesso id"| T')
    w("    classDef f fill:#c9a227,stroke:#8a6f1a,color:#fff")
    w("    classDef c fill:#438dd5,stroke:#2e6295,color:#fff")
    w("    classDef t fill:#3a7a3a,stroke:#2a5a2a,color:#fff")
    w("    class F f")
    w("    class C c")
    w("    class T t")
    w("```")
    w("")
    w("Due controlli la tengono onesta, entrambi in CI:")
    w("")
    w("1. **anti link-rot** — ogni `§REQ:` citato risolve a un `@id(...)` esistente;")
    w("2. **copertura** — ogni id è citato da almeno un file di codice *e* almeno un test.")
    w("")

    for doc in sorted(by_doc):
        ids = by_doc[doc]
        w(f"## `{doc}` — {declared[ids[0]]['document_title']}")
        w("")
        w("| Requisito | Comportamento | Implementato in | Verificato da |")
        w("|---|---|---|---|")
        for rid in ids:
            meta = declared[rid]
            mark = " ⚙️" if meta["kind"] == "non funzionale" else ""
            w(f"| `{rid}`{mark} | {meta['title']} | {files_cell(code.get(rid, set()))} "
              f"| {files_cell(tests.get(rid, set()))} |")
        w("")
        w("⚙️ = requisito non funzionale.")
        w("")

    # The files that carry the most requirements say where the weight sits.
    load: dict[str, int] = defaultdict(int)
    for files in code.values():
        for f in files:
            load[f] += 1
    w("## Dove pesano i requisiti")
    w("")
    w("I file che soddisfano più requisiti sono quelli da leggere per primi, e")
    w("quelli da toccare con più attenzione:")
    w("")
    w("| File | Requisiti soddisfatti |")
    w("|---|---|")
    for f, n in sorted(load.items(), key=lambda kv: (-kv[1], kv[0]))[:10]:
        w(f"| [`{f}`](../{f}) | {n} |")
    w("")

    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"scritto {OUT.relative_to(ROOT)} — {covered}/{len(declared)} requisiti coperti")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
