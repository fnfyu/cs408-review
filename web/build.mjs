import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
for (const f of ['index.html', 'styles.css', 'app.js']) {
  fs.copyFileSync(path.join(root, f), path.join(dist, f));
}
fs.cpSync(path.join(root, 'public'), path.join(dist, 'public'), { recursive: true });

// Netlify / Cloudflare Pages 也会读 publish 目录下的 _headers
fs.writeFileSync(
  path.join(dist, '_headers'),
  [
    '/public/data/*',
    '  Cache-Control: public, max-age=0, must-revalidate',
    '',
    '/public/slides/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '/public/figures/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '/public/sources/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    '/index.html',
    '  Cache-Control: public, max-age=0, must-revalidate',
    '',
    '/app.js',
    '  Cache-Control: public, max-age=0, must-revalidate',
    '',
    '/styles.css',
    '  Cache-Control: public, max-age=0, must-revalidate',
    '',
  ].join('\n'),
);

console.log('built static site -> dist');
