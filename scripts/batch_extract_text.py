#!/usr/bin/env python3
"""仅提取 PDF 文字（不渲染），用于磁盘紧张时补齐剩余课件。"""
from __future__ import annotations

import json
import re
import sys
import time
from pathlib import Path

import fitz

SRC = Path(r"d:\fnfyu\projects\408\computer-408-src")
OUT = Path(r"d:\fnfyu\projects\408\cs408-review\extracted")

SUBJECTS = {
    "os": "【课件】操作系统基础考点讲解",
    "ds": "【课件】数据结构基础考点讲解",
    "coa": "【课件】组成原理基础考点讲解",
    "net": "【课件】计算机网络基础考的讲解",
}


def safe_name(name: str) -> str:
    name = re.sub(r'[<>:"/\\|?*]', "_", name)
    return name.strip().rstrip(".")[:120]


def extract_text_only(pdf: Path, out: Path) -> dict:
    out.mkdir(parents=True, exist_ok=True)
    content_path = out / "content.txt"
    if content_path.exists() and content_path.stat().st_size > 50:
        return {"pdf": str(pdf), "pages": -1, "skipped": True}

    doc = fitz.open(pdf)
    report = []
    visual_index = []
    for i, page in enumerate(doc, 1):
        text = page.get_text("text")
        lines = [f"\n{'='*50}", f"第 {i} 页（共 {len(doc)} 页）", f"{'='*50}"]
        if text.strip():
            lines.append(f"\n[文字]\n{text.strip()}")
        imgs = page.get_images(full=True)
        if imgs:
            lines.append(f"\n[嵌入图片：{len(imgs)} 张]")
            visual_index.append({"page": i, "needs_image": True, "reasons": [f"{len(imgs)} images"]})
        try:
            tabs = page.find_tables()
            for ti, tab in enumerate(tabs.tables, 1):
                data = tab.extract()
                tbl = "\n".join(" | ".join((c or "").strip() for c in row) for row in data)
                if tbl.strip():
                    lines.append(f"\n[表格{ti}]\n{tbl}")
        except Exception:
            pass
        report.append("\n".join(lines))

    content_path.write_text("\n".join(report), encoding="utf-8")
    (out / "visual_index.json").write_text(
        json.dumps(visual_index, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    meta = {"pdf": str(pdf), "pages": len(doc), "visual_pages": len(visual_index), "skipped": False}
    (out / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    doc.close()
    return meta


def main():
    jobs = []
    for sid, folder in SUBJECTS.items():
        root = SRC / folder
        for pdf in sorted(root.rglob("*.pdf")):
            if any(p.startswith(".") or p.startswith("~") for p in pdf.parts):
                continue
            rel = pdf.relative_to(root)
            chapter = safe_name(rel.parts[0] if len(rel.parts) > 1 else "未分章")
            lesson = safe_name(pdf.stem)
            out = OUT / sid / chapter / lesson
            jobs.append((sid, pdf, out))

    print(f"jobs={len(jobs)}")
    t0 = time.time()
    ok = skip = fail = 0
    for i, (sid, pdf, out) in enumerate(jobs, 1):
        try:
            meta = extract_text_only(pdf, out)
            if meta.get("skipped"):
                skip += 1
            else:
                ok += 1
            if i % 20 == 0 or i == len(jobs):
                print(f"[{i}/{len(jobs)}] ok={ok} skip={skip} fail={fail}")
        except Exception as e:
            fail += 1
            print(f"FAIL {pdf.name}: {e}")
    print(f"done in {time.time()-t0:.1f}s ok={ok} skip={skip} fail={fail}")


if __name__ == "__main__":
    main()
