import { Project, OverlapWarning, IP } from '@/types';
import { parseISO, isBefore, isAfter, startOfDay } from 'date-fns';

/**
 * 新規/編集の案件が既存の競合排除中/予定案件と重複・競合しているかチェック
 */
export function checkProjectOverlap(
  candidate: {
    id?: string;
    ip_ids: string[];
    exclusion_scope: string;
    exclusion_start_date: string;
    exclusion_end_date: string;
  },
  existingProjects: Project[],
  ips: IP[]
): OverlapWarning[] {
  const warnings: OverlapWarning[] = [];

  if (
    !candidate.ip_ids.length ||
    !candidate.exclusion_scope.trim() ||
    !candidate.exclusion_start_date ||
    !candidate.exclusion_end_date
  ) {
    return warnings;
  }

  const candStart = startOfDay(parseISO(candidate.exclusion_start_date));
  const candEnd = startOfDay(parseISO(candidate.exclusion_end_date));

  // 有効なプロジェクトのみ対象（論理削除済み除外、契約終了除外）
  const activeProjects = existingProjects.filter(
    (p) => !p.deleted_at && p.status !== '契約終了' && p.id !== candidate.id
  );

  const candScope = candidate.exclusion_scope.toLowerCase();

  for (const proj of activeProjects) {
    // 1. IPの共通点チェック
    const commonIpIds = proj.ip_ids.filter((id) => candidate.ip_ids.includes(id));
    if (commonIpIds.length === 0) continue;

    // 2. 期間重複チェック: [candStart, candEnd] と [projStart, projEnd] のオーバーラップ
    const projStart = startOfDay(parseISO(proj.exclusion_start_date));
    const projEnd = startOfDay(parseISO(proj.exclusion_end_date));

    const isDateOverlapped = !(isBefore(candEnd, projStart) || isAfter(candStart, projEnd));
    if (!isDateOverlapped) continue;

    // 3. 競合範囲の類似・同一チェック
    const projScope = proj.exclusion_scope.toLowerCase();
    const isScopeRelated = isScopeSimilar(candScope, projScope);

    if (isScopeRelated) {
      const matchedIpNames = ips
        .filter((ip) => commonIpIds.includes(ip.id))
        .map((ip) => ip.name);

      warnings.push({
        existingProject: proj,
        ipNames: matchedIpNames,
        reason: `「${matchedIpNames.join('・')}」について、競合範囲（"${proj.exclusion_scope}"）および期間（${proj.exclusion_start_date} ～ ${proj.exclusion_end_date}）が既存案件（${proj.client_name}様）と重複・競合している可能性があります。`,
      });
    }
  }

  return warnings;
}

/**
 * 競合範囲文字列の類似・重複チェック
 */
function isScopeSimilar(scope1: string, scope2: string): boolean {
  if (scope1 === scope2) return true;

  // 完全・部分一致
  if (scope1.includes(scope2) || scope2.includes(scope1)) return true;

  // 一般的な関連語マッピング（拡張可能なカテゴリのシミュレーション）
  const synonymsMap: Record<string, string[]> = {
    ビール: ['アルコール', 'お酒', '飲料', '酒類'],
    アルコール: ['ビール', 'チューハイ', 'サワー', 'お酒', 'ウイスキー', 'ワイン'],
    お酒: ['ビール', 'アルコール', 'サワー', '酒類'],
    携帯: ['通信', 'キャリア', 'スマホ', 'モバイル', 'telecom'],
    通信: ['携帯', 'キャリア', 'スマホ', 'モバイル'],
    自動車: ['車', 'モビリティ', 'オートバイ', 'カー'],
    車: ['自動車', 'モビリティ', 'カー'],
    コンビニ: ['CVS', '小売', 'スーパー'],
    ゲーム: ['アプリ', 'エンタメ', 'ソシャゲ'],
  };

  const words1 = scope1.split(/[\s,／/・]+/);
  const words2 = scope2.split(/[\s,／/・]+/);

  for (const w1 of words1) {
    if (!w1) continue;
    for (const w2 of words2) {
      if (!w2) continue;

      if (w1 === w2 || w1.includes(w2) || w2.includes(w1)) return true;

      // 類義語チェック
      const syns1 = synonymsMap[w1] || [];
      if (syns1.some((syn) => w2.includes(syn))) return true;

      const syns2 = synonymsMap[w2] || [];
      if (syns2.some((syn) => w1.includes(syn))) return true;
    }
  }

  return false;
}
