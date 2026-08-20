# -*- coding: utf-8 -*-
import json
import os

p = r"d:\fnfyu\projects\408\cs408-review\public\data\os.json"
d = json.load(open(p, encoding="utf-8"))
chapters = d["chapters"]
for c in chapters:
    n = sum(len(s["points"]) for s in c["sections"])
    print(f"{c.get('id',''):20} {c.get('title','')[:40]} sections={len(c['sections'])} points={n}")
print("---")
for c in chapters:
    for s in c["sections"]:
        print(f"  SECTION {s.get('id')} {s.get('title')}")
        for pt in s["points"]:
            print(f"    {pt['id']} | {pt['title']}")
            print(f"      plain={pt.get('plain','')[:80]!r}")
            print(f"      exam={pt.get('examForm','')[:80]!r}")
            print(f"      sum={pt.get('summary','')[:80]!r}")
            has_calc = any(k in pt.get("bodyMd", "") for k in ["步骤", "算法", "计算", "公式", "例题", "伪代码", "时间片", "周转时间"])
            print(f"      bodyLen={len(pt.get('bodyMd',''))} likely_template={has_calc}")
