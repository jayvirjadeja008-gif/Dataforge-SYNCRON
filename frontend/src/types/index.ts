export type AppRoute = 'home' | 'dashboard' | 'docs' | 'privacy' | 'terms' | 'domain' | 'install' | '404';

export interface IssueSample {
  id: string;
  number: number;
  title: string;
  body: string;
  author: string;
  category: string;
  appliedLabels: Array<{ name: string; color: string; confidence: number }>;
  duplicateMatch: {
    number: number;
    title: string;
    similarity: number;
    reason: string;
  } | null;
  draftReply: {
    markdown: string;
    reproductionChecklist: Array<{ item: string; satisfied: boolean }>;
    maintainerActionRequired: string;
  };
}

export interface SuggestedPatch {
  file_path: string;
  patch_diff: string;
  explanation: string;
  confidence: number;
  target_branch?: string;
  lines_added?: number;
  lines_removed?: number;
}

export interface TriageRecord {
  id: string;
  repo_full_name: string;
  issue_number: number;
  issue_title: string;
  issue_author: string;
  category: string;
  applied_labels: Array<{ name: string; color: string; confidence: number }>;
  duplicate_match: {
    number: number;
    title: string;
    similarity: number;
    reason: string;
  } | null;
  draft_reply_markdown: string;
  checklist: Array<{ item: string; satisfied: boolean }>;
  suggested_patch?: SuggestedPatch | null;
  status: 'pending' | 'approved';
  github_comment_id?: number | null;
  created_at: string;
  approved_at?: string | null;
}

export interface TriageStats {
  total_triaged: number;
  approved: number;
  pending: number;
  duplicates_flagged: number;
  avg_confidence: number;
}

export interface RepoIssue {
  number: number;
  title: string;
  body: string;
  state: string;
  author: string;
  labels: string[];
  html_url: string;
  created_at: string;
  updated_at: string;
  comments_count: number;
}

export interface StreamEvent {
  id: string;
  timestamp: string;
  type: string;
  repo: string;
  issue_number: number;
  title: string;
  details: string;
  status: 'info' | 'warning' | 'success' | 'error';
}

export interface RepoPulseItem {
  name: string;
  full_name: string;
  health_score: number;
  open_issues: number;
  avg_sla_minutes: number;
  sla_status: 'optimal' | 'warning' | 'breached';
  duplicate_rate: number;
  automated_ratio: number;
  primary_language: string;
  last_activity: string;
  active_labels: string[];
}

export interface PulseMatrixResponse {
  target_user: string;
  team: string;
  total_repositories: number;
  overall_health_score: number;
  global_avg_sla_minutes: number;
  repositories: RepoPulseItem[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  mode?: 'live' | 'fallback_simulation';
}

export interface OllamaStatus {
  online: boolean;
  base_url: string;
  models: string[];
  active_model: string;
  model_available: boolean;
  mode: 'live' | 'fallback_simulation';
  status_text: string;
  instruction?: string;
}
