import { useEffect, useMemo, useState } from 'react'
import { GITEE_REPO, giteeLessonUrl, giteeSubjectUrl } from './gitee'
import { Markdown } from './Markdown'
import type {
  Catalog,
  Chapter,
  KnowledgePoint,
  LessonItem,
  LessonsCatalog,
  SubjectData,
  View,
} from './types'

const cache = new Map<string, SubjectData>()

/** 兼容 Vite base（如 `./`），让静态包可放在任意子目录 */
function assetUrl(path: string) {
  if (!path.startsWith('/')) return path
  const base = import.meta.env.BASE_URL || '/'
  return `${base.replace(/\/?$/, '/')}${path.slice(1)}`
}

async function loadSubject(id: string, dataFile: string): Promise<SubjectData> {
  if (cache.has(id)) return cache.get(id)!
  const res = await fetch(assetUrl(dataFile))
  const data = (await res.json()) as SubjectData
  cache.set(id, data)
  return data
}

function masteryClass(m: string) {
  if (m === '熟练掌握') return 'badge hard'
  if (m === '掌握') return 'badge master'
  return 'badge'
}

function findChapter(subject: SubjectData, chapterId: string): Chapter | undefined {
  return subject.chapters.find((c) => c.id === chapterId)
}

function findPoint(chapter: Chapter, pointId: string): KnowledgePoint | undefined {
  for (const s of chapter.sections) {
    const p = s.points.find((x) => x.id === pointId)
    if (p) return p
  }
  return undefined
}

function extractQuizBlocks(md: string): { q: string; a: string }[] {
  if (!md) return []
  const parts = md.split(/(?=【例题】|^\*\*题)/m).filter((p) => p.trim())
  return parts.map((block) => {
    const ansIdx = block.search(/\*\*解[：:]|\*\*答案[：:]|解题过程/)
    if (ansIdx < 0) return { q: block.trim(), a: '' }
    return { q: block.slice(0, ansIdx).trim(), a: block.slice(ansIdx).trim() }
  }).filter((x) => x.q.length > 20)
}

export default function App() {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [lessons, setLessons] = useState<LessonsCatalog | null>(null)
  const [view, setView] = useState<View>({ kind: 'home' })
  const [subject, setSubject] = useState<SubjectData | null>(null)
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})

  useEffect(() => {
    fetch(assetUrl('/data/catalog.json'))
      .then((r) => r.json())
      .then(setCatalog)
      .catch(console.error)
    fetch(assetUrl('/data/lessons.json'))
      .then((r) => r.json())
      .then(setLessons)
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (view.kind === 'home' || view.kind === 'search') {
      setSubject(null)
      return
    }
    if (!catalog) return
    const meta = catalog.subjects.find((s) => s.id === view.subjectId)
    if (!meta) return
    setLoading(true)
    loadSubject(meta.id, meta.dataFile)
      .then(setSubject)
      .finally(() => setLoading(false))
  }, [view, catalog])

  const searchHits = useMemo(() => {
    if (view.kind !== 'search' || !catalog || !q.trim()) return []
    const needle = q.trim().toLowerCase()
    const hits: { subjectId: string; subjectName: string; chapterId: string; chapterTitle: string; point: KnowledgePoint }[] = []
    for (const s of [...cache.values()]) {
      for (const ch of s.chapters) {
        for (const sec of ch.sections) {
          for (const p of sec.points) {
            const blob = `${p.title}\n${p.plain}\n${p.bodyMd}`.toLowerCase()
            if (blob.includes(needle)) {
              hits.push({
                subjectId: s.id,
                subjectName: s.name,
                chapterId: ch.id,
                chapterTitle: ch.title,
                point: p,
              })
            }
          }
        }
      }
    }
    return hits.slice(0, 80)
  }, [view, q, subject, catalog])

  // preload all subjects for search
  useEffect(() => {
    if (!catalog) return
    catalog.subjects.forEach((s) => {
      loadSubject(s.id, s.dataFile).catch(() => {})
    })
  }, [catalog])

  const subjectColor = subject?.color ?? 'var(--accent)'

  return (
    <div className="app-shell" style={{ ['--subject' as string]: subjectColor }}>
      <header className="topbar">
        <button className="brand" onClick={() => setView({ kind: 'home' })}>
          <span className="brand-kicker">CS 408 Exam Prep</span>
          <span className="brand-title">408 考点复习台</span>
        </button>
        <form
          className="search-box"
          onSubmit={(e) => {
            e.preventDefault()
            if (q.trim()) setView({ kind: 'search', q: q.trim() })
          }}
        >
          <span aria-hidden>⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索考点、概念、算法…"
          />
        </form>
      </header>

      {view.kind === 'home' && catalog && (
        <>
          <section className="hero">
            <div>
              <h1>把王道四门课件，收成可检索的考点台</h1>
              <p>
                覆盖操作系统、数据结构、组成原理、计算机网络。每条考点按 exam-prep 结构整理：定义、通俗理解、考察形式、记忆技巧与经典例题；并可翻看 351 节课件原文。
              </p>
            </div>
            <div className="hero-meta">
              <div>
                <strong>{catalog.subjects.reduce((a, s) => a + s.stats.points, 0)}</strong>
                结构化考点
              </div>
              <div>
                <strong>
                  {catalog.subjects.reduce((a, s) => a + s.stats.chapters, 0)}
                </strong>
                章节 · 图示 {catalog.subjects.reduce((a, s) => a + s.stats.figures, 0)} · 课件{' '}
                {lessons
                  ? Object.values(lessons.subjects).reduce(
                      (a, chs) => a + Object.values(chs).reduce((b, ls) => b + ls.length, 0),
                      0,
                    )
                  : 351}
              </div>
            </div>
            <p className="point-plain" style={{ marginTop: 14 }}>
              原课件不托管在本站，需要 PPT/PDF 时到{' '}
              <a className="ext-link" href={GITEE_REPO} target="_blank" rel="noreferrer">
                Gitee · computer-408
              </a>{' '}
              按需打开（仅供学习整理）。
            </p>
          </section>
          <div className="subject-grid">
            {catalog.subjects.map((s) => (
              <button
                key={s.id}
                className="subject-card"
                style={{ ['--subject' as string]: s.color }}
                onClick={() =>
                  setView({
                    kind: 'chapter',
                    subjectId: s.id,
                    chapterId: '',
                    tab: 'points',
                  })
                }
              >
                <div className="short">{s.short}</div>
                <h2>{s.name}</h2>
                <div className="stats">
                  <span>{s.stats.chapters} 章</span>
                  <span>{s.stats.points} 考点</span>
                  <span>{s.stats.figures} 图</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {(view.kind === 'subject' ||
        view.kind === 'chapter' ||
        view.kind === 'point' ||
        view.kind === 'quiz' ||
        view.kind === 'lesson') &&
        (loading || !subject ? (
          <div className="loading">加载科目内容…</div>
        ) : (
          <SubjectWorkspace
            subject={subject}
            view={view}
            setView={setView}
            revealed={revealed}
            setRevealed={setRevealed}
            subjectLessons={lessons?.subjects[subject.id] ?? {}}
          />
        ))}

      {view.kind === 'search' && (
        <div className="panel">
          <button className="back-btn" onClick={() => setView({ kind: 'home' })}>← 返回首页</button>
          <div className="panel-head">
            <div>
              <h1>搜索：{view.q}</h1>
              <p>在已加载科目中匹配标题与正文（最多 80 条）</p>
            </div>
          </div>
          {searchHits.length === 0 ? (
            <div className="empty">暂无结果，换个关键词试试。</div>
          ) : (
            searchHits.map((h) => (
              <div
                key={h.point.id + h.subjectId}
                className="point-card"
                onClick={() =>
                  setView({
                    kind: 'point',
                    subjectId: h.subjectId,
                    chapterId: h.chapterId,
                    pointId: h.point.id,
                  })
                }
              >
                <div className="point-top">
                  <h3>{h.point.title}</h3>
                  <span className={masteryClass(h.point.mastery)}>{h.point.mastery}</span>
                </div>
                <p className="point-plain">
                  {h.subjectName} · {h.chapterTitle}
                </p>
                <p className="point-plain">{h.point.plain}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function SubjectWorkspace({
  subject,
  view,
  setView,
  revealed,
  setRevealed,
  subjectLessons,
}: {
  subject: SubjectData
  view: View
  setView: (v: View) => void
  revealed: Record<number, boolean>
  setRevealed: (v: Record<number, boolean>) => void
  subjectLessons: Record<string, LessonItem[]>
}) {
  const chapterId =
    view.kind === 'chapter' || view.kind === 'point'
      ? view.chapterId || subject.chapters[0]?.id
      : subject.chapters[0]?.id
  const chapter = findChapter(subject, chapterId!)
  const tab =
    view.kind === 'chapter'
      ? view.tab ?? 'points'
      : view.kind === 'point'
        ? 'points'
        : 'points'

  useEffect(() => {
    if (view.kind === 'chapter' && !view.chapterId && subject.chapters[0]) {
      setView({
        kind: 'chapter',
        subjectId: subject.id,
        chapterId: subject.chapters[0].id,
        tab: 'points',
      })
    }
  }, [view, subject, setView])

  if (view.kind === 'lesson') {
    return (
      <LessonReader
        subject={subject}
        lessonId={view.lessonId}
        subjectLessons={subjectLessons}
        setView={setView}
      />
    )
  }

  if (view.kind === 'quiz') {
    const blocks = subject.chapters.flatMap((ch) =>
      extractQuizBlocks(ch.examples).map((b) => ({ ...b, chapter: ch.title })),
    )
    return (
      <div className="panel">
        <button
          className="back-btn"
          onClick={() =>
            setView({
              kind: 'chapter',
              subjectId: subject.id,
              chapterId: subject.chapters[0].id,
              tab: 'points',
            })
          }
        >
          ← 返回 {subject.name}
        </button>
        <div className="panel-head">
          <div>
            <h1>{subject.name} · 例题练习</h1>
            <p>来自各章「经典例题」，先自测再揭晓解析</p>
          </div>
        </div>
        {blocks.length === 0 ? (
          <div className="empty">本章集中例题较少，请到各章「例题」页查看。</div>
        ) : (
          blocks.map((b, i) => (
            <div className="quiz-card" key={i}>
              <div className="point-plain" style={{ marginBottom: 8 }}>
                {b.chapter}
              </div>
              <Markdown source={b.q} subjectId={subject.id} />
              <div className="quiz-actions">
                <button
                  className="primary"
                  onClick={() => setRevealed({ ...revealed, [i]: !revealed[i] })}
                >
                  {revealed[i] ? '收起解析' : '查看解析'}
                </button>
              </div>
              {revealed[i] && b.a && (
                <div className="detail-box" style={{ marginTop: 12 }}>
                  <h4>解析</h4>
                  <Markdown source={b.a} subjectId={subject.id} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    )
  }

  if (view.kind === 'point' && chapter) {
    const point = findPoint(chapter, view.pointId)
    if (!point) return <div className="empty">未找到考点</div>
    return (
      <div className="layout">
        <ChapterNav subject={subject} chapterId={chapter.id} setView={setView} />
        <div className="panel">
          <button
            className="back-btn"
            onClick={() =>
              setView({
                kind: 'chapter',
                subjectId: subject.id,
                chapterId: chapter.id,
                tab: 'points',
              })
            }
          >
            ← 返回章节
          </button>
          <div className="panel-head">
            <div>
              <h1>{point.title}</h1>
              <p>{chapter.title}</p>
            </div>
            <span className={masteryClass(point.mastery)}>{point.mastery}</span>
          </div>
          <div className="detail-grid">
            <div className="detail-box">
              <h4>通俗理解</h4>
              <p>{point.plain}</p>
            </div>
            <div className="detail-box">
              <h4>考察形式</h4>
              <p>{point.examForm}</p>
            </div>
            {point.memoryTip && (
              <div className="detail-box">
                <h4>记忆技巧</h4>
                <p>{point.memoryTip}</p>
              </div>
            )}
            <div className="detail-box">
              <h4>定义与要点</h4>
              <Markdown source={point.bodyMd} subjectId={subject.id} />
            </div>
            <div className="detail-box">
              <h4>小结</h4>
              <p>{point.summary}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!chapter) return <div className="empty">暂无章节</div>

  const allLessons = Object.entries(subjectLessons).flatMap(([chName, ls]) =>
    ls.map((l) => ({ ...l, chapterName: chName })),
  )

  return (
    <div className="layout">
      <ChapterNav subject={subject} chapterId={chapter.id} setView={setView} />
      <div className="panel">
        <div className="panel-head">
          <div>
            <button className="back-btn" onClick={() => setView({ kind: 'home' })}>
              ← 全部科目
            </button>
            <h1>{chapter.title}</h1>
            <p>{subject.name}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            <div className="tabs">
              {(
                [
                  ['points', '考点'],
                  ['examples', '例题'],
                  ['pitfalls', '易错'],
                  ['slides', '图示'],
                  ['lessons', '课件原文'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  className={`tab ${tab === id ? 'active' : ''}`}
                  onClick={() =>
                    setView({
                      kind: 'chapter',
                      subjectId: subject.id,
                      chapterId: chapter.id,
                      tab: id,
                    })
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              className="ghost"
              onClick={() => setView({ kind: 'quiz', subjectId: subject.id })}
            >
              全科例题练习
            </button>
          </div>
        </div>

        {tab === 'points' && (
          <>
            {chapter.overview && (
              <div className="detail-box" style={{ marginBottom: 18 }}>
                <h4>考情速览</h4>
                <Markdown source={chapter.overview} subjectId={subject.id} />
              </div>
            )}
            {chapter.sections.map((sec) => (
              <div className="section-block" key={sec.id}>
                <h2>{sec.title}</h2>
                {sec.intro && <Markdown source={sec.intro} subjectId={subject.id} />}
                {sec.points.map((p) => (
                  <div
                    key={p.id}
                    className="point-card"
                    onClick={() =>
                      setView({
                        kind: 'point',
                        subjectId: subject.id,
                        chapterId: chapter.id,
                        pointId: p.id,
                      })
                    }
                  >
                    <div className="point-top">
                      <h3>{p.title}</h3>
                      <span className={masteryClass(p.mastery)}>{p.mastery}</span>
                    </div>
                    <p className="point-plain">{p.plain}</p>
                  </div>
                ))}
              </div>
            ))}
          </>
        )}

        {tab === 'examples' && (
          <div className="detail-box">
            <h4>经典例题</h4>
            {chapter.examples ? (
              <Markdown source={chapter.examples} subjectId={subject.id} />
            ) : (
              <div className="empty">本章暂无集中例题</div>
            )}
          </div>
        )}

        {tab === 'pitfalls' && (
          <div className="detail-box">
            <h4>易错点速记</h4>
            {chapter.pitfalls ? (
              <Markdown source={chapter.pitfalls} subjectId={subject.id} />
            ) : (
              <div className="empty">本章暂无易错点摘要</div>
            )}
          </div>
        )}

        {tab === 'slides' && (
          <div>
            <p className="point-plain" style={{ marginBottom: 12 }}>
              重点图示 {subject.figures.length} 张。完整课件文字见「课件原文」页签（共{' '}
              {allLessons.length} 节）。
            </p>
            <div className="figure-grid">
              {subject.figures.map((src) => {
                const href = assetUrl(src)
                return (
                  <figure key={src}>
                    <a href={href} target="_blank" rel="noreferrer">
                      <img src={href} alt="" loading="lazy" />
                    </a>
                    <figcaption>{src.split('/').pop()}</figcaption>
                  </figure>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'lessons' && (
          <div>
            <p className="point-plain" style={{ marginBottom: 12 }}>
              来自 Gitee 王道课件全文提取（PDF→文本）。点进可按页阅读文字；整页幻灯片图未打进静态包。
              原件目录：{' '}
              <a
                className="ext-link"
                href={giteeSubjectUrl(subject.id)}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                在 Gitee 打开本科目课件
              </a>
            </p>
            {Object.entries(subjectLessons).map(([chName, ls]) => (
              <div className="section-block" key={chName}>
                <h2>{chName}</h2>
                {ls.map((l) => (
                  <div
                    key={l.id}
                    className="point-card"
                    onClick={() =>
                      setView({ kind: 'lesson', subjectId: subject.id, lessonId: l.id })
                    }
                  >
                    <div className="point-top">
                      <h3>{l.title}</h3>
                      <span className="badge">
                        {l.pages} 页 · 图示页 {l.visualPages}
                      </span>
                    </div>
                    <p className="point-plain">{l.preview}</p>
                    <a
                      className="ext-link"
                      href={giteeLessonUrl(l.id)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Gitee 原件目录 ↗
                    </a>
                  </div>
                ))}
              </div>
            ))}
            {allLessons.length === 0 && <div className="empty">课件原文尚未就绪</div>}
          </div>
        )}
      </div>
    </div>
  )
}

function LessonReader({
  subject,
  lessonId,
  subjectLessons,
  setView,
}: {
  subject: SubjectData
  lessonId: string
  subjectLessons: Record<string, LessonItem[]>
  setView: (v: View) => void
}) {
  const lesson = Object.values(subjectLessons)
    .flat()
    .find((l) => l.id === lessonId)
  const [pages, setPages] = useState<{ page: number; text: string }[]>([])
  const [pageIdx, setPageIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [imgOk, setImgOk] = useState(true)

  useEffect(() => {
    if (!lesson) return
    setLoading(true)
    setImgOk(true)
    fetch(assetUrl(lesson.pagesUrl))
      .then((r) => r.json())
      .then((data: { pages: { page: number; text: string }[] }) => {
        setPages(data.pages || [])
        setPageIdx(0)
      })
      .finally(() => setLoading(false))
  }, [lesson])

  if (!lesson) return <div className="empty">未找到该课件</div>
  const cur = pages[pageIdx]
  const pageNum = cur?.page ?? pageIdx + 1
  const imgSrc = assetUrl(
    `/lesson-pages/${lesson.id}/pages/page-${String(pageNum).padStart(3, '0')}.png`,
  )

  return (
    <div className="panel">
      <button
        className="back-btn"
        onClick={() =>
          setView({
            kind: 'chapter',
            subjectId: subject.id,
            chapterId: subject.chapters[0].id,
            tab: 'lessons',
          })
        }
      >
        ← 返回课件目录
      </button>
      <div className="panel-head">
        <div>
          <h1>{lesson.title}</h1>
          <p>
            {subject.name} · 共 {pages.length || lesson.pages} 页 ·{' '}
            <a
              className="ext-link"
              href={giteeLessonUrl(lesson.id)}
              target="_blank"
              rel="noreferrer"
            >
              Gitee 原件目录
            </a>
          </p>
        </div>
        <div className="tabs">
          <button
            className="tab"
            disabled={pageIdx <= 0}
            onClick={() => {
              setImgOk(true)
              setPageIdx((i) => Math.max(0, i - 1))
            }}
          >
            上一页
          </button>
          <span className="badge">
            {pageNum} / {pages.length || '…'}
          </span>
          <button
            className="tab"
            disabled={pageIdx >= pages.length - 1}
            onClick={() => {
              setImgOk(true)
              setPageIdx((i) => Math.min(pages.length - 1, i + 1))
            }}
          >
            下一页
          </button>
        </div>
      </div>
      {loading ? (
        <div className="loading">加载课件原文…</div>
      ) : (
        <div className="detail-grid">
          <div className="detail-box slide-page">
            <h4>第 {pageNum} 页 · 课件图</h4>
            {imgOk ? (
              <a href={imgSrc} target="_blank" rel="noreferrer">
                <img
                  className="slide-img"
                  src={imgSrc}
                  alt={`第 ${pageNum} 页`}
                  onError={() => setImgOk(false)}
                />
              </a>
            ) : (
              <p className="point-plain">本页图尚未渲染完成，可先看下方文字；全量渲染进行中。</p>
            )}
          </div>
          <div className="detail-box">
            <h4>提取文字</h4>
            <pre className="slide-text">{cur?.text || '（本页主要为图示，文字较少）'}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

function ChapterNav({
  subject,
  chapterId,
  setView,
}: {
  subject: SubjectData
  chapterId: string
  setView: (v: View) => void
}) {
  return (
    <aside className="sidebar">
      <h3>{subject.short} 章节</h3>
      {subject.chapters.map((ch) => (
        <button
          key={ch.id}
          className={`nav-item ${ch.id === chapterId ? 'active' : ''}`}
          onClick={() =>
            setView({
              kind: 'chapter',
              subjectId: subject.id,
              chapterId: ch.id,
              tab: 'points',
            })
          }
        >
          {ch.title}
        </button>
      ))}
    </aside>
  )
}
