
const $=s=>document.querySelector(s), app=$('#app');
const SNAME={ds:'数据结构',co:'计算机组成原理',os:'操作系统',cn:'计算机网络'};
const KIND_ICON={'概念与原理':'原理','规则与易错':'规则','过程与算法':'过程','对比辨析':'辨析','公式/代码/计算':'计算','例题与应用':'例题','图示/结论':'图示'};
let DB;
let state={subject:'ds',lesson:null,tab:'notes',query:'',memory:false,sourcePage:null};
const PROG='cs408-organized-progress-v2', MEM='cs408-organized-memory-v2';
let progress=store(PROG), memory=store(MEM);
function store(k){try{return JSON.parse(localStorage.getItem(k)||'{}')}catch{return {}}}
function save(k,v){localStorage.setItem(k,JSON.stringify(v))}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function lesson(id){return DB.lessons.find(x=>x.id===id)}
function subjectData(id){return DB.subjects.find(x=>x.id===id)}
function slide(l,p){return `public/${l.slide_base}/${String(p).padStart(3,'0')}.webp`}
function pageLabel(pages){if(!pages?.length)return ''; if(pages.length===1)return `p.${pages[0]}`; return `p.${pages[0]}–${pages[pages.length-1]}`}
function setLesson(id,tab='notes'){state.lesson=id;state.tab=tab;state.query='';state.memory=false;state.sourcePage=null;render();window.scrollTo({top:0})}
function render(){
  app.innerHTML=`<div class="app">
    <header class="top">
      <button class="brand" id="home"><small>PDF 是原料 · 整理正文是成品</small><b>408 全量知识讲义</b></button>
      <input id="search" class="search" placeholder="搜索 350 份课件整理后的全部知识…" value="${esc(state.query)}">
      <div class="topstats"><span>${DB.stats.lessons} 课件</span><span>${DB.stats.pages} 页</span><span>${DB.stats.organized_blocks} 学习块</span></div>
    </header>
    <div class="layout"><aside class="sidebar">${sidebar()}</aside><main class="main">${main()}</main></div>
  </div>`;
  bind();
}
function sidebar(){
  const sub=subjectData(state.subject);
  let out=`<div class="rule"><b>整理规则</b><p>课件中的课程知识全部保留；不按 S/A/B/C 删内容。正文经过重组，原页只做图示、公式与来源追溯。</p></div>
  <div class="subject-tabs">${['ds','co','os','cn'].map(x=>`<button data-subject="${x}" class="${state.subject===x?'active':''}">${SNAME[x]}</button>`).join('')}</div>
  <div class="side-actions"><button id="memoryMode">必须记总表</button><button id="clearSearch">清除搜索</button></div>`;
  for(const ch of sub.chapters){
    out+=`<details class="chapter" ${state.lesson&&lesson(state.lesson)?.chapter===ch.chapter?'open':''}>
      <summary>${esc(ch.chapter)}<span>${ch.lesson_count}节 · ${ch.page_count}页</span></summary><div>`;
    for(const id of ch.lesson_ids){
      const l=lesson(id); if(!l)continue;
      out+=`<button data-lesson="${id}" class="lesson-link ${state.lesson===id?'active':''}">
        <span><b>${esc(l.title)}</b><small>${l.blocks.length} 个整理块 · ${l.must_memorize.length} 条必记</small></span>
        <i class="${progress[id]?'done':''}"></i></button>`;
    }
    out+=`</div></details>`;
  }
  return out;
}
function main(){
  if(state.query.trim())return searchView();
  if(state.memory)return memoryView();
  if(!state.lesson)return homeView();
  return lessonView(lesson(state.lesson));
}
function homeView(){
  const done=Object.values(progress).filter(Boolean).length;
  const cards=DB.subjects.map(s=>`<button class="subject-card" data-home-sub="${s.id}"><h2>${s.name}</h2><p>${s.lesson_count} 份课件 · ${s.page_count} 页 · ${s.chapters.length} 章</p></button>`).join('');
  return `<section class="hero">
    <div class="hero-main"><div class="kicker">完整内容，不是 PDF 搬运</div><h1>把 350 份课件消化成可直接学习的讲义。</h1>
    <p>每份课件按概念、规则、过程、公式、例题、辨析重新组织。课件动画重复页会合并，但新增知识不删；图表、公式和复杂流程可以随时展开原页核对。</p>
    <div class="numbers"><div><b>${DB.stats.lessons}</b><span>原课件</span></div><div><b>${DB.stats.organized_blocks}</b><span>整理正文块</span></div><div><b>${DB.stats.example_blocks}</b><span>例题/计算块</span></div><div><b>100%</b><span>有效文本覆盖</span></div></div>
    <div class="progress"><i style="width:${done/DB.stats.lessons*100}%"></i></div><small>已复习 ${done}/${DB.stats.lessons} 份课件</small></div>
    <div class="subject-grid">${cards}</div>
    <div class="explain-grid"><div><b>正文是主入口</b><p>不需要先打开 PPT。知识按学习逻辑直接展开。</p></div><div><b>总结是必须记</b><p>优先提取课件末尾回顾；OCR 不清时保留对应原页。</p></div><div><b>原页是证据</b><p>遇到结构图、时序图、公式或代码再展开原页。</p></div></div>
  </section>`;
}
function lessonView(l){
  return `<article class="lesson">
    <header class="lesson-head"><div class="crumb">${l.subject_name} / ${esc(l.chapter)}</div>
      <div class="title-row"><div><h1>${esc(l.title)}</h1><p>${l.pages} 页课件 → ${l.blocks.length} 个整理学习块；${l.examples.length} 个例题/计算块。</p></div><span class="key-badge">本课件全部课程内容均为重点</span></div>
      <div class="lesson-actions"><button id="markDone" class="${progress[l.id]?'active':''}">${progress[l.id]?'✓ 本节已复习':'标记本节已复习'}</button><button id="markMemory" class="memory">${memory[l.id]?'✓ 必记已过':'必记标记已过'}</button></div>
    </header>
    <nav class="tabs">
      <button data-tab="notes" class="${state.tab==='notes'?'active':''}">整理正文</button>
      <button data-tab="memory" class="${state.tab==='memory'?'active':''}">本节必须记</button>
      <button data-tab="examples" class="${state.tab==='examples'?'active':''}">例题 / 公式 / 计算</button>
      <button data-tab="sources" class="${state.tab==='sources'?'active':''}">原页证据</button>
    </nav>
    <section class="panel">${tab(l)}</section>
  </article>`;
}
function tab(l){
  if(state.tab==='memory')return memoryLesson(l);
  if(state.tab==='examples')return exampleView(l);
  if(state.tab==='sources')return sourceView(l);
  return notesView(l);
}
function notesView(l){
  return `<div class="notes-intro"><b>学习方式：</b>先读整理正文；看到“查看原页”只在需要核对图、公式、代码布局时展开。页码一直保留用于追溯。</div>
  <div class="notes">${l.blocks.map((b,i)=>block(l,b,i)).join('')}</div>`;
}
function renderLines(lines){
  if(!lines?.length)return `<p class="visual-note">这一块主要依赖图示/结构布局，正文无法完整替代，原页已保留在下方。</p>`;
  return `<ul class="knowledge-lines">${lines.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
}
function block(l,b,i){
  const showVisual=b.visual_only;
  return `<section class="block ${b.kind==='规则与易错'?'rule-block':''}">
    <header><div><span class="kind">${KIND_ICON[b.kind]||b.kind}</span><h2>${esc(b.heading)}</h2></div><span class="pages">${pageLabel(b.pages)}</span></header>
    ${renderLines(b.lines)}
    <div class="block-tools"><button data-open-source="${l.id}" data-pages="${b.pages.join(',')}">查看对应原页</button></div>
    ${showVisual?sourceImages(l,b.pages,true):''}
  </section>`;
}
function memoryLesson(l){
  const method=l.summary_detection==='explicit'?'检测到课件明确的回顾/总结页':'总结标题未被文字层明确识别，使用课件结尾关键页并补充本节高信号结论';
  return `<div class="memory-lesson"><div class="memory-banner"><strong>本节必须记</strong><p>${method}。这些条目用于背诵，不代表正文里其他内容可以不学。</p><span>总结来源：${l.summary_pages.map(x=>'p.'+x).join('、')}</span></div>
    <ol class="memory-list">${l.must_memorize.map(x=>`<li><span>${esc(x.text)}</span><button data-single-source="${l.id}" data-page="${x.page}">p.${x.page}</button></li>`).join('')||'<li>本节总结主要为图示，请直接查看下方总结原页。</li>'}</ol>
    <div class="summary-source"><h3>课件总结原页</h3>${sourceImages(l,l.summary_pages,true)}</div></div>`;
}
function exampleView(l){
  if(!l.examples.length)return `<div class="empty">本节没有被文字层单独识别出的例题/计算块；相关内容仍完整保留在“整理正文”。</div>`;
  return `<div class="example-list">${l.examples.map((b,i)=>`<section class="example-card"><header><span>${esc(b.kind)}</span><b>${esc(b.heading)}</b><small>${pageLabel(b.pages)}</small></header>${renderLines(b.lines)}<button data-open-source="${l.id}" data-pages="${b.pages.join(',')}">结合原页看推导/图示</button></section>`).join('')}</div>`;
}
function sourceView(l){
  const p=state.sourcePage||1;
  return `<div class="source-head"><div><b>原课件只作为证据层</b><p>这里保留全部 ${l.pages} 页，方便核对图片、箭头、公式排版和老师手写标注；学习入口仍是“整理正文”。</p></div></div>
  <div class="source-grid">${Array.from({length:l.pages},(_,i)=>i+1).map(n=>`<button data-source-page="${n}" class="${l.summary_pages.includes(n)?'summary':''}"><img loading="lazy" src="${slide(l,n)}"><span>p.${n}${l.summary_pages.includes(n)?' · 必记总结':''}</span></button>`).join('')}</div>`;
}
function sourceImages(l,pages,open=false){
  return `<div class="inline-sources">${pages.map(p=>`<figure><a href="${slide(l,p)}" target="_blank"><img loading="lazy" src="${slide(l,p)}"></a><figcaption>原课件 p.${p}${l.summary_pages.includes(p)?' · 总结页':''}</figcaption></figure>`).join('')}</div>`;
}
function searchView(){
  const q=state.query.trim().toLowerCase(), hits=[];
  for(const l of DB.lessons){
    let lessonScore=0, matched=[];
    if(`${l.title} ${l.chapter}`.toLowerCase().includes(q))lessonScore+=20;
    for(const b of l.blocks){
      const txt=`${b.heading} ${b.lines.join(' ')}`.toLowerCase();
      if(txt.includes(q)){matched.push(b);lessonScore+=3;}
    }
    for(const m of l.must_memorize)if(m.text.toLowerCase().includes(q))lessonScore+=5;
    if(lessonScore)hits.push({l,score:lessonScore,matched:matched.slice(0,3)});
  }
  hits.sort((a,b)=>b.score-a.score);
  return `<section class="search-results"><h1>搜索“${esc(state.query)}”</h1><p>共命中 ${hits.length} 份整理课件。</p>${hits.slice(0,150).map(h=>`<button class="search-hit" data-hit="${h.l.id}"><small>${h.l.subject_name} / ${esc(h.l.chapter)}</small><b>${esc(h.l.title)}</b>${h.matched.map(m=>`<span>${esc(m.heading)}：${esc(m.lines.slice(0,2).join('；')).slice(0,220)}</span>`).join('')}</button>`).join('')||'<div class="empty">没有匹配结果。</div>'}</section>`;
}
function memoryView(){
  const ls=DB.lessons.filter(x=>x.subject===state.subject);
  return `<section class="memory-overview"><header><h1>${SNAME[state.subject]} · 必须记总表</h1><p>这里汇总每份课件的结尾总结/回顾。注意：这是背诵层，不是删减层，正文中的其他内容仍然需要掌握。</p></header>
    ${ls.map(l=>`<article class="memory-card"><div><small>${esc(l.chapter)}</small><h2>${esc(l.title)}</h2><ul>${l.must_memorize.slice(0,12).map(x=>`<li>${esc(x.text)}</li>`).join('')}</ul></div><div class="memory-actions"><button data-open-memory="${l.id}">打开完整必记</button><button data-mem="${l.id}" class="${memory[l.id]?'active':''}">${memory[l.id]?'✓ 已过':'标记已过'}</button></div></article>`).join('')}</section>`;
}
function openSourceDialog(lid,pages){
  const l=lesson(lid), ps=pages.map(Number);
  const dlg=document.createElement('dialog');dlg.className='source-dialog';
  dlg.innerHTML=`<div class="dialog-head"><div><b>${esc(l.title)}</b><span>${pageLabel(ps)}</span></div><button id="closeDlg">×</button></div>${sourceImages(l,ps,true)}`;
  document.body.appendChild(dlg);dlg.showModal();dlg.querySelector('#closeDlg').onclick=()=>{dlg.close();dlg.remove()};dlg.onclick=e=>{if(e.target===dlg){dlg.close();dlg.remove()}};
}
function bind(){
  $('#home').onclick=()=>{state.lesson=null;state.memory=false;state.query='';render()};
  $('#search').oninput=e=>{state.query=e.target.value;state.memory=false;clearTimeout(window.__q);window.__q=setTimeout(render,160)};
  document.querySelectorAll('[data-subject]').forEach(b=>b.onclick=()=>{state.subject=b.dataset.subject;state.lesson=null;state.memory=false;render()});
  document.querySelectorAll('[data-home-sub]').forEach(b=>b.onclick=()=>{state.subject=b.dataset.homeSub;render()});
  document.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>setLesson(b.dataset.lesson));
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;render()});
  document.querySelectorAll('[data-hit]').forEach(b=>b.onclick=()=>setLesson(b.dataset.hit));
  document.querySelectorAll('[data-open-memory]').forEach(b=>b.onclick=()=>setLesson(b.dataset.openMemory,'memory'));
  document.querySelectorAll('[data-mem]').forEach(b=>b.onclick=()=>{memory[b.dataset.mem]=!memory[b.dataset.mem];save(MEM,memory);render()});
  $('#memoryMode').onclick=()=>{state.memory=true;state.lesson=null;state.query='';render()};
  $('#clearSearch').onclick=()=>{state.query='';state.memory=false;render()};
  document.querySelectorAll('[data-open-source]').forEach(b=>b.onclick=()=>openSourceDialog(b.dataset.openSource,b.dataset.pages.split(',')));
  document.querySelectorAll('[data-single-source]').forEach(b=>b.onclick=()=>openSourceDialog(b.dataset.singleSource,[b.dataset.page]));
  document.querySelectorAll('[data-source-page]').forEach(b=>b.onclick=()=>openSourceDialog(state.lesson,[b.dataset.sourcePage]));
  if(state.lesson){
    const l=lesson(state.lesson);
    $('#markDone').onclick=()=>{progress[l.id]=!progress[l.id];save(PROG,progress);render()};
    $('#markMemory').onclick=()=>{memory[l.id]=!memory[l.id];save(MEM,memory);render()};
  }
}
fetch('public/data/organized-lessons.json').then(r=>r.json()).then(d=>{DB=d;render()}).catch(e=>{app.innerHTML=`<div class="fatal">知识库加载失败：${esc(e.message)}</div>`});
