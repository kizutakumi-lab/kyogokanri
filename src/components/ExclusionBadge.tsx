import React from 'react';
import { getExclusionState, getDaysUntilExpiration } from '@/lib/exclusion-status';
import { Project } from '@/types';

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
        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/80">
          競合排除中
          {showDays && daysLeft > 0 && <span className="text-[10px] text-rose-400 ml-1">({daysLeft}日残)</span>}
        </span>
      );
    case '終了間近':
      return (
        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/80">
          終了間近
          {showDays && <span className="text-[10px] text-amber-400 ml-1">({daysLeft}日残)</span>}
        </span>
      );
    case '開始予定':
      return (
        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-sky-950/60 text-sky-300 border border-sky-800/80">
          開始予定
        </span>
      );
    case '終了済み':
    default:
      return (
        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
          終了済み
        </span>
      );
  }
};
