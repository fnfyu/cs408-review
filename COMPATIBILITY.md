# Phase 6 v2 兼容层

本版在 v1 知识库站点基础上补了旧站迁移兼容层。

## 新增
- `public/data/compat-index.json`：四科、章节式导航和 node lookup。
- 首页支持“卡片 / 章节式”双视图。
- 搜索范围扩大到真题证据。
- 详情页显示 importance finality、真题 scope、搜索标签。

## 与旧站的兼容策略
旧站的“章节→考点”导航可映射到 `compat-index.json`；新版每个大知识簇先作为一个章节入口，后续可继续细拆为课件原章节。

旧站的课件原文/例题页面不要删除。迁移时建议：
1. 保留旧 `lessons.json` 和课件资源；
2. 新增 `408-kb.json` 作为新的知识层；
3. 用 node/source refs 从新版考点详情跳回旧课件页；
4. 后续再把旧例题标注为对应 node/subtopic。
