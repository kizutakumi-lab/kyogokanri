import { IP, Project, AuditLog } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';

function generateUUID(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  // Fallback UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const INITIAL_IPS: IP[] = [
  { id: '11111111-1111-4111-8111-111111111111', name: '秘密結社鷹の爪', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '22222222-2222-4222-8222-222222222222', name: '吉田勝子', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '33333333-3333-4333-8333-333333333333', name: '貝社員', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '44444444-4444-4444-8444-444444444444', name: 'そろ谷のアニメっち', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '55555555-5555-4555-8555-555555555555', name: '耐え子の日常', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '66666666-6666-4666-8666-666666666666', name: 'パンパカパンツ', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '77777777-7777-4777-8777-777777777777', name: '昼メシの流儀', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '88888888-8888-4888-8888-888888888888', name: '小３アシベ', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '99999999-9999-4999-8999-999999999999', name: 'きらにこ', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'その他', active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const INITIAL_PROJECTS: Project[] = [];

const INITIAL_LOGS: AuditLog[] = [
  {
    id: 'f6666666-6666-4666-8666-666666666666',
    project_id: 'e5555555-5555-4555-8555-555555555555',
    action: 'CREATE',
    user_name: '営業部 田中',
    user_email: 'tanaka@example.com',
    details: '新規案件「パンパカパンツ 秋のウチカフェスイーツタイアップ」を登録しました。',
    created_at: '2026-08-10T16:00:00.000Z',
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

export const DataService = {
  // IP一覧の取得
  async getIPs(): Promise<IP[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from(TABLES.IPS).select('*').order('created_at', { ascending: true });
        if (!error && data && data.length > 0) {
          setLocal(STORAGE_KEYS.IPS, data);
          return data as IP[];
        }
      } catch (e) {
        console.warn('Supabase getIPs fallback to local storage:', e);
      }
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
      if (index >= 0) ips[index] = updatedIp;
      else ips.unshift(updatedIp);
    } else {
      updatedIp = {
        id: generateUUID(),
        name: ipData.name,
        active: ipData.active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      ips.push(updatedIp);
    }

    setLocal(STORAGE_KEYS.IPS, ips);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from(TABLES.IPS).upsert([updatedIp]);
      } catch (e) {
        console.error('Supabase saveIP error:', e);
      }
    }

    return updatedIp;
  },

  // IPの無効化
  async deleteIP(id: string): Promise<void> {
    const ips = await this.getIPs();
    const updated = ips.map((ip) => (ip.id === id ? { ...ip, active: false } : ip));
    setLocal(STORAGE_KEYS.IPS, updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from(TABLES.IPS).update({ active: false }).eq('id', id);
      } catch (e) {
        console.error('Supabase deleteIP error:', e);
      }
    }
  },

  // 案件一覧の取得
  async getProjects(): Promise<Project[]> {
    const localProjs = getLocal<Project[]>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS).filter((p) => !p.deleted_at);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from(TABLES.PROJECTS)
          .select(`*, ${TABLES.PROJECT_IPS}(ip_id)`)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const supabaseProjects: Project[] = data.map((item: any) => ({
            ...item,
            ip_ids: item[TABLES.PROJECT_IPS] ? item[TABLES.PROJECT_IPS].map((pi: any) => pi.ip_id) : [],
          }));

          // Supabaseのデータとローカルデータを重複なしでマージ
          const mergedMap = new Map<string, Project>();
          localProjs.forEach((p) => mergedMap.set(p.id, p));
          supabaseProjects.forEach((p) => mergedMap.set(p.id, p));

          const mergedList = Array.from(mergedMap.values()).filter((p) => !p.deleted_at);
          setLocal(STORAGE_KEYS.PROJECTS, mergedList);
          return mergedList;
        }
      } catch (e) {
        console.warn('Supabase getProjects error, using local data:', e);
      }
    }

    return localProjs;
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
        id: generateUUID(),
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
      if (index >= 0) projects[index] = project;
      else projects.unshift(project);
    }

    // 必ず画面に表示されるよう、ローカルストレージへ即保存
    setLocal(STORAGE_KEYS.PROJECTS, projects);

    // ログ記録
    await this.addAuditLog({
      project_id: project.id,
      action: isNew ? 'CREATE' : 'UPDATE',
      user_name: userName,
      user_email: `${userName.toLowerCase()}@company.com`,
      details: `${isNew ? '新規案件' : '案件修正'}: 「${project.campaign_name}」（${project.client_name}様）`,
    });

    // Supabaseに同期
    if (isSupabaseConfigured && supabase) {
      try {
        const { ip_ids, ...projObj } = project;
        const { error: projError } = await supabase.from(TABLES.PROJECTS).upsert([projObj]);
        if (projError) {
          console.error('Supabase project upsert error:', projError);
        }

        // 中間テーブル更新
        await supabase.from(TABLES.PROJECT_IPS).delete().eq('project_id', project.id);
        if (ip_ids && ip_ids.length > 0) {
          const relations = ip_ids.map((ip_id) => ({ project_id: project.id, ip_id }));
          const { error: relError } = await supabase.from(TABLES.PROJECT_IPS).insert(relations);
          if (relError) {
            console.error('Supabase project_ips insert error:', relError);
          }
        }
      } catch (e) {
        console.error('Supabase saveProject sync error:', e);
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
      try {
        await supabase.from(TABLES.PROJECTS).update({ deleted_at: now }).eq('id', id);
      } catch (e) {
        console.error('Supabase deleteProject error:', e);
      }
    }
  },

  // ログ一覧の取得
  async getAuditLogs(): Promise<AuditLog[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from(TABLES.AUDIT_LOGS).select('*').order('created_at', { ascending: false });
        if (!error && data) return data as AuditLog[];
      } catch (e) {
        console.warn('Supabase getAuditLogs error:', e);
      }
    }
    return getLocal<AuditLog[]>(STORAGE_KEYS.LOGS, INITIAL_LOGS);
  },

  // ログ追加
  async addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog> {
    const logs = getLocal<AuditLog[]>(STORAGE_KEYS.LOGS, INITIAL_LOGS);
    const newLog: AuditLog = {
      ...log,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    };
    logs.unshift(newLog);
    setLocal(STORAGE_KEYS.LOGS, logs);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from(TABLES.AUDIT_LOGS).insert([newLog]);
      } catch (e) {
        console.error('Supabase addAuditLog error:', e);
      }
    }

    return newLog;
  },
};
