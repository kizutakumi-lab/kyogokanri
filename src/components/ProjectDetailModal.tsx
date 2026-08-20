'use client';

import React, { useState } from 'react';
import { Project, IP } from '@/types';
import { ExclusionBadge } from './ExclusionBadge';
import { formatCurrency, getDaysUntilExpiration } from '@/lib/exclusion-status';
import {
  X,
  Edit,
  Copy,
  Trash2,
  Building2,
  Briefcase,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  ips: IP[];
  onEdit: (project: Project) => void;
  onDuplicate: (projectId: string) => Promise<void>;
  onDelete: (projectId: string) => Promise<void>;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  isOpen,
  onClose,
  project,
  ips,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  if (!isOpen || !project) return null;

  const matchedIps = ips.filter((ip) => project.ip_ids.includes(ip.id));
  const daysLeft = getDaysUntilExpiration(project.exclusion_end_date);

  const handleDuplicate = async () => {
    try {
      setIsActionLoading(true);
      await onDuplicate(project.id);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsActionLoading(true);
      await onDelete(project.id);
      setIsConfirmingDelete(false);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-fadeIn my-8">
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-start justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {matchedIps.map((ip) => (
                <span
                  key={ip.id}
                  className="bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded shadow-sm"
                >
                  {ip.name}
                </span>
              ))}
              <ExclusionBadge project={project} showDays />
            </div>
            <h2 className="text-xl font-black text-white">{project.campaign_name}</h2>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>{project.client_name}</span>
              {project.agency_name && <span>/ 代理店: {project.agency_name}</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Delete Confirmation Alert */}
        {isConfirmingDelete ? (
          <div className="bg-rose-50 border-b border-rose-200 p-5 text-rose-900 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
              この案件を削除してもよろしいですか？ (論理削除)
            </div>
            <p className="text-xs text-rose-700">
              削除された案件は競合チェック対象外となります。いつでも管理者から参照・操作ログの確認が可能です。
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsConfirmingDelete(false)}
                className="px-3 py-1.5 bg-white border border-rose-300 text-rose-800 text-xs font-bold rounded-md hover:bg-rose-100"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={isActionLoading}
                className="px-4 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-md hover:bg-rose-700 shadow"
              >
                {isActionLoading ? '削除処理中...' : '本当に削除する'}
              </button>
            </div>
          </div>
        ) : null}

        {/* Details Grid */}
        <div className="p-6 space-y-5 bg-slate-50/50 text-sm">
          {/* 競合範囲 Highlight Box */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              競合範囲
            </div>
            <div className="text-base font-black text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
              {project.exclusion_scope}
            </div>
          </div>

          {/* Dates & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                競合排除期間
              </div>
              <div className="font-bold text-slate-800 font-mono text-sm">
                {project.exclusion_start_date} ～ {project.exclusion_end_date}
              </div>
              <div className="text-xs text-slate-500 pt-1">
                {daysLeft > 0 ? (
                  <span>終了まであと <strong className="text-slate-900 font-black">{daysLeft}</strong> 日</span>
                ) : (
                  <span className="text-slate-400">期間終了済み</span>
                )}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                案件ステータス & 金額
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                  {project.status}
                </span>
                <span className="font-black text-emerald-700 text-base">
                  {formatCurrency(project.amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              備考・特記事項
            </div>
            <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
              {project.notes || '備考はありません'}
            </div>
          </div>

          {/* System metadata */}
          <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-200 pt-3">
            <span>登録日: {new Date(project.created_at).toLocaleString('ja-JP')}</span>
            <span>最終更新: {new Date(project.updated_at).toLocaleString('ja-JP')}</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => setIsConfirmingDelete(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-slate-300 rounded-lg text-xs font-bold transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            削除
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDuplicate}
              disabled={isActionLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-colors"
            >
              <Copy className="w-4 h-4" />
              複製
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(project);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow transition-colors"
            >
              <Edit className="w-4 h-4 text-amber-400" />
              編集する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
