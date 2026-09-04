# 408 Phase 6 v7 — 部署收敛版

本版完成部署层收口。

## 新增
- Vercel SPA 回退与缓存头
- Netlify 部署配置
- GitHub Actions：`npm ci -> validate:data -> build`
- `npm run check:deploy`
- `asset-manifest.json`：核心数据与PDF的 SHA-256 / 文件大小清单
- 完整包与轻量包均可做静态资源完整性检查

## 本地检查
```bash
cd web
npm run validate:data
npm run check:deploy
npm run build
```

其中前两项不需要 React/Vite 依赖即可检查数据与静态资源。
完整 `npm run build` 仍需要先安装 npm 依赖。

## 部署
### Vercel
将仓库导入 Vercel，Root Directory 指向 `web`，Build Command 使用 `npm run build`，Output Directory 为 `dist`。

### Netlify
Root/Base 指向 `web`；`netlify.toml` 已包含 build、publish、SPA redirect 和缓存策略。

## 完整包 / 轻量包
- 完整包：包含站内代表性 PDF。
- 轻量包：不包含 `public/sources`，页面仍可运行，但课件按钮需要后续补资源或改为远端URL。
