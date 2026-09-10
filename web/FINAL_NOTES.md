# 最终版规则

- 350份原始PDF全部视为重点。
- 6058页全部在站内以课件页图形式保留。
- 每页都有提取文字用于检索/复习。
- 每份课件结尾总结单独作为“必须记忆”层。
- 不再使用S/A/B/C筛选或删减PDF内容。
- 总结页另生成高清版本，便于放大背诵。

## 精读重写进度

- **操作系统（85/85）已完成**（2026-09-07）：对照王道课件 dump + 考研核心考点精编，重写为可复习讲义（blocks / must_memorize），已合并进 `public/data/organized-lessons.json`。源稿在 `content/os/ch*.json`，合并脚本 `scripts/merge-os-content.mjs`。
- **数据结构（101/101）已完成**（2026-09-07）：对照王道课件 dump 精读重写为可复习讲义（blocks / must_memorize），已合并进 `public/data/organized-lessons.json`。源稿在 `content/ds/ch*.json`，合并脚本 `scripts/merge-ds-content.mjs`，规范 `content/ds/REWRITE_SPEC.md`。
  - 第一章 绪论（5/5）
  - 第二章 线性表（12/12）
  - 第三章 栈、队列和数组（13/13）
  - 第四章 串（6/6）
  - 第五章 树与二叉树（17/17）
  - 第六章 图（14/14）
  - 第七章 查找（18/18）
  - 第八章 排序（16/16）
- **计算机网络（78/78）已完成**（2026-09-10）：对照王道课件 dump 精读重写为可复习讲义（blocks / must_memorize），已合并进 `public/data/organized-lessons.json`。源稿在 `content/cn/ch*.json`，合并脚本 `scripts/merge-cn-content.mjs`，规范 `content/cn/REWRITE_SPEC.md`。
  - 第一章 计算机网络体系结构（9/9）
  - 第二章 物理层（5/5）
  - 第三章 数据链路层（22/22）
  - 第四章 网络层（26/26）
  - 第五章 传输层（10/10）
  - 第六章 应用层（6/6）
- **组成原理（86/86）已完成**（2026-09-10）：对照王道课件 dump 精读重写为可复习讲义（blocks / must_memorize），已合并进 `public/data/organized-lessons.json`。源稿在 `content/co/ch*.json`，合并脚本 `scripts/merge-co-content.mjs`，规范 `content/co/REWRITE_SPEC.md`。
  - 第一章 计算机系统概述（8/8）
  - 第二章 数据的表示和运算（26/26）
  - 第三章 存储系统（12/12）
  - 第四章 指令系统（13/13）
  - 第五章 中央处理器（14/14）
  - 第六章 总线（5/5）
  - 第七章 输入输出系统（8/8）
- 四科精读重写全部完成（DS 101 + CO 86 + OS 85 + CN 78 = 350）。
