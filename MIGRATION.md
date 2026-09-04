# Phase 6 集成说明

本包是可独立运行的 Vite + React 版本，数据来自 Phase 5 最终知识库。

## 与旧站的关系

旧站：`catalog.json + 四科 SubjectData + lessons.json`
新站：`408-kb.json` 单一知识库数据源

当前新版保留：
- 四科入口
- 全局搜索
- 考点详情

新增：
- S/A/B/C 重要度筛选
- 143 个细粒度子考点
- 图示“如何理解”的文字说明
- 标准解题模型
- 高频陷阱
- 真题证据
- 原始课件 PDF + 页码追溯

## 运行

```bash
cd web
npm install
npm run dev
```

构建：
```bash
npm run build
```

## 接入原仓库

可先把原 `web/` 目录备份，然后用本包 `web/` 替换测试。
如果要保留旧站的“课件原文阅读”和“例题练习”，下一轮将旧 `lessons.json` 与旧 SubjectData 作为兼容数据源重新接入新版详情页即可。
