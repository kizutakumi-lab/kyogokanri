export type ProjectStatus =
  | '提案前'
  | '提案中'
  | '受注／制作中'
  | '公開中'
  | '契約終了';

export type ExclusionState = '競合排除中' | '終了間近' | '開始予定' | '終了済み';

export interface IP {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  client_name: string;
  agency_name: string;
  campaign_name: string;
  exclusion_scope: string; // e.g. "ビール", "アルコール飲料全般", "コンビニエンスストア"
  exclusion_start_date: string; // YYYY-MM-DD
  exclusion_end_date: string; // YYYY-MM-DD
  status: ProjectStatus;
  amount: number; // 円
  notes: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  // Associated IP IDs
  ip_ids: string[];
}

export interface AuditLog {
  id: string;
  project_id?: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'DUPLICATE';
  user_name: string;
  user_email: string;
  details: string; // Summary description or JSON
  created_at: string;
}

export interface OverlapWarning {
  existingProject: Project;
  ipNames: string[];
  reason: string;
}
