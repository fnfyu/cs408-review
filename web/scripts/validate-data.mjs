import fs from 'node:fs'
const kb=JSON.parse(fs.readFileSync(new URL('../public/data/408-kb.json',import.meta.url),'utf8'))
const compat=JSON.parse(fs.readFileSync(new URL('../public/data/compat-index.json',import.meta.url),'utf8'))
let errors=[]
let ids=new Set(), subIds=new Set()
for(const n of kb.nodes){
  if(ids.has(n.node_id)) errors.push(`duplicate node ${n.node_id}`); ids.add(n.node_id)
  if(!n.source_refs?.length) errors.push(`no source refs ${n.node_id}`)
  if(!n.question_refs?.length) errors.push(`no question refs ${n.node_id}`)
  for(const s of n.subtopics||[]){
    if(!s.subtopic_id) errors.push(`missing subtopic id ${n.node_id}/${s.name}`)
    else if(subIds.has(s.subtopic_id)) errors.push(`duplicate subtopic ${s.subtopic_id}`)
    else subIds.add(s.subtopic_id)
    for(const rid of s.source_ref_ids||[]) if(!n.source_refs.some(x=>x.ref_id===rid)) errors.push(`bad source ref ${rid}`)
    for(const rid of s.question_ref_ids||[]) if(!n.question_refs.some(x=>x.ref_id===rid)) errors.push(`bad q ref ${rid}`)
  }
  for(const s of n.source_refs||[]){
    if(s.asset_path){
      const p=new URL('../public/'+s.asset_path,import.meta.url)
      if(!fs.existsSync(p)) errors.push(`missing asset ${s.asset_path}`)
    }
  }
}
const sourceTopics=Object.values(compat.original_chapters).flat().flatMap(c=>c.topics)

const practicePath = new URL('../public/data/practice-bank.json',import.meta.url)
const practice = JSON.parse(fs.readFileSync(practicePath,'utf8'))
const validSubIds = new Set(kb.nodes.flatMap(n=>(n.subtopics||[]).map(s=>s.subtopic_id).filter(Boolean)))
const qids = new Set()
for(const q of practice.questions||[]){
  if(qids.has(q.id)) errors.push(`duplicate practice question ${q.id}`)
  qids.add(q.id)
  if(!validSubIds.has(q.subtopic_id)) errors.push(`bad practice subtopic ${q.subtopic_id}`)
  if(!q.answer?.points) errors.push(`missing answer ${q.id}`)
}

console.log(JSON.stringify({nodes:ids.size,subtopics:subIds.size,sourceTopics:sourceTopics.length,practiceQuestions:qids.size,errors:errors.length},null,2))
if(errors.length){console.error(errors.slice(0,30).join('\n'));process.exit(1)}
