#!/usr/bin/env python3
"""
把四门课已有「考研核心考点精编」Markdown 解析为前端可用的结构化 JSON，
并按 exam-prep skill 字段补齐：mastery / plain / examForm / tip / template / summary。
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(r"d:\fnfyu\projects\408")
OUT = ROOT / "cs408-review" / "public" / "data"

SOURCES = {
    "os": {
        "id": "os",
        "name": "操作系统",
        "short": "OS",
        "color": "#0f6e56",
        "md": ROOT / "computer-408-src" / "【课件】操作系统基础考点讲解" / "_output" / "操作系统_考研核心考点精编.md",
        "figures": ROOT / "computer-408-src" / "【课件】操作系统基础考点讲解" / "_output" / "figures",
    },
    "ds": {
        "id": "ds",
        "name": "数据结构",
        "short": "DS",
        "color": "#185fa5",
        "md": ROOT / "computer-408-src" / "【课件】数据结构基础考点讲解" / "_output" / "数据结构_考研核心考点精编.md",
        "figures": ROOT / "computer-408-src" / "【课件】数据结构基础考点讲解" / "_output" / "figures",
    },
    "coa": {
        "id": "coa",
        "name": "计算机组成原理",
        "short": "COA",
        "color": "#854f0b",
        "md": ROOT / "computer-408-src" / "【课件】组成原理基础考点讲解" / "知识总结" / "计算机组成原理_考研核心考点精编.md",
        "figures": ROOT / "computer-408-src" / "【课件】组成原理基础考点讲解" / "知识总结" / "figures",
    },
    "net": {
        "id": "net",
        "name": "计算机网络",
        "short": "NET",
        "color": "#993c1d",
        "md": ROOT / "computer-408-src" / "【课件】计算机网络基础考的讲解" / "_output" / "计算机网络_考研核心考点精编.md",
        "figures": ROOT / "computer-408-src" / "【课件】计算机网络基础考的讲解" / "_output" / "figures",
    },
}

# 根据标题关键词推断掌握程度与考察形式
MASTER_KEYWORDS = ("必背", "重点", "核心", "每年", "高频", "必考")
CALC_KEYWORDS = (
    "算法",
    "计算公式",
    "地址变换",
    "页表项",
    "调度算法",
    "页面置换",
    "CRC",
    "校验码",
    "海明",
    "路由表",
    "RTT",
    "滑动窗口",
    "信道利用率",
    "吞吐",
    "缺页率",
    "平均周转",
    "寻道",
    "磁道",
    "有效存取",
    "Cache 命中",
    "流水线吞吐",
    "指令周期",
    "散列",
    "时间复杂度",
)

# 高频考点口语化解释（标题子串匹配）
PLAIN_HINTS = {
    "并发": "像一个人同时炒两道菜：宏观上两盘都在做，微观上是切一会、炒一会地切换。",
    "并行": "像两个人同时炒两道菜：同一时刻真的在做不同的事，需要多核 CPU。",
    "共享": "多个进程要共用同一份资源；有的资源必须轮流独占（互斥），有的可以宏观上一起用。",
    "虚拟": "把一份真实硬件“变戏法”成多份逻辑资源，例如假的多 CPU、假的超大内存。",
    "异步": "进程不能一口气跑完，总是走走停停，前进速度不可预知。",
    "内核态": "操作系统“开挂模式”：能执行特权指令、管硬件；应用程序平时在用户态。",
    "用户态": "普通程序的安全模式：只能干加减乘除这类安全事，碰硬件必须找系统调用。",
    "中断": "外面来的“叫停铃”，让 CPU 立刻把控制权还给操作系统。",
    "异常": "当前指令自己惹的祸（除零、缺页、系统调用陷阱），也从内部打断执行。",
    "系统调用": "应用程序求操作系统办事的唯一正规窗口，像去柜台办业务。",
    "进程": "正在运行的程序实例：有自己的身份、资源与运行现场。",
    "线程": "进程里更轻的执行流；同进程线程共享地址空间，切换更便宜。",
    "死锁": "几个进程互相拿着对方要的东西不放，谁也走不动——像十字路口四车互卡。",
    "银行家算法": "银行只在“借出去后系统仍安全”时才放贷，用预判避免走进死锁。",
    "信号量": "用一个可加减的计数器协调谁能进临界区、谁该等谁（PV 操作）。",
    "页表": "逻辑页号到物理块号的“门牌对照表”，地址变换靠它。",
    "快表": "页表的高速缓存（TLB），命中就少访问一次内存。",
    "缺页": "要访问的页不在内存，触发中断，操作系统把页从磁盘调进来。",
    "置换": "内存满了还要进新页时，挑一页踢出去；OPT/FIFO/LRU/CLOCK 是不同踢人策略。",
    "时间片": "CPU 轮流给进程一小段运行时间，到点就换人，保证大家都能动。",
    "栈": "后进先出的桶：最后放进去的最先拿出来，适合括号匹配、函数调用。",
    "队列": "先进先出的队伍：谁先来谁先走，适合广度优先、缓冲。",
    "二叉树": "每个结点最多两个孩子的树；很多查找、排序、表达结构都靠它。",
    "图": "结点之间任意连线的结构，用来表达关系网、路线、依赖。",
    "哈希": "用函数把关键字直接映射到存放位置，理想情况一次到位。",
    "排序": "把无序序列排成有序；不同算法在比较次数、是否稳定、是否原地之间权衡。",
    "流水线": "把指令拆成取指/译码/执行等站，多条指令重叠推进，像工厂流水线。",
    "Cache": "CPU 和主存之间的高速小本本，放最近常用的数据，躲开慢内存。",
    "寻址": "指令告诉 CPU 操作数在哪：立即数、寄存器、内存地址等不同找法。",
    "总线": "芯片之间共用的数据公路，同一时刻通常只能一组设备说话。",
    "CRC": "在数据后附加校验码，收方用同一生成多项式验算，能发现传输出错。",
    "滑动窗口": "一次允许多帧在途，靠窗口大小控制节奏，提升停等协议效率。",
    "路由": "在网络中为数据包选下一跳/路径，像快递分拣中心决定往哪送。",
    "TCP": "面向连接、可靠、有流量/拥塞控制的传输；适合网页、文件。",
    "UDP": "无连接、尽力而为的轻量传输；适合视频、DNS 等能容忍丢包的场景。",
    "IP": "网络层给每台主机编号并负责跨网转发，是互联网的“门牌+物流”。",
    "DNS": "把好记的域名翻译成 IP 地址的电话簿服务。",
    "HTTP": "浏览器和服务器之间的应用层约定：要什么资源、怎么回。",
}


def infer_mastery(title: str, body: str) -> str:
    blob = title + body
    if "了解" in title or "选修" in title or "番外" in title:
        return "了解"
    if any(k in blob for k in MASTER_KEYWORDS) or body.count("★ 重点") >= 2:
        return "熟练掌握"
    if any(k in blob for k in CALC_KEYWORDS) or "例题" in body:
        return "掌握"
    return "理解"


def infer_exam_form(title: str, body: str) -> str:
    calc = any(k in title + body for k in CALC_KEYWORDS)
    if calc and ("对比" in body or "区别" in body or "分类" in body):
        return "选择题考概念辨析与对比；综合题要求按步骤计算并写出中间量"
    if calc:
        return "选择题考公式与结果；综合题要求完整分步计算"
    if "区别" in body or "对比" in body or "vs" in title.lower():
        return "选择题考概念对比与易混点辨析"
    if "过程" in body or "步骤" in body or "流程" in body:
        return "选择题考步骤顺序；简答题考完整过程描述"
    return "选择题考定义、特征与分类；偶有简答"


def make_plain(title: str, body: str) -> str:
    """优先用口语化提示，否则从“是指/就是”等定义句提炼。"""
    for key, hint in PLAIN_HINTS.items():
        if key.lower() in title.lower() or key in title:
            return hint

    m = re.search(r"(?:是指|是指：|就是|称为)([^。\n]{8,80})", body)
    if m:
        return _clip(f"一句话：{m.group(1).strip()}。", 140)

    for line in body.splitlines():
        s = line.strip()
        if s.startswith("- ") and len(s) > 24:
            s = s[2:].strip()
            s = re.sub(r"^[①②③④⑤⑥⑦⑧⑨⑩\d\.、]+", "", s).strip()
            if "是" in s[:20] or "指" in s[:12]:
                return _clip(s, 120)
    return f"先抓住「{title}」要解决什么问题，再记定义、对比表和易错点。"


def _clip(s: str, n: int) -> str:
    s = re.sub(r"\*\*|`", "", s)
    return s if len(s) <= n else s[: n - 1] + "…"


def make_tip(title: str, body: str) -> str | None:
    # 抓 ★ 重点行
    tips = re.findall(r">\s*\*\*★\s*重点\*\*[：:]\s*(.+)", body)
    if tips:
        return "；".join(_clip(t.strip(), 80) for t in tips[:3])
    return None


def parse_md(text: str, subject_id: str) -> dict:
    lines = text.splitlines()
    chapters = []
    cur_ch = None
    cur_sec = None
    cur_kp = None
    overview = ""
    mode = None  # overview / section / examples / pitfalls
    buf: list[str] = []

    def flush_kp():
        nonlocal cur_kp, buf
        if cur_kp is None:
            buf = []
            return
        body = "\n".join(buf).strip()
        cur_kp["bodyMd"] = body
        cur_kp["mastery"] = infer_mastery(cur_kp["title"], body)
        cur_kp["plain"] = make_plain(cur_kp["title"], body)
        cur_kp["examForm"] = infer_exam_form(cur_kp["title"], body)
        tip = make_tip(cur_kp["title"], body)
        if tip:
            cur_kp["memoryTip"] = tip
        # 小结：最后一段短句或易错提示
        cur_kp["summary"] = _clip(cur_kp["plain"], 80)
        if cur_sec is not None:
            cur_sec["points"].append(cur_kp)
        elif cur_ch is not None:
            # 无二级节时挂到默认节
            if not cur_ch["sections"]:
                cur_ch["sections"].append({"id": f"{cur_ch['id']}-main", "title": "本章要点", "points": []})
            cur_ch["sections"][-1]["points"].append(cur_kp)
        cur_kp = None
        buf = []

    def flush_special(kind: str):
        nonlocal buf, mode
        content = "\n".join(buf).strip()
        if cur_ch is not None and content:
            cur_ch[kind] = content
        buf = []
        mode = None

    i = 0
    # 跳过文档标题
    while i < len(lines) and not lines[i].startswith("# "):
        i += 1
    # 文档一级标题
    if i < len(lines) and lines[i].startswith("# "):
        doc_title = lines[i][2:].strip()
        i += 1
    else:
        doc_title = subject_id

    while i < len(lines):
        line = lines[i]
        if line.startswith("# ") and not line.startswith("##"):
            # 新章
            flush_kp()
            if mode in ("examples", "pitfalls"):
                flush_special(mode)
            title = line[2:].strip()
            # 跳过文档总标题重复
            if title == doc_title or "考研核心" in title:
                i += 1
                continue
            ch_id = f"{subject_id}-ch{len(chapters)+1}"
            cur_ch = {
                "id": ch_id,
                "title": title,
                "overview": "",
                "sections": [],
                "examples": "",
                "pitfalls": "",
            }
            chapters.append(cur_ch)
            cur_sec = None
            overview_buf = []
            # 读考情速览直到下一个 ##
            i += 1
            while i < len(lines) and not lines[i].startswith("#"):
                overview_buf.append(lines[i])
                i += 1
            cur_ch["overview"] = "\n".join(overview_buf).strip()
            continue

        if line.startswith("## "):
            flush_kp()
            title = line[3:].strip()
            if title.startswith("经典例题"):
                if mode in ("examples", "pitfalls"):
                    flush_special(mode)
                mode = "examples"
                buf = []
                i += 1
                continue
            if title.startswith("易错点"):
                if mode == "examples":
                    flush_special("examples")
                mode = "pitfalls"
                buf = []
                i += 1
                continue
            mode = None
            if cur_ch is None:
                i += 1
                continue
            sec_id = f"{cur_ch['id']}-s{len(cur_ch['sections'])+1}"
            cur_sec = {"id": sec_id, "title": title, "points": []}
            cur_ch["sections"].append(cur_sec)
            i += 1
            continue

        if line.startswith("### ") and mode not in ("examples", "pitfalls"):
            flush_kp()
            title = line[4:].strip()
            kp_id = f"{(cur_sec or cur_ch or {'id': subject_id})['id']}-p{len((cur_sec['points'] if cur_sec else []) if cur_sec else [])+1}"
            # fix id
            if cur_sec is not None:
                kp_id = f"{cur_sec['id']}-p{len(cur_sec['points'])+1}"
            elif cur_ch is not None:
                kp_id = f"{cur_ch['id']}-p{len(cur_ch.get('_orphan', []))+1}"
            cur_kp = {"id": kp_id, "title": title}
            buf = []
            i += 1
            continue

        # 正文
        if mode in ("examples", "pitfalls"):
            buf.append(line)
        elif cur_kp is not None:
            buf.append(line)
        elif cur_sec is not None and line.strip():
            # 节下直接正文 → 作为节引言
            cur_sec.setdefault("intro", "")
            cur_sec["intro"] = (cur_sec.get("intro", "") + "\n" + line).strip()
        i += 1

    flush_kp()
    if mode in ("examples", "pitfalls"):
        flush_special(mode)

    return {
        "id": subject_id,
        "title": doc_title,
        "chapters": chapters,
    }


def copy_figures(src: Path, dest: Path) -> list[str]:
    dest.mkdir(parents=True, exist_ok=True)
    names = []
    if not src.exists():
        return names
    for f in sorted(src.glob("*.*")):
        if f.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".gif"}:
            target = dest / f.name
            target.write_bytes(f.read_bytes())
            names.append(f.name)
    return names


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    catalog = {"subjects": [], "generatedAt": None}
    import datetime

    catalog["generatedAt"] = datetime.datetime.now().isoformat(timespec="seconds")

    for sid, meta in SOURCES.items():
        print(f"解析 {sid} ...")
        text = meta["md"].read_text(encoding="utf-8")
        data = parse_md(text, sid)
        data["name"] = meta["name"]
        data["short"] = meta["short"]
        data["color"] = meta["color"]
        figs = copy_figures(meta["figures"], OUT.parent / "figures" / sid)
        data["figures"] = [f"/figures/{sid}/{n}" for n in figs]

        # 统计
        n_points = sum(len(s["points"]) for ch in data["chapters"] for s in ch["sections"])
        data["stats"] = {
            "chapters": len(data["chapters"]),
            "points": n_points,
            "figures": len(figs),
        }
        out_path = OUT / f"{sid}.json"
        out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        catalog["subjects"].append(
            {
                "id": sid,
                "name": meta["name"],
                "short": meta["short"],
                "color": meta["color"],
                "stats": data["stats"],
                "dataFile": f"/data/{sid}.json",
            }
        )
        print(f"  chapters={data['stats']['chapters']} points={n_points} figures={len(figs)}")

    (OUT / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    print("写完 catalog.json")


if __name__ == "__main__":
    main()
