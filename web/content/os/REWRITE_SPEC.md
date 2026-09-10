# OS 课件精读重写规范（给子代理）

目标：把 `organized-lessons.json` 里操作系统某几节的「整理正文」从 OCR 碎片，重写成**可直接复习的完整讲义**。

## 硬性要求

1. **细读** `web/_os_chN_dump.txt` 中对应 `==== os-xxx` 段落的全部课件原文；动画重复页合并，但**新增知识点不得丢**。
2. 交叉对照 `web/content/os/_jingbian_chN.md`；精编有而 dump 图示页文字缺失的，用精编补全并标对应页。
3. 广告页/“仅供娱乐”番外可精简，但正式考点必须完整。
4. 输出**合法 JSON**，结构与 `web/content/os/ch1.json` 一致：

```json
{
  "chapter": "第X章 ...",
  "chapter_order": X,
  "rewritten_at": "2026-09-07",
  "source": "细读王道课件 page_texts + 考研核心考点精编交叉核对",
  "lessons": {
    "os-0XX": {
      "blocks": [
        {
          "heading": "标题",
          "kind": "概念与原理|规则与易错|过程与算法|对比辨析|公式/代码/计算|例题与应用|图示/结论",
          "pages": [1, 2],
          "lines": ["完整通顺的中文考点句，不要 OCR 断行碎片", "..."],
          "visual_only": false
        }
      ],
      "must_memorize": [
        { "text": "可背诵的考点句", "page": 9 }
      ]
    }
  }
}
```

5. 每个 lesson：`blocks` 建议 4–10 个；`must_memorize` 建议 4–10 条；`lines` 写完整句子/要点，含 ★重点、易错、对比、公式、步骤。
6. 图示为主的页：`visual_only: true`，但仍要写清图在讲什么。
7. 例题/公式块用 kind `例题与应用` 或 `公式/代码/计算`。
8. **只写你被分配的 lesson id**，不要改其他文件除了指定输出 JSON。
9. 写完后用 `JSON.parse` 自检；文件必须 UTF-8。

## 质量标准（对照 ch1.json）

- 不是原文粘贴，而是消化后的讲义。
- 覆盖 dump 中每一页有效知识。
- 必记条目应是真正考点，不是「Tips」「学习提示」之类无效句。
