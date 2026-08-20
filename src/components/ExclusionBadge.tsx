import React from 'react';
import { getExclusionState, getDaysUntilExpiration } from '@/lib/exclusion-status';
import { Project } from '@/types';
import { ShieldAlert, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

interface ExclusionBadgeProps {
  project: Pick<Project, 'exclusion_start_date' | 'exclusion_end_date' | 'status'>;
  showDays?: boolean;
}

export const ExclusionBadge: React.FC<ExclusionBadgeProps> = ({ project, showDays = false }) => {
  const state = getExclusionState(project);
  const daysLeft = getDaysUntilExpiration(project.exclusion_end_date);

  switch (state) {
    case '競合排除中':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
          競合排除中
          {showDays && daysLeft > 0 && <span className="text-[10px] text-rose-500 font-normal">({daysLeft}日残)</span>}
        </span>
      );
    case '終了間近':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          終了間近
          <span className="text-xs text-amber-900 bg-amber-200 px-1.5 py-0.5 rounded font-extrabold ml-0.5">
            あと{daysLeft}日
          </span>
        </span>
      );
    case '開始予定':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-700 border border-sky-200">
          <Clock className="w-3.5 h-3.5 text-sky-500" />
          開始予定
        </span>
      );
    case '終了済み':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
          <CheckCircle2 className="w-3 h-3 text-slate-400" />
          終了済み
        </span>
      );
  }
};
