# -*- coding: utf-8 -*-
"""Dump all OS points for enhancement drafting."""
import json
from pathlib import Path

ROOT = Path(r"d:\fnfyu\projects\408\cs408-review")
src = ROOT / "public" / "data" / "os.json"
data = json.loads(src.read_text(encoding="utf-8"))

out = []
for ch in data["chapters"]:
    for sec in ch["sections"]:
        for pt in sec["points"]:
            out.append(
                {
                    "id": pt["id"],
                    "title": pt["title"],
                    "bodyMd": pt.get("bodyMd", ""),
                    "has_template": "template" in pt,
                    "mastery": pt.get("mastery"),
                }
            )

dump_path = ROOT / "scripts" / "_os_points_dump.json"
dump_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"dumped {len(out)} points to {dump_path}")

# also print compact catalog
for i, p in enumerate(out, 1):
    body = p["bodyMd"].replace("\n", " ")[:120]
    print(f"{i:3}. {p['id']} | {p['title']}")
