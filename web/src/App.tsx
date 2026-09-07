import { useEffect, useMemo, useState } from 'react'
import type { KnowledgeBase, Node, SubjectId, Tier, PracticeBank, PracticeQuestion, PracticeResult } from './kbTypes'
import './index.css'

const subjectMeta: Record<SubjectId, {name:string; short:string}> = {
  ds:{name:'数据结构',short:'DS'}, co:{name:'计算机组成原理',short:'CO'},
  os:{name:'操作系统',short:'OS'}, cn:{name:'计算机网络',short:'CN'},
}
const tierOrder: Tier[] = ['S','A','B','C']
const tierText: Record<Tier,string> = {S:'核心综合',A:'高频重点',B:'常规考点',C:'低频保留',D:'非主复习链'}
type SourceTopic={id:string;code:string;title:string;pages:number;source_status:string;status_reason:string;variant_role:string;source_relpath:string;archive:string;asset_path?:string;node_ids:string[]}
type CompatIndex={original_chapters:Record<SubjectId,{id:string;order:number;title:string;topics:SourceTopic[]}[]>}
type View='cards'|'outline'|'sources'|'progress'|'practice'|'mistakes'
function assetUrl(path:string){ const base=import.meta.env.BASE_URL||'/'; return `${base.replace(/\/?$/, '/')}${path.replace(/^\//,'')}` }

export default function App(){
  const [kb,setKb]=useState<KnowledgeBase|null>(null)
  const [compat,setCompat]=useState<CompatIndex|null>(null)
  const [bank,setBank]=useState<PracticeBank|null>(null)
  const [subject,setSubject]=useState<SubjectId|'all'>('all')
  const [tier,setTier]=useState<Tier|'all'>('all')
  const [q,setQ]=useState('')
  const [selected,setSelected]=useState<string|null>(null)
  const [focusSubtopic,setFocusSubtopic]=useState<string|null>(null)
  const [view,setView]=useState<View>('cards')
  const [activeQuestion,setActiveQuestion]=useState<string|null>(null)
  const [done,setDone]=useState<Record<string,boolean>>(()=>readLocal('cs408-progress',{}))
  const [subDone,setSubDone]=useState<Record<string,boolean>>(()=>readLocal('cs408-subtopic-progress',{}))
  const [practiceResults,setPracticeResults]=useState<Record<string,PracticeResult>>(()=>readLocal('cs408-practice-results',{}))

  useEffect(()=>{ Promise.all([
    fetch(assetUrl('/data/408-kb.json')).then(r=>r.json()),
    fetch(assetUrl('/data/compat-index.json')).then(r=>r.json()),
    fetch(assetUrl('/data/practice-bank.json')).then(r=>r.json())
  ]).then(([k,c,b])=>{setKb(k);setCompat(c);setBank(b)}).catch(console.error) },[])

  useEffect(()=>{
    if(selected&&focusSubtopic){
      const t=setTimeout(()=>document.getElementById(focusSubtopic)?.scrollIntoView({behavior:'smooth',block:'start'}),80)
      return()=>clearTimeout(t)
    }
  },[selected,focusSubtopic])

  const filtered=useMemo(()=>{
    if(!kb) return []
    const needle=q.trim().toLowerCase()
    return kb.nodes.filter(n=>{
      if(subject!=='all'&&n.subject!==subject) return false
      if(tier!=='all'&&n.importance.tier!==tier) return false
      if(!needle) return true
      const blob=[n.title,...n.search_tags,...n.subtopics.map(s=>s.name),...n.subtopics.flatMap(s=>s.core||[]),...n.problem_templates,...n.common_traps,...n.question_refs.map(x=>`${x.subtopic||''} ${x.evidence||''}`)].join('\n').toLowerCase()
      return blob.includes(needle)
    })
  },[kb,subject,tier,q])

  const node=kb?.nodes.find(n=>n.node_id===selected)||null
  const toggleDone=(id:string)=>setDone(prev=>persist('cs408-progress',{...prev,[id]:!prev[id]}))
  const toggleSubDone=(id:string)=>setSubDone(prev=>persist('cs408-subtopic-progress',{...prev,[id]:!prev[id]}))
  const grade=(qid:string,status:'correct'|'wrong')=>setPracticeResults(prev=>{
    const old=prev[qid]
    return persist('cs408-practice-results',{...prev,[qid]:{status,attempts:(old?.attempts||0)+1,lastAt:new Date().toISOString()}})
  })
  const openKnowledge=(nodeId:string,subId?:string)=>{setSelected(nodeId);setFocusSubtopic(subId||null);window.scrollTo({top:0,behavior:'smooth'})}
  const openQuestion=(qid:string)=>{setView('practice');setSelected(null);setActiveQuestion(qid);window.scrollTo({top:0,behavior:'smooth'})}
  const completedCount=kb?kb.nodes.filter(n=>done[n.node_id]).length:0
  const completedSubtopicCount=kb?kb.nodes.flatMap(n=>n.subtopics).filter(s=>s.subtopic_id&&subDone[s.subtopic_id]).length:0
  const wrongCount=Object.values(practiceResults).filter(x=>x.status==='wrong').length
  if(!kb||!bank) return <div className="loading">加载 408 知识库与练习库…</div>

  return <main className="shell">
    <header className="topbar">
      <button className="brand" onClick={()=>{setSelected(null);setView('cards')}}><span>CS 408 EXAM PREP</span><strong>408 考点复习台</strong></button>
      <input className="search" value={q} onChange={e=>{setQ(e.target.value);setSelected(null)}} placeholder="搜索考点、算法、协议、真题关键词…"/>
    </header>
    {node?<Detail node={node} bank={bank} results={practiceResults} onBack={()=>setSelected(null)} done={!!done[node.node_id]} onToggleDone={()=>toggleDone(node.node_id)} subDone={subDone} onToggleSubDone={toggleSubDone} onPractice={openQuestion}/>:<>
      <section className="hero"><div><h1>正文 → PPT → 练习 → 错题 → 回看</h1><p>按大纲与真题组织知识。完整正文负责理解，原课件负责追溯，针对性练习负责检验，错题自动回链到对应子考点。</p></div><div className="hero-stats"><b>{kb.stats.nodes}</b><span>核心知识簇</span><b>{kb.stats.subtopics}</b><span>细粒度子考点</span><b>{bank.stats.questions}</b><span>针对性练习</span><b>{wrongCount}</b><span>当前错题</span><b>{completedSubtopicCount}</b><span>已完成子考点</span></div></section>
      <section className="filters">
        <div className="filter-row"><button className={subject==='all'?'active':''} onClick={()=>setSubject('all')}>全部科目</button>{(Object.keys(subjectMeta) as SubjectId[]).map(id=><button key={id} className={subject===id?'active':''} onClick={()=>setSubject(id)}>{subjectMeta[id].name}</button>)}</div>
        <div className="filter-row"><button className={tier==='all'?'active':''} onClick={()=>setTier('all')}>全部等级</button>{tierOrder.map(t=><button key={t} className={`${tier===t?'active':''} tier-${t}`} onClick={()=>setTier(t)}>{t} · {tierText[t]}</button>)}</div>
        <div className="filter-row view-toggle">
          <button className={view==='cards'?'active':''} onClick={()=>setView('cards')}>知识卡片</button>
          <button className={view==='outline'?'active':''} onClick={()=>setView('outline')}>知识章节</button>
          <button className={view==='practice'?'active':''} onClick={()=>setView('practice')}>开始练习</button>
          <button className={view==='mistakes'?'active':''} onClick={()=>setView('mistakes')}>错题本 {wrongCount?`(${wrongCount})`:''}</button>
          <button className={view==='sources'?'active':''} onClick={()=>setView('sources')}>原课件</button>
          <button className={view==='progress'?'active':''} onClick={()=>setView('progress')}>复习进度</button>
        </div>
      </section>
      {view==='cards'?<section className="node-grid">{filtered.map(n=><NodeCard key={n.node_id} node={n} onClick={()=>openKnowledge(n.node_id)}/>)}</section>
      :view==='outline'?<Outline nodes={filtered} onOpen={id=>openKnowledge(id)}/>
      :view==='sources'?<SourceOutline compat={compat} subject={subject} query={q} onOpen={id=>openKnowledge(id)}/>
      :view==='progress'?<ProgressView nodes={filtered} done={done} onOpen={id=>openKnowledge(id)} onToggle={toggleDone}/>
      :view==='mistakes'?<MistakeBook bank={bank} results={practiceResults} onPractice={openQuestion} onKnowledge={openKnowledge}/>
      :<PracticeView bank={bank} kb={kb} subject={subject} tier={tier} query={q} results={practiceResults} activeId={activeQuestion} setActiveId={setActiveQuestion} grade={grade} onKnowledge={openKnowledge}/>}
      {['cards','outline'].includes(view)&&filtered.length===0&&<div className="empty">没有匹配结果。</div>}
    </>}
  </main>
}

function readLocal<T>(key:string,fallback:T):T{try{return JSON.parse(localStorage.getItem(key)||'') as T}catch{return fallback}}
function persist<T>(key:string,value:T){localStorage.setItem(key,JSON.stringify(value));return value}

function PracticeView({bank,kb,subject,tier,query,results,activeId,setActiveId,grade,onKnowledge}:{bank:PracticeBank;kb:KnowledgeBase;subject:SubjectId|'all';tier:Tier|'all';query:string;results:Record<string,PracticeResult>;activeId:string|null;setActiveId:(id:string|null)=>void;grade:(id:string,s:'correct'|'wrong')=>void;onKnowledge:(n:string,s?:string)=>void}){
  const qs=useMemo(()=>bank.questions.filter(x=>{
    if(subject!=='all'&&x.subject!==subject)return false
    if(tier!=='all'&&x.tier!==tier)return false
    const needle=query.trim().toLowerCase()
    if(needle&&!`${x.subtopic} ${x.prompt}`.toLowerCase().includes(needle))return false
    return true
  }),[bank,subject,tier,query])
  const [mode,setMode]=useState<'unfinished'|'wrong'|'all'>('unfinished')
  const visible=qs.filter(x=>mode==='all'||(mode==='wrong'?results[x.id]?.status==='wrong':!results[x.id]))
  const q=bank.questions.find(x=>x.id===activeId)||visible[0]||qs[0]
  const node=q?kb.nodes.find(n=>n.node_id===q.node_id):undefined
  if(!q)return <div className="empty">当前筛选没有练习题。</div>
  return <section className="practice-shell">
    <div className="practice-side">
      <div className="practice-modes"><button className={mode==='unfinished'?'active':''} onClick={()=>setMode('unfinished')}>未做 {qs.filter(x=>!results[x.id]).length}</button><button className={mode==='wrong'?'active':''} onClick={()=>setMode('wrong')}>错题 {qs.filter(x=>results[x.id]?.status==='wrong').length}</button><button className={mode==='all'?'active':''} onClick={()=>setMode('all')}>全部 {qs.length}</button></div>
      <div className="practice-list">{visible.slice(0,120).map(x=><button key={x.id} className={`${q.id===x.id?'active':''} ${results[x.id]?.status||''}`} onClick={()=>setActiveId(x.id)}><span>{subjectMeta[x.subject].short} · {x.tier}</span><b>{x.subtopic}</b><small>{x.title}{results[x.id]?` · ${results[x.id].status==='correct'?'已答对':'待重做'}`:''}</small></button>)}</div>
    </div>
    <PracticeQuestionCard q={q} result={results[q.id]} node={node} grade={grade} onKnowledge={onKnowledge}/>
  </section>
}

function PracticeQuestionCard({q,result,node,grade,onKnowledge}:{q:PracticeQuestion;result?:PracticeResult;node?:Node;grade:(id:string,s:'correct'|'wrong')=>void;onKnowledge:(n:string,s?:string)=>void}){
  const [show,setShow]=useState(false)
  const [draft,setDraft]=useState('')
  useEffect(()=>{setShow(false);setDraft('')},[q.id])
  return <article className="question-card">
    <div className="question-meta"><span className={`tier-badge tier-${q.tier}`}>{q.tier}</span><span>{subjectMeta[q.subject].name}</span><span>{q.title}</span>{result&&<span className={result.status==='correct'?'answer-ok':'answer-wrong'}>{result.status==='correct'?'✓ 已答对':'× 错题'} · {result.attempts}次</span>}</div>
    <h2>{q.subtopic}</h2><p className="question-prompt">{q.prompt}</p>
    <textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder="可在这里写思路/答案（只保存在当前页面，不上传）"/>
    <div className="question-actions"><button onClick={()=>setShow(v=>!v)}>{show?'收起解析':'查看参考解析'}</button><button onClick={()=>onKnowledge(q.node_id,q.subtopic_id)}>回看知识点</button>{node?.source_refs?.some(s=>q.source_ref_ids?.includes(s.ref_id||''))&&<a href={assetUrl(node.source_refs.find(s=>q.source_ref_ids?.includes(s.ref_id||''))?.asset_path||'')} target="_blank" rel="noreferrer">打开对应PPT</a>}</div>
    {show&&<div className="answer-panel">{q.answer.summary&&<p>{q.answer.summary}</p>}{q.answer.points.length>0&&<ol>{q.answer.points.map((x,i)=><li key={i}>{x}</li>)}</ol>}{q.answer.conclusion&&<p className="answer-conclusion">{q.answer.conclusion}</p>}<div className="self-grade"><span>对照解析后自评：</span><button className="correct" onClick={()=>grade(q.id,'correct')}>答对 / 已掌握</button><button className="wrong" onClick={()=>grade(q.id,'wrong')}>答错 / 需复习</button></div></div>}
    <div className="truth-link"><b>历年真题</b><span>{q.question_ref_ids?.length?`本子考点已精确关联 ${q.question_ref_ids.length} 条真题证据。`:'本子考点继承所属知识簇的真题证据。'}</span><a href="https://www.codebrick.tech/practice/" target="_blank" rel="noreferrer">打开 2009–2026 真题题库 ↗</a></div>
  </article>
}

function MistakeBook({bank,results,onPractice,onKnowledge}:{bank:PracticeBank;results:Record<string,PracticeResult>;onPractice:(id:string)=>void;onKnowledge:(n:string,s?:string)=>void}){
  const wrong=bank.questions.filter(q=>results[q.id]?.status==='wrong').sort((a,b)=>(results[b.id]?.lastAt||'').localeCompare(results[a.id]?.lastAt||''))
  if(!wrong.length)return <section className="empty-state"><h2>错题本为空</h2><p>练习中标记“答错 / 需复习”的题会自动出现在这里。</p></section>
  return <section className="mistake-book"><div className="mistake-head"><h2>错题本</h2><p>先回看对应正文或PPT，再重做。重做答对后自动从错题本移除。</p></div>{wrong.map(q=><div className="mistake-row" key={q.id}><div><span>{subjectMeta[q.subject].name} · {q.tier} · {q.title}</span><b>{q.subtopic}</b><small>已尝试 {results[q.id].attempts} 次</small></div><div><button onClick={()=>onKnowledge(q.node_id,q.subtopic_id)}>回看知识点</button><button className="primary" onClick={()=>onPractice(q.id)}>重新作答</button></div></div>)}</section>
}

function ProgressView({nodes,done,onOpen,onToggle}:{nodes:Node[];done:Record<string,boolean>;onOpen:(id:string)=>void;onToggle:(id:string)=>void}){
  const ordered=[...nodes].sort((a,b)=>({S:0,A:1,B:2,C:3,D:4}[a.importance.tier]-({S:0,A:1,B:2,C:3,D:4}[b.importance.tier])))
  const complete=ordered.filter(n=>done[n.node_id]).length
  const pct=ordered.length?Math.round(complete/ordered.length*100):0
  return <section className="progress-view"><div className="progress-summary"><div><b>{complete}/{ordered.length}</b><span>当前筛选范围已完成</span></div><div className="progress-bar"><i style={{width:`${pct}%`}}/></div><strong>{pct}%</strong></div><div className="progress-list">{ordered.map(n=><div className={`progress-row ${done[n.node_id]?'done':''}`} key={n.node_id}><button className="check" onClick={()=>onToggle(n.node_id)}>{done[n.node_id]?'✓':'○'}</button><button className="progress-open" onClick={()=>onOpen(n.node_id)}><span className={`tier-badge tier-${n.importance.tier}`}>{n.importance.tier}</span><b>{n.title}</b><small>{n.review_summary.must_master.slice(0,4).join(' · ')}</small></button></div>)}</div></section>
}
function SourceOutline({compat,subject,query,onOpen}:{compat:CompatIndex|null;subject:SubjectId|'all';query:string;onOpen:(id:string)=>void}){
  if(!compat) return <div className="loading">加载原课件目录…</div>
  const needle=query.trim().toLowerCase(); const subjects=(Object.keys(subjectMeta) as SubjectId[]).filter(s=>subject==='all'||subject===s)
  return <section className="source-outline">{subjects.map(sid=>{const chapters=(compat.original_chapters[sid]||[]).map(ch=>({...ch,topics:ch.topics.filter(t=>!needle||`${t.code} ${t.title} ${t.status_reason}`.toLowerCase().includes(needle))})).filter(ch=>ch.topics.length);if(!chapters.length)return null;return <div className="source-subject" key={sid}><h2>{subjectMeta[sid].name} · 原课件</h2>{chapters.map(ch=><details key={ch.id} open={!!needle}><summary>{ch.title}<span>{ch.topics.length} 份</span></summary><div className="source-topic-list">{ch.topics.map(t=><div className="source-topic" key={t.id}><div><b>{t.code} {t.title}</b><small>{t.pages}页 · {t.source_status}{t.variant_role!=='single'?` · ${t.variant_role}`:''}</small></div><div className="source-topic-actions">{t.asset_path&&<a href={assetUrl(t.asset_path)} target="_blank" rel="noreferrer">PDF</a>}{t.node_ids.map(id=><button key={id} onClick={()=>onOpen(id)}>对应考点</button>)}</div></div>)}</div></details>)}</div>})}</section>
}
function Outline({nodes,onOpen}:{nodes:Node[];onOpen:(id:string)=>void}){const groups=(Object.keys(subjectMeta) as SubjectId[]).map(subject=>({subject,nodes:nodes.filter(n=>n.subject===subject)})).filter(g=>g.nodes.length);return <section className="outline">{groups.map(g=><div className="outline-subject" key={g.subject}><h2>{subjectMeta[g.subject].name}</h2>{g.nodes.map((n,i)=><button key={n.node_id} onClick={()=>onOpen(n.node_id)} className="outline-row"><span className="outline-num">{String(i+1).padStart(2,'0')}</span><span className="outline-main"><b>{n.title}</b><small>{n.review_summary.must_master.slice(0,5).join(' · ')}</small></span><span className={`tier-badge tier-${n.importance.tier}`}>{n.importance.tier}</span></button>)}</div>)}</section>}
function NodeCard({node,onClick}:{node:Node;onClick:()=>void}){return <button className="node-card" onClick={onClick}><div className="card-head"><span className={`tier-badge tier-${node.importance.tier}`}>{node.importance.tier}</span><span className="subject-chip">{subjectMeta[node.subject].short}</span></div><h2>{node.title}</h2><p>{node.review_summary.must_master.slice(0,4).join(' · ')}</p><div className="card-meta"><span>{node.subtopics.length} 子考点</span><span>{node.question_refs.length} 真题证据</span><span>{node.source_refs.length} 来源页</span></div></button>}

function Detail({node,bank,results,onBack,done,onToggleDone,subDone,onToggleSubDone,onPractice}:{node:Node;bank:PracticeBank;results:Record<string,PracticeResult>;onBack:()=>void;done:boolean;onToggleDone:()=>void;subDone:Record<string,boolean>;onToggleSubDone:(id:string)=>void;onPractice:(id:string)=>void}){
  const qBySub=(sid:string)=>bank.questions.filter(q=>q.subtopic_id===sid)
  return <article className="detail"><div className="detail-toolbar"><button className="back" onClick={onBack}>← 返回知识库</button><button className={`done-button ${done?'is-done':''}`} onClick={onToggleDone}>{done?'✓ 已完成':'标记已完成'}</button></div><header className="detail-head"><div><div className="eyebrow">{subjectMeta[node.subject].name} · {node.importance.finality==='stable'?'证据较稳定':'权重仍可继续校正'}</div><h1>{node.title}</h1><p>{node.importance.reason}</p></div><div className={`big-tier tier-${node.importance.tier}`}>{node.importance.tier}</div></header>
  <Section title="必须掌握"><div className="chips">{node.review_summary.must_master.map(x=><span key={x}>{x}</span>)}</div></Section>
  <Section title={`子考点 · ${node.subtopics.filter(s=>s.subtopic_id&&subDone[s.subtopic_id]).length}/${node.subtopics.length} 已完成`}><div className="subtopics">{node.subtopics.map((s,i)=>{const sid=s.subtopic_id||`${node.node_id}-sub-${i+1}`;const sd=!!subDone[sid];const qs=qBySub(sid);const wrong=qs.filter(x=>results[x.id]?.status==='wrong').length;return <div id={sid} className={`subtopic ${sd?'subtopic-done':''}`} key={sid}><div className="subtopic-title"><button className="sub-check" onClick={()=>onToggleSubDone(sid)}>{sd?'✓':'○'}</button><b>{s.name}</b>{s.tier&&<span className={`mini-tier tier-${s.tier}`}>{s.tier}</span>}{wrong>0&&<span className="wrong-chip">错题 {wrong}</span>}</div>{s.full_text?<div className="fulltext"><p className="overview">{s.full_text.overview}</p><h4>原理展开</h4><ul>{s.full_text.deep_dive.map((x,j)=><li key={j}>{x}</li>)}</ul><div className="worked-example"><h4>完整例子</h4><p className="example-prompt">{s.full_text.worked_example.prompt}</p><ol>{s.full_text.worked_example.steps.map((x,j)=><li key={j}>{x}</li>)}</ol><p className="example-conclusion">结论：{s.full_text.worked_example.conclusion}</p></div><h4>408怎么考</h4><ul>{s.full_text.exam_focus.map((x,j)=><li key={j}>{x}</li>)}</ul><h4>易错点</h4><ul className="mistakes">{s.full_text.mistakes.map((x,j)=><li key={j}>{x}</li>)}</ul><details className="quick-review"><summary>考前速记</summary><ul>{s.full_text.quick_review.map((x,j)=><li key={j}>{x}</li>)}</ul></details></div>:null}<div className="subtopic-practice">{qs.map(q=><button key={q.id} className={results[q.id]?.status||''} onClick={()=>onPractice(q.id)}>{q.title}{results[q.id]?.status==='correct'?' ✓':results[q.id]?.status==='wrong'?' ×':''}</button>)}</div>{(s.source_ref_ids?.length||s.question_ref_ids?.length)?<div className="sub-links">{s.source_ref_ids?.length?<span>课件来源 {s.source_ref_ids.length}</span>:null}{s.question_ref_ids?.length?<span>真题证据 {s.question_ref_ids.length}</span>:null}</div>:null}</div>})}</div></Section>
  <Section title="图示怎么读"><List items={node.visual_explanations}/></Section>
  <Section title="标准解题模型"><ol className="steps">{node.problem_templates.map((x,i)=><li key={i}>{x}</li>)}</ol></Section>
  <Section title="高频陷阱"><List items={node.common_traps}/></Section>
  <Section title="真题证据"><div className="evidence-list">{node.question_refs.map((q,i)=><div className="evidence" key={q.ref_id||i}><div className="evidence-head"><b>{q.subtopic||'相关真题'}</b>{q.scope&&<span>{q.scope}</span>}</div><p>{q.evidence}</p>{q.note&&<small>{q.note}</small>}</div>)}<a className="truth-bank-link" href="https://www.codebrick.tech/practice/" target="_blank" rel="noreferrer">打开 2009–2026 真题题库 ↗</a></div></Section>
  <Section title="课件来源"><div className="source-list">{node.source_refs.map((s,i)=><div className="source" key={s.ref_id||i}><code>{s.pdf}</code><div className="source-actions">{s.page&&<b>p.{s.page}</b>}{s.asset_path&&<a href={`${assetUrl(s.asset_path)}${s.page?`#page=${s.page}`:''}`} target="_blank" rel="noreferrer">打开原课件</a>}</div>{s.preview&&<p>{s.preview}</p>}</div>)}</div></Section>
  {node.review_summary.can_compress?.length>0&&<Section title="可压缩复习"><div className="chips muted">{node.review_summary.can_compress.map(x=><span key={x}>{x}</span>)}</div></Section>}
</article>}
function Section({title,children}:{title:string;children:React.ReactNode}){return <section className="section"><h3>{title}</h3>{children}</section>}
function List({items}:{items:string[]}){return items.length?<ul className="clean-list">{items.map((x,i)=><li key={i}>{x}</li>)}</ul>:<p className="muted-text">待继续补充。</p>}
