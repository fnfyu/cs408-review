/** 王道 computer-408 源仓库（原课件按需外链，不打进静态包） */
export const GITEE_REPO = 'https://gitee.com/what333/computer-408'
const GITEE_TREE = `${GITEE_REPO}/tree/master`

export const SUBJECT_FOLDERS: Record<string, string> = {
  os: '【课件】操作系统基础考点讲解',
  ds: '【课件】数据结构基础考点讲解',
  coa: '【课件】组成原理基础考点讲解',
  net: '【课件】计算机网络基础考的讲解',
}

function encPath(segments: string[]) {
  return segments.map((s) => encodeURIComponent(s)).join('/')
}

export function giteeSubjectUrl(subjectId: string) {
  const folder = SUBJECT_FOLDERS[subjectId]
  if (!folder) return GITEE_REPO
  return `${GITEE_TREE}/${encPath([folder])}`
}

/** lesson.id 形如 `coa/第一章 …/1.0_xxx` → 链到对应章节目录 */
export function giteeLessonUrl(lessonId: string) {
  const parts = lessonId.split('/')
  const folder = SUBJECT_FOLDERS[parts[0]]
  if (!folder) return GITEE_REPO
  if (parts.length >= 2) {
    return `${GITEE_TREE}/${encPath([folder, parts[1]])}`
  }
  return giteeSubjectUrl(parts[0])
}
