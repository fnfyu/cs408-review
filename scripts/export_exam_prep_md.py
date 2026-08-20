#!/usr/bin/env python3
"""根据结构化 JSON 生成 exam-prep 格式 Markdown 笔记。"""
from __future__ import annotations

import json
from pathlib import Path

DATA = Path(r"d:\fnfyu\projects\408\cs408-review\public\data")
OUT = Path(r"d:\fnfyu\projects\408\cs408-review\notes")


def emit_point(p: dict) -> str:
    lines = [
        f"### {p['title']} 【{p['mastery']}】",
        "",
        "#### 定义",
        p.get("bodyMd", "").strip() or "（见正文要点）",
        "",
        "#### 💬 通俗理解",
        p.get("plain", ""),
        "",
        "#### 📌 考察形式",
        p.get("examForm", ""),
        "",
    ]
    if p.get("memoryTip"):
        lines += ["#### 记忆技巧", p["memoryTip"], ""]
    lines += ["#### 小结", p.get("summary", ""), "", "---", ""]
    return "\n".join(lines)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    catalog = json.loads((DATA / "catalog.json").read_text(encoding="utf-8"))
    for s in catalog["subjects"]:
        data = json.loads((DATA / f"{s['id']}.json").read_text(encoding="utf-8"))
        parts = [
            f"# 《{data['name']}》考试重点总结",
            "",
            "本文档基于上课课件整理，覆盖全部考点。按 exam-prep skill 结构输出。",
            "",
            f"> 统计：{data['stats']['chapters']} 章 · {data['stats']['points']} 考点 · {data['stats']['figures']} 图示",
            "",
            "---",
            "",
        ]
        for ch in data["chapters"]:
            parts.append(f"## {ch['title']}")
            parts.append("")
            if ch.get("overview"):
                parts.append(ch["overview"])
                parts.append("")
            for sec in ch["sections"]:
                parts.append(f"### 模块：{sec['title']}")
                parts.append("")
                if sec.get("intro"):
                    parts.append(sec["intro"])
                    parts.append("")
                for p in sec["points"]:
                    # emit_point already starts with ###
                    body = emit_point(p).replace(f"### {p['title']}", f"#### {p['title']}", 1)
                    parts.append(body)
            if ch.get("examples"):
                parts += ["### 练习题（本章经典例题）", "", ch["examples"], ""]
            if ch.get("pitfalls"):
                parts += ["### 易错点", "", ch["pitfalls"], ""]
            parts.append("---")
            parts.append("")

        out = OUT / f"{s['id']}_考试重点总结.md"
        out.write_text("\n".join(parts), encoding="utf-8")
        print(f"wrote {out.name} ({out.stat().st_size//1024}KB)")


if __name__ == "__main__":
    main()
