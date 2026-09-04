import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const root = path.resolve(new URL('..', import.meta.url).pathname)
const pub = path.join(root, 'public')
const kbPath = path.join(pub, 'data', '408-kb.json')
const kb = JSON.parse(fs.readFileSync(kbPath, 'utf8'))

let errors = []
let warnings = []
let pdfCount = 0
let totalPdfBytes = 0

for (const node of kb.nodes) {
  for (const ref of node.source_refs || []) {
    if (!ref.asset_path) continue
    const p = path.join(pub, ref.asset_path)
    if (!fs.existsSync(p)) errors.push(`Missing source asset: ${ref.asset_path}`)
  }
}

const sourcesRoot = path.join(pub, 'sources')
if (fs.existsSync(sourcesRoot)) {
  const walk = d => fs.readdirSync(d, {withFileTypes:true}).flatMap(ent => {
    const p = path.join(d, ent.name)
    return ent.isDirectory() ? walk(p) : [p]
  })
  for (const p of walk(sourcesRoot)) {
    if (p.toLowerCase().endsWith('.pdf')) {
      pdfCount++
      totalPdfBytes += fs.statSync(p).size
    }
  }
} else {
  warnings.push('public/sources absent: this is expected for the lite package.')
}

const required = [
  'index.html', 'src/App.tsx', 'src/main.tsx', 'src/kbTypes.ts',
  'public/data/408-kb.json', 'public/data/compat-index.json',
  'public/data/site-manifest.json', 'vercel.json', 'netlify.toml'
]
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) errors.push(`Missing required file: ${rel}`)
}

const result = {
  nodes: kb.nodes.length,
  subtopics: kb.nodes.reduce((n,x)=>n+(x.subtopics?.length||0),0),
  sourcePdfs: pdfCount,
  sourcePdfBytes: totalPdfBytes,
  errors,
  warnings
}
console.log(JSON.stringify(result, null, 2))
if (errors.length) process.exit(1)
