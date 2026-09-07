import fs from 'node:fs';
const db=JSON.parse(fs.readFileSync('public/data/all-lessons.json','utf8'));let errors=[],summaryImages=0;
if(db.lessons.length!==350)errors.push('lesson count');if(db.lessons.reduce((s,x)=>s+x.pages,0)!==6058)errors.push('page count');
for(const l of db.lessons){if(!l.summary_pages?.length)errors.push(`no summary ${l.id}`);for(let p=1;p<=l.pages;p++){const f=`public/${l.slide_base}/${String(p).padStart(3,'0')}.webp`;if(!fs.existsSync(f))errors.push(`missing ${f}`)}for(const p of l.summary_pages){const f=`public/summaries/${l.id}/${String(p).padStart(3,'0')}.webp`;if(!fs.existsSync(f))errors.push(`missing summary ${f}`);else summaryImages++}}
console.log(JSON.stringify({lessons:db.lessons.length,pages:db.stats.pages,summaryLessons:db.lessons.filter(x=>x.summary_pages.length).length,summaryImages,errors:errors.length},null,2));if(errors.length){console.error(errors.slice(0,30));process.exit(1)}
