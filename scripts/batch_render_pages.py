#!/usr/bin/env python3
"""
全量渲染全部课件页为 PNG（150 DPI，与 exam-prep pdf_extractor 一致）。
可断点续跑：已存在且非空的 page-NNN.png 会跳过。
输出：extracted/<sid>/<chapter>/<lesson>/pages/page-NNN.png
"""
from __future__ import annotations

import json
import sys
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

import fitz

EXTRACTED = Path(r"d:\fnfyu\projects\408\cs408-review\extracted")
DPI = 150
WORKERS = 6


def render_lesson(content_txt: str) -> dict:
    lesson_dir = Path(content_txt).parent
    meta_path = lesson_dir / "meta.json"
    if not meta_path.exists():
        return {"ok": False, "path": str(lesson_dir), "error": "no meta"}

    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    pdf = Path(meta["pdf"])
    if not pdf.exists():
        return {"ok": False, "path": str(lesson_dir), "error": f"missing pdf {pdf}"}

    pages_dir = lesson_dir / "pages"
    pages_dir.mkdir(exist_ok=True)

    doc = fitz.open(pdf)
    total = len(doc)
    mat = fitz.Matrix(DPI / 72, DPI / 72)
    done = skipped = 0
    visual_index = []

    for i in range(1, total + 1):
        out = pages_dir / f"page-{i:03d}.png"
        if out.exists() and out.stat().st_size > 1000:
            skipped += 1
        else:
            page = doc[i - 1]
            pix = page.get_pixmap(matrix=mat, alpha=False)
            pix.save(str(out))
            done += 1

        visual_index.append(
            {
                "page": i,
                "needs_image": True,
                "reasons": ["full render"],
                "image_path": str(out),
                "webPath": f"/lesson-pages/{lesson_dir.relative_to(EXTRACTED).as_posix()}/page-{i:03d}.png",
            }
        )

    doc.close()
    (lesson_dir / "visual_index.json").write_text(
        json.dumps(visual_index, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    meta["rendered"] = True
    meta["renderDpi"] = DPI
    meta["pages"] = total
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    return {
        "ok": True,
        "path": str(lesson_dir.relative_to(EXTRACTED)),
        "pages": total,
        "done": done,
        "skipped": skipped,
    }


def main():
    workers = int(sys.argv[1]) if len(sys.argv) > 1 else WORKERS
    jobs = sorted(str(p) for p in EXTRACTED.rglob("content.txt"))
    print(f"lessons={len(jobs)} workers={workers} dpi={DPI}")
    t0 = time.time()
    ok = fail = pages = rendered = skipped = 0

    with ProcessPoolExecutor(max_workers=workers) as ex:
        futs = {ex.submit(render_lesson, j): j for j in jobs}
        for n, fut in enumerate(as_completed(futs), 1):
            try:
                r = fut.result()
            except Exception as e:
                fail += 1
                print(f"FAIL {futs[fut]}: {e}")
                continue
            if not r.get("ok"):
                fail += 1
                print(f"FAIL {r}")
                continue
            ok += 1
            pages += r["pages"]
            rendered += r["done"]
            skipped += r["skipped"]
            if n % 10 == 0 or n == len(jobs):
                elapsed = time.time() - t0
                print(
                    f"[{n}/{len(jobs)}] ok={ok} fail={fail} "
                    f"new={rendered} skip={skipped} pages={pages} "
                    f"{elapsed:.0f}s"
                )

    print(
        f"DONE ok={ok} fail={fail} new_png={rendered} skipped={skipped} "
        f"pages={pages} in {time.time()-t0:.0f}s"
    )


if __name__ == "__main__":
    main()
