import fs from 'node:fs';
import path from 'node:path';

const chapterOrder = Number(process.argv[2] || 1);
const root = path.resolve(import.meta.dirname, '..');
const org = JSON.parse(fs.readFileSync(path.join(root, 'public/data/organized-lessons.json'), 'utf8'));
const all = JSON.parse(fs.readFileSync(path.join(root, 'public/data/all-lessons.json'), 'utf8'));
const lessons = org.lessons.filter((l) => l.subject === 'co' && l.chapter_order === chapterOrder);

let out = '';
for (const l of lessons) {
  const a = all.lessons.find((x) => x.id === l.id);
  out += `==== ${l.id} ${l.title} pages=${l.pages} blocks=${l.blocks.length}\n`;
  for (const p of a.page_texts) {
    let t = p.text
      .split('\n')
      .filter((line) => !/王道考研|CSKAOYAN|WWW\.CSKAOYAN/i.test(line))
      .join('\n')
      .trim();
    if (!t || /扫码咨询|完整版课程|1V1择校/.test(t)) continue;
    out += `--p${p.page}--\n${t}\n\n`;
  }
  out += `SUMMARY_PAGES: ${JSON.stringify(l.summary_pages)}\n`;
  out += `CURRENT_MUST: ${l.must_memorize.map((x) => x.text).join(' || ')}\n\n`;
}

const outPath = path.join(root, `_co_ch${chapterOrder}_dump.txt`);
fs.writeFileSync(outPath, out, 'utf8');
console.log(`wrote ${outPath} (${out.length} chars, ${lessons.length} lessons)`);
