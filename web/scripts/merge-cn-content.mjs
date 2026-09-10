import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const orgPath = path.join(root, 'public/data/organized-lessons.json');
const contentDir = path.join(root, 'content/cn');

const EXAMPLE_KINDS = new Set(['例题与应用', '公式/代码/计算']);

function loadPatches() {
  const files = fs.readdirSync(contentDir).filter((f) => /^ch\d+[a-z]?\.json$/.test(f)).sort();
  const map = new Map();
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(contentDir, f), 'utf8'));
    for (const [id, lesson] of Object.entries(data.lessons || {})) {
      if (!lesson.blocks?.length) throw new Error(`${f}:${id} missing blocks`);
      if (!lesson.must_memorize?.length) throw new Error(`${f}:${id} missing must_memorize`);
      map.set(id, { ...lesson, _from: f, _chapter: data.chapter });
    }
  }
  return map;
}

function applyLesson(target, patch) {
  target.blocks = patch.blocks.map((b) => ({
    heading: b.heading,
    kind: b.kind,
    pages: [...b.pages],
    lines: [...b.lines],
    visual_only: Boolean(b.visual_only),
  }));
  target.must_memorize = patch.must_memorize.map((m) => ({
    text: m.text,
    page: m.page,
  }));
  target.examples = target.blocks
    .filter((b) => EXAMPLE_KINDS.has(b.kind))
    .map((b) => ({
      heading: b.heading,
      pages: [...b.pages],
      kind: b.kind,
      lines: [...b.lines],
    }));
  target.rewrite_meta = {
    source: patch._from,
    rewritten: true,
    chapter: patch._chapter,
  };
}

const patches = loadPatches();
const db = JSON.parse(fs.readFileSync(orgPath, 'utf8'));
let updated = 0;
const missing = [];

for (const [id, patch] of patches) {
  const lesson = db.lessons.find((l) => l.id === id);
  if (!lesson) {
    missing.push(id);
    continue;
  }
  applyLesson(lesson, patch);
  updated++;
}

db.stats.organized_blocks = db.lessons.reduce((n, l) => n + l.blocks.length, 0);
db.stats.example_blocks = db.lessons.reduce((n, l) => n + l.examples.length, 0);
db.stats.cn_rewritten_lessons = [...patches.keys()].filter((id) =>
  db.lessons.some((l) => l.id === id),
).length;

fs.writeFileSync(orgPath, JSON.stringify(db));
console.log(
  JSON.stringify(
    {
      patchFiles: fs.readdirSync(contentDir).filter((f) => /^ch\d+[a-z]?\.json$/.test(f)).sort(),
      patchedLessons: updated,
      missingInDb: missing,
      organized_blocks: db.stats.organized_blocks,
      example_blocks: db.stats.example_blocks,
      cn_rewritten_lessons: db.stats.cn_rewritten_lessons,
    },
    null,
    2,
  ),
);
