export type Mastery = '了解' | '理解' | '掌握' | '熟练掌握'

export interface KnowledgePoint {
  id: string
  title: string
  bodyMd: string
  mastery: Mastery
  plain: string
  examForm: string
  memoryTip?: string
  summary: string
  slides?: string[]
}

export interface Section {
  id: string
  title: string
  intro?: string
  points: KnowledgePoint[]
}

export interface Chapter {
  id: string
  title: string
  overview: string
  sections: Section[]
  examples: string
  pitfalls: string
}

export interface SubjectData {
  id: string
  title: string
  name: string
  short: string
  color: string
  chapters: Chapter[]
  figures: string[]
  stats: { chapters: number; points: number; figures: number }
}

export interface CatalogSubject {
  id: string
  name: string
  short: string
  color: string
  stats: { chapters: number; points: number; figures: number }
  dataFile: string
}

export interface Catalog {
  subjects: CatalogSubject[]
  generatedAt: string
}

export interface LessonItem {
  id: string
  title: string
  pages: number
  visualPages: number
  preview: string
  pagesUrl: string
}

export interface LessonsCatalog {
  subjects: Record<string, Record<string, LessonItem[]>>
}

export type View =
  | { kind: 'home' }
  | { kind: 'subject'; subjectId: string }
  | { kind: 'chapter'; subjectId: string; chapterId: string; tab?: 'points' | 'examples' | 'pitfalls' | 'slides' | 'lessons' }
  | { kind: 'point'; subjectId: string; chapterId: string; pointId: string }
  | { kind: 'lesson'; subjectId: string; lessonId: string }
  | { kind: 'search'; q: string }
  | { kind: 'quiz'; subjectId: string }
