import { ExclusionState, Project } from '@/types';
import { differenceInDays, isAfter, isBefore, parseISO, startOfDay } from 'date-fns';

/**
 * 案件の日付とステータスから競合排除状態を自動判定
 */
export function getExclusionState(
  project: Pick<Project, 'exclusion_start_date' | 'exclusion_end_date' | 'status'>,
  referenceDate: Date = new Date()
): ExclusionState {
  if (project.status === '契約終了') {
    return '終了済み';
  }

  const today = startOfDay(referenceDate);
  const startDate = startOfDay(parseISO(project.exclusion_start_date));
  const endDate = startOfDay(parseISO(project.exclusion_end_date));

  if (isBefore(today, startDate)) {
    return '開始予定';
  }

  if (isAfter(today, endDate)) {
    return '終了済み';
  }

  // today is between startDate and endDate
  const daysLeft = differenceInDays(endDate, today);
  if (daysLeft <= 30) {
    return '終了間近';
  }

  return '競合排除中';
}

/**
 * 残り日数計算
 */
export function getDaysUntilExpiration(
  endDateStr: string,
  referenceDate: Date = new Date()
): number {
  const today = startOfDay(referenceDate);
  const endDate = startOfDay(parseISO(endDateStr));
  return differenceInDays(endDate, today);
}

/**
 * 金額フォーマット (3桁カンマ + 円)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(amount);
}
