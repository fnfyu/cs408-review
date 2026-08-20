#!/usr/bin/env python3
"""扫描 extracted/*/content.txt，建立课件目录，并把正文复制到 web/public/lessons 供前端阅读。"""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

EXTRACTED = Path(r"d:\fnfyu\projects\408\cs408-review\extracted")
OUT = Path(r"d:\fnfyu\projects\408\cs408-review\public\data\lessons.json")
WEB_DATA = Path(r"d:\fnfyu\projects\408\cs408-review\web\public\data\lessons.json")
WEB_LESSONS = Path(r"d:\fnfyu\projects\408\cs408-review\web\public\lessons")


def preview(text: str, n: int = 280) -> str:
    m = re.search(r"\[文字\]\n(.+?)(?=\n\[|\n={10,}|\Z)", text, re.S)
    blob = (m.group(1) if m else text)[:n]
    return re.sub(r"\s+", " ", blob).strip()


def split_pages(text: str) -> list[dict]:
    pages = []
    parts = re.split(r"\n={50}\n第 (\d+) 页（共 \d+ 页）\n={50}\n", text)
    # parts: [preamble, num, body, num, body, ...]
    i = 1
    while i + 1 < len(parts):
        num = int(parts[i])
        body = parts[i + 1]
        tm = re.search(r"\[文字\]\n(.+?)(?=\n\[|\Z)", body, re.S)
        page_text = tm.group(1).strip() if tm else ""
        pages.append({"page": num, "text": page_text})
        i += 2
    return pages


def main():
    subjects = {}
    if WEB_LESSONS.exists():
        shutil.rmtree(WEB_LESSONS)
    WEB_LESSONS.mkdir(parents=True, exist_ok=True)

    if not EXTRACTED.exists():
        print("no extracted")
        return

    for sid_dir in sorted(EXTRACTED.iterdir()):
        if not sid_dir.is_dir():
            continue
        sid = sid_dir.name
        chapters = {}
        for ch_dir in sorted(sid_dir.iterdir()):
            if not ch_dir.is_dir():
                continue
            lessons = []
            for lesson_dir in sorted(ch_dir.iterdir()):
                content = lesson_dir / "content.txt"
                if not content.exists():
                    continue
                text = content.read_text(encoding="utf-8", errors="ignore")
                pages = split_pages(text)
                visual = []
                vi = lesson_dir / "visual_index.json"
                if vi.exists():
                    try:
                        visual = json.loads(vi.read_text(encoding="utf-8"))
                    except Exception:
                        visual = []

                rel = f"{sid}/{ch_dir.name}/{lesson_dir.name}"
                dest = WEB_LESSONS / rel
                dest.mkdir(parents=True, exist_ok=True)
                # 轻量页 JSON，前端逐课加载
                (dest / "pages.json").write_text(
                    json.dumps({"title": lesson_dir.name, "pages": pages}, ensure_ascii=False),
                    encoding="utf-8",
                )
                shutil.copy2(content, dest / "content.txt")

                lessons.append(
                    {
                        "id": rel,
                        "title": lesson_dir.name,
                        "pages": len(pages) or len(re.findall(r"第 \d+ 页", text)),
                        "visualPages": len(visual),
                        "preview": preview(text),
                        "pagesUrl": f"/lessons/{rel}/pages.json",
                    }
                )
            chapters[ch_dir.name] = lessons
        subjects[sid] = chapters

    payload = {"subjects": subjects}
    for path in (OUT, WEB_DATA):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    total = sum(len(ls) for chs in subjects.values() for ls in chs.values())
    print(f"lessons={total} subjects={list(subjects)} web={WEB_LESSONS}")


if __name__ == "__main__":
    main()
