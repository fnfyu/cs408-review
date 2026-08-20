# CS408 考点复习台

基于 [王道 computer-408](https://gitee.com/what333/computer-408) 课件，按 `exam-prep` skill 结构整理的四门课复习站。

## 内容

| 科目 | 章节 | 考点 | 课件 PDF |
|------|------|------|----------|
| 操作系统 | 5 | 116 | 85 |
| 数据结构 | 8 | 104 | 101 |
| 组成原理 | 7 | 53 | 87 |
| 计算机网络 | 6 | 81 | 78 |

每条考点含：定义、通俗理解、考察形式、记忆技巧、小结；各章含经典例题 / 易错点；图示来自课件提炼；「课件原文」可按页阅读 351 节 PDF 提取文本。

## 目录

- `notes/` — exam-prep 格式 Markdown 总结
- `extracted/` — 全部 PDF 文本提取（content.txt）
- `web/` — 前端复习台（Vite + React）
- `scripts/` — 提取与构建脚本
- `public/` / `web/public/` — catalog、科目 JSON、figures、lessons

## 给朋友：直接打开（推荐）

进入 **`Outputs/`**，双击 **`打开复习台.bat`**（无需 Node）。说明见 [Outputs/README.md](Outputs/README.md)。

## 开发启动

```bash
cd web
npm install
npm run dev
```

浏览器打开提示的本地地址（默认 http://localhost:5173 ）。

重新打包给朋友用的静态站：

```bash
cd web
npm run build
```

产物写到仓库根目录 `Outputs/`。一键启动脚本在 `web/public/`，构建时会一并复制进去。

### 部署到 Vercel（独立站点）

1. 将本仓库推到 GitHub（可忽略 `extracted/`、本地 `Outputs` 构建产物）。
2. Vercel Import 后把 **Root Directory** 设为 `web`。
3. Build / Output 已由 `web/vercel.json` 配置（产出 `dist`）。
4. 部署完成后，把站点 URL 填进个人主页环境变量 `NEXT_PUBLIC_CS408_URL`。

原 PPT/PDF 请到 [Gitee computer-408](https://gitee.com/what333/computer-408) 按需打开，勿整仓上传。

重建数据：

```bash
python scripts/batch_extract_text.py   # 提取 PDF 文字
python scripts/build_catalog.py        # 考点 JSON + 复制图示
python scripts/export_exam_prep_md.py  # Markdown 笔记
python scripts/build_lessons_index.py  # 课件原文索引
# 再把 public/data 与 public/figures 同步到 web/public
```

## 说明

- `Outputs` 含考点、图示与课件文字；全量课件页 PNG（约数 GB）未打进静态包，以免仓库过大。
- 源课件版权归原作者；本仓库为学习整理与交互呈现。
