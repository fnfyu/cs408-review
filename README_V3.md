# 408 Review Phase 6 v3

这一版把新知识库与原始课件资源真正连起来。

## 已完成
- 32 个核心知识簇、143 个细粒度子考点。
- 350 份原始课件完整审计目录。
- 122 份被知识库引用的代表性 PDF 直接随站点打包（约 261 MB）。
- 考点详情页可直接打开对应原课件，并用 `#page=N` 尝试跳到引用页。
- 新增“原课件目录”视图，按四科原始章节浏览全部 350 份资料。
- 原课件条目保留 `candidate_core / exclude_old_syllabus / supplement / optional ...` 等审计状态。
- 被代表性引用的原课件可以直接打开 PDF；其余资料仍保留压缩包名和内部路径，后续可按需全量挂载。

## 数据文件
- `web/public/data/408-kb.json`：主知识库。
- `web/public/data/compat-index.json`：知识章节 + 原始课件章节兼容索引。
- `web/public/data/source-map.json`：代表性 PDF 映射。
- `web/public/data/source-audit.json`：350 份课件完整审计表。
- `SOURCE_INTEGRITY.json`：资源完整性检查。

## 部署注意
122 份代表性 PDF 约 261 MB。Vercel/GitHub 等平台的单次部署、仓库大小或带宽限制需要单独确认；如果平台不适合直接托管 PDF，可以把 `public/sources` 移到对象存储，只需批量改 `asset_path`，知识库结构不变。
