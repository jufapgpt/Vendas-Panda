#!/usr/bin/env python3
"""Inventário conservador de projetos PBIP/PBIR/TMDL usando apenas a biblioteca padrão."""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def walk(node: Any):
    if isinstance(node, dict):
        yield node
        for value in node.values():
            yield from walk(value)
    elif isinstance(node, list):
        for value in node:
            yield from walk(value)


def extract_visual_references(payload: dict[str, Any]) -> dict[str, list[str]]:
    entities: set[str] = set()
    columns: set[str] = set()
    measures: set[str] = set()

    for node in walk(payload):
        source_ref = node.get("SourceRef")
        if isinstance(source_ref, dict):
            entity = source_ref.get("Entity")
            if isinstance(entity, str):
                entities.add(entity)

        column = node.get("Column")
        if isinstance(column, dict):
            property_name = column.get("Property")
            expression = column.get("Expression")
            if isinstance(property_name, str):
                entity = None
                if isinstance(expression, dict):
                    source = expression.get("SourceRef")
                    if isinstance(source, dict):
                        entity = source.get("Entity")
                columns.add(f"{entity}.{property_name}" if entity else property_name)

        measure = node.get("Measure")
        if isinstance(measure, dict):
            property_name = measure.get("Property")
            expression = measure.get("Expression")
            if isinstance(property_name, str):
                entity = None
                if isinstance(expression, dict):
                    source = expression.get("SourceRef")
                    if isinstance(source, dict):
                        entity = source.get("Entity")
                measures.add(f"{entity}.{property_name}" if entity else property_name)

    return {
        "entities": sorted(entities),
        "columns": sorted(columns),
        "measures": sorted(measures),
    }


def parse_tmdl_measures(text: str, source_file: str) -> list[dict[str, str]]:
    lines = text.splitlines()
    results: list[dict[str, str]] = []
    index = 0
    header = re.compile(r"^(\s*)measure\s+(.+?)\s*=\s*(.*)$")

    while index < len(lines):
        match = header.match(lines[index])
        if not match:
            index += 1
            continue

        indent, name, first_expression = match.groups()
        expression_lines = [first_expression] if first_expression else []
        index += 1

        while index < len(lines):
            line = lines[index]
            if line.strip() and len(line) - len(line.lstrip()) <= len(indent):
                break
            expression_lines.append(line[len(indent) :])
            index += 1

        results.append(
            {
                "name": name.strip().strip("'"),
                "expression": "\n".join(expression_lines).strip(),
                "sourceFile": source_file,
            }
        )

    return results


def main() -> int:
    if len(sys.argv) < 2:
        print("Uso: scan_pbip.py <pasta-do-projeto-pbip>", file=sys.stderr)
        return 2

    root = Path(sys.argv[1]).expanduser().resolve()
    if not root.exists() or not root.is_dir():
        print(f"Pasta não encontrada: {root}", file=sys.stderr)
        return 2

    report_dirs = list(root.glob("*.Report"))
    model_dirs = list(root.glob("*.SemanticModel"))
    pages: list[dict[str, Any]] = []
    visual_type_counter: Counter[str] = Counter()
    all_entities: set[str] = set()
    all_columns: set[str] = set()
    all_measures_referenced: set[str] = set()

    for report_dir in report_dirs:
        pages_meta_path = report_dir / "definition" / "pages" / "pages.json"
        page_order: list[str] = []
        if pages_meta_path.exists():
            page_order = load_json(pages_meta_path).get("pageOrder", [])

        page_root = report_dir / "definition" / "pages"
        for page_dir in page_root.iterdir() if page_root.exists() else []:
            if not page_dir.is_dir() or not (page_dir / "page.json").exists():
                continue
            page_payload = load_json(page_dir / "page.json")
            visual_files = sorted((page_dir / "visuals").glob("*/visual.json"))
            types: Counter[str] = Counter()
            page_entities: set[str] = set()
            page_columns: set[str] = set()
            page_measures: set[str] = set()

            for visual_file in visual_files:
                visual_payload = load_json(visual_file)
                visual_type = visual_payload.get("visual", {}).get("visualType", "group_or_unknown")
                types[visual_type] += 1
                visual_type_counter[visual_type] += 1
                references = extract_visual_references(visual_payload)
                page_entities.update(references["entities"])
                page_columns.update(references["columns"])
                page_measures.update(references["measures"])

            all_entities.update(page_entities)
            all_columns.update(page_columns)
            all_measures_referenced.update(page_measures)
            page_name = page_payload.get("name", page_dir.name)
            pages.append(
                {
                    "order": page_order.index(page_name) + 1 if page_name in page_order else None,
                    "name": page_name,
                    "displayName": page_payload.get("displayName", page_name),
                    "width": page_payload.get("width"),
                    "height": page_payload.get("height"),
                    "visualCount": len(visual_files),
                    "visualTypes": dict(types),
                    "entities": sorted(page_entities),
                    "columns": sorted(page_columns),
                    "measures": sorted(page_measures),
                }
            )

    dax_measures: list[dict[str, str]] = []
    tmdl_files: list[str] = []
    for model_dir in model_dirs:
        for tmdl_path in model_dir.rglob("*.tmdl"):
            relative = str(tmdl_path.relative_to(root))
            tmdl_files.append(relative)
            text = tmdl_path.read_text(encoding="utf-8-sig", errors="replace")
            dax_measures.extend(parse_tmdl_measures(text, relative))

    inventory = {
        "projectRoot": str(root),
        "reportDirectories": [str(path.relative_to(root)) for path in report_dirs],
        "semanticModelDirectories": [str(path.relative_to(root)) for path in model_dirs],
        "summary": {
            "pageCount": len(pages),
            "visualCount": sum(page["visualCount"] for page in pages),
            "tmdlFileCount": len(tmdl_files),
            "daxMeasureCount": len(dax_measures),
        },
        "visualTypes": dict(visual_type_counter.most_common()),
        "entitiesReferenced": sorted(all_entities),
        "columnsReferenced": sorted(all_columns),
        "measuresReferenced": sorted(all_measures_referenced),
        "pages": sorted(pages, key=lambda page: page["order"] or 9999),
        "tmdlFiles": sorted(tmdl_files),
        "daxMeasures": dax_measures,
    }

    output = root / "pbi-inventory.json"
    output.write_text(json.dumps(inventory, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Inventário criado: {output}")
    print(json.dumps(inventory["summary"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
