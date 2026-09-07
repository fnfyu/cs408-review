# 408 完整部署版

这版针对“文字过少”重新制作正文层。

- 32 个核心知识簇
- 143 个细粒度子考点
- 143/143 均新增完整正文
- 正文约 112,946 个中文字符（不含原有摘要、课件预览和真题证据）
- 每个子考点固定包含：概念与作用、原理展开、完整例子、408怎么考、易错点、考前速记
- 原有 122 份代表性课件 PDF 继续保留，可从页面跳转到对应页
- 原有 350 份课件目录、真题证据、S/A/B/C 权重、复习进度继续保留

## 部署
进入 `web`：

```bash
npm install
npm run validate:data
npm run check:deploy
npm run build
```

Vercel 的 Root Directory 指向 `web`，Output Directory 使用 `dist`。
