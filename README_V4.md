# 408 Review v4

本版是在 v3 上的最终收敛版候选：

- 32 个核心知识簇、143 个细粒度子考点
- 350 份原课件兼容桥
- 122 份代表性 PDF 随站点打包
- 课件来源可直接跳对应 PDF 页
- S/A/B/C 筛选、搜索、原课件目录
- 新增本地复习进度（localStorage）
- 新增 `legacy-lessons-bridge.json`，把旧站 lessons 结构映射到新版知识节点
- 新增 `review-paths.json`，支持后续做按科/按优先级学习路径

## 数据文件

- `web/public/data/408-kb.json`：主知识库
- `web/public/data/compat-index.json`：原章节/课件兼容索引
- `web/public/data/legacy-lessons-bridge.json`：旧 lessons → 新节点/PDF 桥
- `web/public/data/review-paths.json`：复习顺序
- `web/public/data/source-audit.json`：350 份课件审计
- `web/public/data/source-map.json`：代表性 PDF 资源映射

## 开发/部署

```bash
cd web
npm install
npm run build
```

Vercel Root Directory 设为 `web`。

## 当前验证

数据完整性已通过：32/32 节点、143 子考点、350 旧课件桥、122 PDF；所有已打包 PDF 引用无断链。

当前执行环境无法完成 npm 依赖下载，因此没有声明本轮 `npm run build` 已通过。部署前应在可联网 Node 环境跑一次 build。
