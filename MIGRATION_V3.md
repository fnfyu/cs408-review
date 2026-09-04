# 从旧 cs408-review 迁移到 v3

建议保留旧站原有的例题/课件阅读资源，并把 v3 作为新的知识层入口。

1. 用 v3 的 `web/src` 替换或合并旧前端。
2. 将 `web/public/data/408-kb.json`、`compat-index.json`、`source-map.json`、`source-audit.json` 放入静态数据目录。
3. 如果接受约 261 MB 静态资源，将 `web/public/sources/` 一并部署；否则把这些 PDF 放到对象存储并重写 `asset_path`。
4. 旧 `lessons.json` 暂不删除。后续可以按 `source_relpath -> node_ids` 映射，把旧例题/课件原文挂到新版考点详情。
5. `source-audit.json` 中 `exclude_old_syllabus` 默认不进入主复习链；`supplement/optional` 默认折叠。
