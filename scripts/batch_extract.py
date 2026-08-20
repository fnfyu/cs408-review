#!/usr/bin/env python3
"""
批量提取 computer-408 全部 PDF：文字 + 需贴图页渲染。
输出到 extracted/<subject>/<chapter>/<lesson>/
"""
from __future__ import annotations

import json
import re
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

import fitz

SRC = Path(r"d:\fnfyu\projects\408\computer-408-src")
OUT = Path(r"d:\fnfyu\projects\408\cs408-review\extracted")
EXTRACTOR = Path(r"d:\fnfyu\projects\408\exam-prep\exam-prep\pdf_extractor.py")

SUBJECTS = {
    "os": "【课件】操作系统基础考点讲解",
    "ds": "【课件】数据结构基础考点讲解",
    "coa": "【课件】组成原理基础考点讲解",
    "net": "【课件】计算机网络基础考的讲解",
}

# 渲染缩放：约 120 DPI，兼顾清晰与体积
ZOOM = 1.25


def detect_visual_need(page, page_num: int, text: str) -> dict:
    reasons = []
    image_list = page.get_images(full=True)
    if image_list:
        reasons.append(f"含 {len(image_list)} 张嵌入图片")
    try:
        tables = page.find_tables()
        if tables.tables:
            reasons.append(f"含 {len(tables.tables)} 个表格")
    except Exception:
        pass
    blocks = page.get_text("blocks")
    img_blocks = [b for b in blocks if len(b) > 6 and b[6] == 1]
    if img_blocks and len(text.strip()) < 100:
        reasons.append("页面以图片为主")
    # 文字很少也贴图（流程图页）
    if len(text.strip()) < 40 and page.get_drawings():
        reasons.append("矢量图示为主")
    return {
        "page": page_num,
        "needs_image": len(reasons) > 0,
        "reasons": reasons,
        "image_path": None,
    }


def safe_name(name: str) -> str:
    name = re.sub(r'[<>:"/\\|?*]', "_", name)
    return name.strip().rstrip(".")[:120]


def extract_one(pdf_path: str, out_dir: str) -> dict:
    pdf = Path(pdf_path)
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    pages_dir = out / "pages"
    pages_dir.mkdir(exist_ok=True)
    images_dir = out / "images"
    images_dir.mkdir(exist_ok=True)

    doc = fitz.open(pdf)
    report = []
    visual_index = []
    mat = fitz.Matrix(ZOOM, ZOOM)

    for i, page in enumerate(doc, 1):
        text = page.get_text("text")
        lines = [
            f"\n{'=' * 50}",
            f"第 {i} 页（共 {len(doc)} 页）",
            f"{'=' * 50}",
        ]
        if text.strip():
            lines.append(f"\n[文字]\n{text.strip()}")

        # 嵌入图
        for img_i, img in enumerate(page.get_images(full=True), 1):
            xref = img[0]
            try:
                pix = fitz.Pixmap(doc, xref)
                if pix.n >= 5:
                    pix = fitz.Pixmap(fitz.csRGB, pix)
                fname = f"page{i:03d}_img{img_i}.png"
                pix.save(str(images_dir / fname))
                lines.append(f"\n[嵌入图片：{fname}]")
            except Exception as e:
                lines.append(f"\n[嵌入图片提取失败：{e}]")

        # 表格
        try:
            tabs = page.find_tables()
            for ti, tab in enumerate(tabs.tables, 1):
                data = tab.extract()
                tbl = "\n".join(" | ".join((c or "").strip() for c in row) for row in data)
                lines.append(f"\n[表格{ti}]\n{tbl}")
        except Exception:
            pass

        vinfo = detect_visual_need(page, i, text)
        if vinfo["needs_image"]:
            img_path = pages_dir / f"page-{i:03d}.png"
            pix = page.get_pixmap(matrix=mat, alpha=False)
            pix.save(str(img_path))
            vinfo["image_path"] = str(img_path)
            lines.append(
                f"\n[⚠️ 建议在复习资料中贴图]\n"
                f"[渲染图路径] {img_path}\n"
                f"[原因] {', '.join(vinfo['reasons'])}"
            )
            visual_index.append(vinfo)

        report.append("\n".join(lines))

    content_path = out / "content.txt"
    content_path.write_text("\n".join(report), encoding="utf-8")
    index_path = out / "visual_index.json"
    index_path.write_text(json.dumps(visual_index, ensure_ascii=False, indent=2), encoding="utf-8")

    meta = {
        "pdf": str(pdf),
        "pages": len(doc),
        "visual_pages": len(visual_index),
        "out": str(out),
    }
    (out / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    doc.close()
    return meta


def collect_jobs() -> list[tuple[str, str, str, str]]:
    jobs = []
    for sid, folder in SUBJECTS.items():
        root = SRC / folder
        if not root.exists():
            continue
        for pdf in sorted(root.rglob("*.pdf")):
            # 跳过临时/隐藏
            if any(p.startswith(".") or p.startswith("~") for p in pdf.parts):
                continue
            rel = pdf.relative_to(root)
            chapter = safe_name(rel.parts[0] if len(rel.parts) > 1 else "未分章")
            lesson = safe_name(pdf.stem)
            out = OUT / sid / chapter / lesson
            jobs.append((sid, str(pdf), str(out), f"{sid}/{chapter}/{lesson}"))
    return jobs


def main():
    workers = int(sys.argv[1]) if len(sys.argv) > 1 else 4
    jobs = collect_jobs()
    print(f"共 {len(jobs)} 个 PDF，workers={workers}")
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = []
    t0 = time.time()
    done = 0
    errors = []

    # 顺序也可；多进程加速
    with ProcessPoolExecutor(max_workers=workers) as ex:
        futs = {ex.submit(extract_one, pdf, out): key for _, pdf, out, key in jobs}
        for fut in as_completed(futs):
            key = futs[fut]
            done += 1
            try:
                meta = fut.result()
                manifest.append({"key": key, **meta})
                print(f"[{done}/{len(jobs)}] OK {key} pages={meta['pages']} visual={meta['visual_pages']}")
            except Exception as e:
                errors.append({"key": key, "error": str(e)})
                print(f"[{done}/{len(jobs)}] FAIL {key}: {e}")

    (OUT / "manifest.json").write_text(
        json.dumps({"jobs": len(jobs), "ok": len(manifest), "errors": errors, "items": manifest}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"完成：{len(manifest)}/{len(jobs)}，耗时 {time.time()-t0:.1f}s，错误 {len(errors)}")


if __name__ == "__main__":
    main()
