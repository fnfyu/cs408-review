export type Tier = 'S' | 'A' | 'B' | 'C' | 'D'
export type SubjectId = 'ds' | 'co' | 'os' | 'cn'

export interface WorkedExample { prompt:string; steps:string[]; conclusion:string }
export interface FullText { overview:string; deep_dive:string[]; worked_example:WorkedExample; exam_focus:string[]; mistakes:string[]; quick_review:string[] }
export interface Subtopic {
  subtopic_id?: string
  source_ref_ids?: string[]
  question_ref_ids?: string[]
  name: string
  full_text?: FullText
  tier?: Tier
  core?: string[]
  model?: string
  visual_model?: string
}
export interface SourceRef {
  ref_id?: string
  pdf?: string
  page?: number
  preview?: string
  asset_path?: string
  archive?: string
  source_status?: string
  variant_role?: string
}
export interface QuestionRef {
  ref_id?: string
  subtopic?: string
  evidence?: string
  scope?: string
  note?: string
}
export interface Node {
  node_id: string
  slug: string
  subject: SubjectId
  title: string
  working_tier: Tier
  importance: { tier: Tier; finality: 'stable' | 'provisional'; reason: string; score_hint?: number }
  subtopics: Subtopic[]
  visual_explanations: string[]
  problem_templates: string[]
  common_traps: string[]
  search_tags: string[]
  source_refs: SourceRef[]
  question_refs: QuestionRef[]
  review_summary: { must_master: string[]; can_compress: string[]; source_page_count: number; question_evidence_count: number }
  card?: { title:string; tier:Tier; must_master:string[]; common_traps:string[]; source_count:number; question_evidence_count:number }
}
export interface KnowledgeBase {
  schema_version: string
  stats: { nodes:number; subtopics:number; subjects:number }
  source_audit_summary?: { total_files:number; representative_files_bundled:number; status_counts:Record<string,number>; subject_counts:Record<string,number> }
  indexes: { by_subject: Record<SubjectId,string[]>; by_tier: Record<string,string[]>; by_tag: Record<string,string[]> }
  nodes: Node[]
}
