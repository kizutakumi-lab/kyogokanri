import { IP, Project, AuditLog } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';

const INITIAL_IPS: IP[] = [
  { id: 'ip-1', name: '秘密結社鷹の爪', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'ip-2', name: '吉田勝子', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'ip-3', name: '貝社員', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'ip-4', name: 'そろ谷のアニメっち', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'ip-5', name: '耐え子の日常', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'ip-6', name: 'パンパカパンツ', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'ip-7', name: '昼メシの流儀', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'ip-8', name: '小３アシベ', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'ip-9', name: 'きらにこ', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'ip-10', name: 'その他', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    client_name: 'サッポロビール',
    agency_name: '電通',
    campaign_name: '鷹の爪×黒ラベル 夏のタイアップCM',
    exclusion_scope: 'ビール・発泡酒',
    exclusion_start_date: '2026-05-01',
    exclusion_end_date: '2026-09-15', // 終了間近 (残り26日)
    status: '公開中',
    amount: 15000000,
    notes: 'TVCMおよびWeb広告での限定アニメ演出。日本国内限定。',
    created_at: '2026-04-10T10:00:00.000Z',
    updated_at: '2026-04-10T10:00:00.000Z',
    deleted_at: null,
    ip_ids: ['ip-1'], // 秘密結社鷹の爪
  },
  {
    id: 'proj-2',
    client_name: 'トヨタ自動車',
    agency_name: '博報堂',
    campaign_name: 'そろ谷のアニメっち×SUV 新車発表コラボ',
    exclusion_scope: '自動車メーカー・乗用車',
    exclusion_start_date: '2026-03-01',
    exclusion_end_date: '2026-12-31', // 排除中
    status: '公開中',
    amount: 28000000,
    notes: 'YouTubeタイアップアニメ動画3本制作＋店舗ポップ展開。',
    created_at: '2026-02-15T09:00:00.000Z',
    updated_at: '2026-02-15T09:00:00.000Z',
    deleted_at: null,
    ip_ids: ['ip-4'], // そろ谷のアニメっち
  },
  {
    id: 'proj-3',
    client_name: 'NTTドコモ',
    agency_name: 'ADK',
    campaign_name: '貝社員＆耐え子 5G新料金プラン比較キャンペーン',
    exclusion_scope: '携帯通信キャリア・通信インフラ',
    exclusion_start_date: '2026-06-01',
    exclusion_end_date: '2026-11-30', // 排除中
    status: '公開中',
    amount: 35000000,
    notes: '貝社員と耐え子のコラボSNSマンガ＋店頭ノベルティグッズ配布。',
    created_at: '2026-05-20T11:00:00.000Z',
    updated_at: '2026-05-20T11:00:00.000Z',
    deleted_at: null,
    ip_ids: ['ip-3', 'ip-5'], // 貝社員, 耐え子の日常
  },
  {
    id: 'proj-4',
    client_name: 'セブン-イレブン',
    agency_name: '東急エージェンシー',
    campaign_name: '吉田勝子 お惣菜大感謝フェア',
    exclusion_scope: 'コンビニエンスストア',
    exclusion_start_date: '2026-08-01',
    exclusion_end_date: '2026-09-05', // 終了間近 (残り16日)
    status: '公開中',
    amount: 12000000,
    notes: '勝子コラボ弁当・クリアファイルプレゼント企画。',
    created_at: '2026-07-01T14:30:00.000Z',
    updated_at: '2026-07-01T14:30:00.000Z',
    deleted_at: null,
    ip_ids: ['ip-2'], // 吉田勝子
  },
  {
    id: 'proj-5',
    client_name: 'ローソン',
    agency_name: '電通',
    campaign_name: 'パンパカパンツ 秋のウチカフェスイーツタイアップ',
    exclusion_scope: 'コンビニエンスストア',
    exclusion_start_date: '2026-10-01',
    exclusion_end_date: '2027-01-31', // 開始予定
    status: '受注／制作中',
    amount: 18000000,
    notes: 'タイアップスイーツ2種全国発売。オリジナルステッカー封入。',
    created_at: '2026-08-10T16:00:00.000Z',
    updated_at: '2026-08-10T16:00:00.000Z',
    deleted_at: null,
    ip_ids: ['ip-6'], // パンパカパンツ
  },
  {
    id: 'proj-6',
    client_name: '日清食品',
    agency_name: 'ジェイアール東日本企画',
    campaign_name: '昼メシの流儀 コラボカップ麺開発＆プロモーション',
    exclusion_scope: '即席麺・カップ麺・インスタント食品',
    exclusion_start_date: '2025-10-01',
    exclusion_end_date: '2026-03-31', // 終了済み
    status: '契約終了',
    amount: 22000000,
    notes: 'パッケージコラボ＋オリジナル短編マンガ制作。',
    created_at: '2025-09-01T10:00:00.000Z',
    updated_at: '2026-04-01T09:00:00.000Z',
    deleted_at: null,
    ip_ids: ['ip-7'], // 昼メシの流儀
  },
  {
    id: 'proj-7',
    client_name: 'アサヒ飲料',
    agency_name: '大広',
    campaign_name: '小３アシベ＆きらにこ 熱中症対策ドリンクプロモーション',
    exclusion_scope: '清涼飲料水・スポーツドリンク',
    exclusion_start_date: '2026-07-01',
    exclusion_end_date: '2026-08-28', // 終了間近 (残り8日)
    status: '公開中',
    amount: 9500000,
    notes: '小学生向け熱中症予防啓発ポスターおよびWebアニメ。',
    created_at: '2026-06-15T08:00:00.000Z',
    updated_at: '2026-06-15T08:00:00.000Z',
    deleted_at: null,
    ip_ids: ['ip-8', 'ip-9'], // 小３アシベ, きらにこ
  },
];

const INITIAL_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    project_id: 'proj-5',
    action: 'CREATE',
    user_name: '営業部 田中',
    user_email: 'tanaka@example.com',
    details: '新規案件「パンパカパンツ 秋のウチカフェスイーツタイアップ」を登録しました。',
    created_at: '2026-08-10T16:00:00.000Z',
  },
  {
    id: 'log-2',
    project_id: 'proj-4',
    action: 'UPDATE',
    user_name: '営業部 佐々木',
    user_email: 'sasaki@example.com',
    details: '案件「吉田勝子 お惣菜大感謝フェア」の金額を 12,000,000円 に更新しました。',
    created_at: '2026-07-01T14:30:00.000Z',
  },
];

const TABLE_PREFIX = process.env.NEXT_PUBLIC_SUPABASE_TABLE_PREFIX || '';

const TABLES = {
  IPS: `${TABLE_PREFIX}ips`,
  PROJECTS: `${TABLE_PREFIX}projects`,
  PROJECT_IPS: `${TABLE_PREFIX}project_ips`,
  AUDIT_LOGS: `${TABLE_PREFIX}audit_logs`,
};

const STORAGE_KEYS = {
  IPS: 'conflict_management_ips',
  PROJECTS: 'conflict_management_projects',
  LOGS: 'conflict_management_logs',
};

// ヘルパー関数: LocalStorageアクセス
function getLocal<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch (e) {
    console.error('LocalStorage read error:', e);
    return defaultVal;
  }
}

function setLocal<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

/**
 * データ取得 / 保存サービスクラス
 */
export const DataService = {
  // IP一覧の取得
  async getIPs(): Promise<IP[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from(TABLES.IPS).select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) return data as IP[];
    }
    return getLocal<IP[]>(STORAGE_KEYS.IPS, INITIAL_IPS);
  },

  // IPの保存/更新
  async saveIP(ipData: Partial<IP> & { name: string }): Promise<IP> {
    const ips = await this.getIPs();
    let updatedIp: IP;

    if (ipData.id) {
      const index = ips.findIndex((i) => i.id === ipData.id);
      updatedIp = {
        ...ips[index],
        ...ipData,
        updated_at: new Date().toISOString(),
      };
      ips[index] = updatedIp;
    } else {
      updatedIp = {
        id: `ip-${Date.now()}`,
        name: ipData.name,
        active: ipData.active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      ips.push(updatedIp);
    }

    setLocal(STORAGE_KEYS.IPS, ips);

    if (isSupabaseConfigured && supabase) {
      await supabase.from(TABLES.IPS).upsert([updatedIp]);
    }

    return updatedIp;
  },

  // IPの削除・無効化
  async deleteIP(id: string): Promise<void> {
    const ips = await this.getIPs();
    const updated = ips.map((ip) => (ip.id === id ? { ...ip, active: false } : ip));
    setLocal(STORAGE_KEYS.IPS, updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from(TABLES.IPS).update({ active: false }).eq('id', id);
    }
  },

  // 案件一覧の取得
  async getProjects(): Promise<Project[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .select(`*, ${TABLES.PROJECT_IPS}(ip_id)`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map((item: any) => ({
          ...item,
          ip_ids: item[TABLES.PROJECT_IPS] ? item[TABLES.PROJECT_IPS].map((pi: any) => pi.ip_id) : [],
        }));
      }
    }
    const localProjs = getLocal<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    return localProjs.filter((p) => !p.deleted_at);
  },

  // 案件の保存 (新規/更新)
  async saveProject(
    projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'> & { id?: string },
    userName: string = '営業担当'
  ): Promise<Project> {
    const projects = getLocal<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    const isNew = !projectData.id;
    const now = new Date().toISOString();

    let project: Project;

    if (isNew) {
      project = {
        ...projectData,
        id: `proj-${Date.now()}`,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };
      projects.unshift(project);
    } else {
      const index = projects.findIndex((p) => p.id === projectData.id);
      project = {
        ...projects[index],
        ...projectData,
        updated_at: now,
      };
      projects[index] = project;
    }

    setLocal(STORAGE_KEYS.PROJECTS, projects);

    // ログ記録
    await this.addAuditLog({
      project_id: project.id,
      action: isNew ? 'CREATE' : 'UPDATE',
      user_name: userName,
      user_email: `${userName.toLowerCase()}@company.com`,
      details: `${isNew ? '新規案件' : '案件修正'}: 「${project.campaign_name}」（${project.client_name}様）`,
    });

    if (isSupabaseConfigured && supabase) {
      const { ip_ids, ...projObj } = project;
      await supabase.from(TABLES.PROJECTS).upsert([projObj]);
      // 中間テーブル更新
      await supabase.from(TABLES.PROJECT_IPS).delete().eq('project_id', project.id);
      if (ip_ids.length > 0) {
        const relations = ip_ids.map((ip_id) => ({ project_id: project.id, ip_id }));
        await supabase.from(TABLES.PROJECT_IPS).insert(relations);
      }
    }

    return project;
  },

  // 案件の複製
  async duplicateProject(id: string, userName: string = '営業担当'): Promise<Project> {
    const projects = await this.getProjects();
    const target = projects.find((p) => p.id === id);
    if (!target) throw new Error('Target project not found');

    const { id: _, created_at: __, updated_at: ___, ...rest } = target;
    const duplicatedData = {
      ...rest,
      campaign_name: `${target.campaign_name} (コピー)`,
      client_name: `${target.client_name}`,
    };

    return await this.saveProject(duplicatedData, userName);
  },

  // 案件の論理削除
  async deleteProject(id: string, userName: string = '営業担当'): Promise<void> {
    const projects = getLocal<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    const target = projects.find((p) => p.id === id);
    const now = new Date().toISOString();

    const updated = projects.map((p) => (p.id === id ? { ...p, deleted_at: now } : p));
    setLocal(STORAGE_KEYS.PROJECTS, updated);

    if (target) {
      await this.addAuditLog({
        project_id: id,
        action: 'DELETE',
        user_name: userName,
        user_email: `${userName.toLowerCase()}@company.com`,
        details: `案件「${target.campaign_name}」（${target.client_name}様）を削除しました。`,
      });
    }

    if (isSupabaseConfigured && supabase) {
      await supabase.from(TABLES.PROJECTS).update({ deleted_at: now }).eq('id', id);
    }
  },

  // ログ一覧の取得
  async getAuditLogs(): Promise<AuditLog[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from(TABLES.AUDIT_LOGS).select('*').order('created_at', { ascending: false });
      if (!error && data) return data as AuditLog[];
    }
    return getLocal<AuditLog[]>(STORAGE_KEYS.LOGS, INITIAL_LOGS);
  },

  // ログ追加
  async addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
    const logs = getLocal<AuditLog[]>(STORAGE_KEYS.LOGS, INITIAL_LOGS);
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    logs.unshift(newLog);
    setLocal(STORAGE_KEYS.LOGS, logs);

    if (isSupabaseConfigured && supabase) {
      await supabase.from(TABLES.AUDIT_LOGS).insert([newLog]);
    }

    return newLog;
  },
};
