
import fs from 'node:fs';import path from 'node:path';
const root=process.cwd(),p=path.join(root,'public/data/organized-lessons.json');
const db=JSON.parse(fs.readFileSync(p,'utf8')),errors=[];
if(db.lessons.length!==350)errors.push(`lessons ${db.lessons.length}`);
if(db.stats.pages!==6058)errors.push(`pages ${db.stats.pages}`);
if(db.stats.unique_text_line_coverage!==1)errors.push(`coverage ${db.stats.unique_text_line_coverage}`);
for(const l of db.lessons){
  if(!l.blocks?.length)errors.push(`${l.id}: no organized blocks`);
  if(!l.summary_pages?.length)errors.push(`${l.id}: no summary anchor`);
  if(!l.must_memorize?.length)errors.push(`${l.id}: no memory items`);
  for(let p=1;p<=l.pages;p++){
    const f=path.join(root,'public',l.slide_base,String(p).padStart(3,'0')+'.webp');
    if(!fs.existsSync(f))errors.push(`${l.id}: missing slide ${p}`);
  }
  for(const p of l.summary_pages)if(p<1||p>l.pages)errors.push(`${l.id}: bad summary page ${p}`);
}
console.log(JSON.stringify({
  lessons:db.lessons.length,pages:db.stats.pages,organizedBlocks:db.stats.organized_blocks,
  exampleBlocks:db.stats.example_blocks,explicitSummaryLessons:db.stats.explicit_summary_lessons,
  fallbackSummaryLessons:db.stats.fallback_summary_lessons,textCoverage:db.stats.unique_text_line_coverage,
  errors:errors.length
},null,2));
if(errors.length){console.error(errors.slice(0,50).join('\n'));process.exit(1)}
