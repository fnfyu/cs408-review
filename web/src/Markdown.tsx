import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

function withBase(path: string) {
  const base = import.meta.env.BASE_URL || '/'
  if (path.startsWith('/')) {
    return `${base.replace(/\/?$/, '/')}${path.slice(1)}`
  }
  return `${base.replace(/\/?$/, '/')}${path}`
}

/** 考点正文里是 figures/ch1.png，磁盘实际在 figures/<科目>/ch1.png */
function resolveImgSrc(src: string | undefined, subjectId?: string) {
  if (!src) return src
  if (/^https?:\/\//i.test(src)) return src

  const bare = src.replace(/^\.\//, '')
  const m = bare.match(/^(?:\/)?figures\/(?:(os|ds|coa|net)\/)?(.+)$/i)
  if (m) {
    const sid = m[1] || subjectId
    if (sid) return withBase(`/figures/${sid}/${m[2]}`)
  }
  if (bare.startsWith('/')) return withBase(bare)
  if (subjectId && bare.startsWith('figures/')) {
    return withBase(`/figures/${subjectId}/${bare.slice('figures/'.length)}`)
  }
  return withBase(bare.startsWith('/') ? bare : `/${bare}`)
}

export function Markdown({
  source,
  subjectId,
}: {
  source: string
  subjectId?: string
}) {
  if (!source?.trim()) return null

  const components: Components = {
    img: ({ src, alt, ...rest }) => (
      <img src={resolveImgSrc(src, subjectId)} alt={alt ?? ''} loading="lazy" {...rest} />
    ),
  }

  return (
    <div className="md-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  )
}
