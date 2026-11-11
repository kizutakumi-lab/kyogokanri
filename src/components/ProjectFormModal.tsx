'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { IP, Project, ProjectStatus } from '@/types';
import { checkProjectOverlap } from '@/lib/overlap-check';
import { formatCurrency } from '@/lib/exclusion-status';
import { X, AlertTriangle, CheckCircle, Layers, Calendar, DollarSign, Building, Tag } from 'lucide-react';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'> & { id?: string }) => Promise<void>;
  project?: Project | null;
  ips: IP[];
  allProjects: Project[];
}

const INITIAL_FORM = {
  ip_ids: [] as string[],
  client_name: '',
  agency_name: '',
  campaign_name: '',
  exclusion_scope: '',
  exclusion_start_date: new Date().toISOString().split('T')[0],
  exclusion_end_date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
  status: '提案中' as ProjectStatus,
  amount: 0,
  notes: '',
};

const SCOPE_PRESETS = [
  'ビール',
  'アルコール飲料全般',
  '清涼飲料水',
  'コンビニエンスストア',
  '携帯通信キャリア',
  '自動車メーカー',
  'ゲーム・アプリ',
  'ファストフード',
  '化粧品・スキンケア',
];

const STATUS_OPTIONS: ProjectStatus[] = [
  '提案前',
  '提案中',
  '受注／制作中',
  '公開中',
  '契約終了',
];

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  project,
  ips,
  allProjects,
}) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [rawAmountInput, setRawAmountInput] = useState('0');

  const isEditing = Boolean(project?.id);

  useEffect(() => {
    if (project) {
      setFormData({
        ip_ids: project.ip_ids || [],
        client_name: project.client_name,
        agency_name: project.agency_name || '',
        campaign_name: project.campaign_name,
        exclusion_scope: project.exclusion_scope,
        exclusion_start_date: project.exclusion_start_date,
        exclusion_end_date: project.exclusion_end_date,
        status: project.status,
        amount: Number(project.amount ?? 0),
        notes: project.notes || '',
      });
      setRawAmountInput((project.amount ?? 0).toString());
    } else {
      setFormData({
        ...INITIAL_FORM,
        ip_ids: ips.length > 0 ? [ips[0].id] : [],
      });
      setRawAmountInput('0');
    }
  }, [project, ips, isOpen]);

  // 重複リアルタイムチェック
  const overlapWarnings = useMemo(() => {
    return checkProjectOverlap(
      {
        id: project?.id,
        ip_ids: formData.ip_ids,
        exclusion_scope: formData.exclusion_scope,
        exclusion_start_date: formData.exclusion_start_date,
        exclusion_end_date: formData.exclusion_end_date,
      },
      allProjects,
      ips
    );
  }, [formData.ip_ids, formData.exclusion_scope, formData.exclusion_start_date, formData.exclusion_end_date, project, allProjects, ips]);

  const toggleIpSelect = (ipId: string) => {
    setFormData((prev) => {
      const exists = prev.ip_ids.includes(ipId);
      if (exists) {
        if (prev.ip_ids.length === 1) return prev;
        return { ...prev, ip_ids: prev.ip_ids.filter((id) => id !== ipId) };
      } else {
        return { ...prev, ip_ids: [...prev.ip_ids, ipId] };
      }
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setRawAmountInput(val);
    setFormData((prev) => ({ ...prev, amount: Number(val) || 0 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ip_ids.length) {
      alert('使用IPを少なくとも1つ選択してください。');
      return;
    }
    if (!formData.client_name.trim() || !formData.campaign_name.trim() || !formData.exclusion_scope.trim()) {
      alert('クライアント名、対象商品/施策名、競合範囲は必須項目です。');
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        ...(project?.id ? { id: project.id } : {}),
        ...formData,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('案件の保存に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-3xl overflow-hidden my-6 text-slate-900 animate-fadeIn">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              {isEditing ? '案件情報の編集' : '新規案件の登録'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              競合排除情報・期間・ステータスを正確に入力してください。
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overlap Warning Alert */}
        {overlapWarnings.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-300 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">
                  ⚠️ 既存の競合排除案件との重複・重複可能性を検知しました ({overlapWarnings.length}件)
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  競合範囲および競合排除期間が既存案件と重複している可能性があります。確認の上ご登録ください。（※登録自体は可能です）
                </p>
                <div className="mt-2 space-y-1 max-h-28 overflow-y-auto pr-1">
                  {overlapWarnings.map((w, idx) => (
                    <div key={idx} className="bg-white p-2 rounded border border-amber-300 text-xs text-amber-950 font-bold">
                      {w.reason}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Body (黒文字・高視認性スタイルを徹底適用) */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto bg-slate-50">
          {/* 使用IP (複数選択) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>使用IP <span className="text-rose-600 font-extrabold">*</span> <span className="text-slate-500 font-semibold">(複数選択可)</span></span>
              <span className="text-xs text-amber-700 font-black">選択中: {formData.ip_ids.length}件</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ips.map((ip) => {
                const isSelected = formData.ip_ids.includes(ip.id);
                return (
                  <button
                    key={ip.id}
                    type="button"
                    onClick={() => toggleIpSelect(ip.id)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-black text-left transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow'
                        : 'bg-white text-slate-900 border-slate-300 hover:bg-slate-100 shadow-sm'
                    }`}
                  >
                    <span>{ip.name}</span>
                    {isSelected && <CheckCircle className="w-4 h-4 text-slate-950" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* クライアント名 & 代理店名 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1">
                クライアント名 (顧客) <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="例: サッポロビール株式会社"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-400 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1">代理店名</label>
              <input
                type="text"
                placeholder="例: 株式会社電通"
                value={formData.agency_name}
                onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-400 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none shadow-sm"
              />
            </div>
          </div>

          {/* 対象商品 / 施策名 */}
          <div>
            <label className="block text-xs font-extrabold text-slate-900 mb-1">
              対象商品／施策名 <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例: 鷹の爪×黒ラベル 夏のタイアップCM"
              value={formData.campaign_name}
              onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-400 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none shadow-sm"
            />
          </div>

          {/* 競合範囲 */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-900">
              競合範囲 (競合商材) <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="例: ビール・発泡酒 / コンビニ / 携帯キャリア"
                value={formData.exclusion_scope}
                onChange={(e) => setFormData({ ...formData, exclusion_scope: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-400 rounded-lg text-sm font-black text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none shadow-sm"
              />
            </div>
            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              <span className="text-[11px] text-slate-600 font-bold">よく使われるプリセット:</span>
              {SCOPE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      exclusion_scope: prev.exclusion_scope ? `${prev.exclusion_scope} / ${preset}` : preset,
                    }))
                  }
                  className="px-2 py-0.5 bg-white hover:bg-amber-100 text-slate-800 hover:text-amber-900 border border-slate-300 rounded text-[11px] font-bold shadow-sm transition-colors"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* 競合排除期間 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-3.5 rounded-xl border border-slate-300 shadow-sm">
            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                競合排除 開始日 <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.exclusion_start_date}
                onChange={(e) => setFormData({ ...formData, exclusion_start_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-400 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                競合排除 終了日 <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.exclusion_end_date}
                onChange={(e) => setFormData({ ...formData, exclusion_end_date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-400 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* ステータス & 金額 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1">案件ステータス</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                className="w-full px-3 py-2 bg-white border border-slate-400 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-sm"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1">金額 (円・税抜)</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={rawAmountInput}
                  onChange={handleAmountChange}
                  className="w-full pl-9 pr-10 py-2 bg-white border border-slate-400 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-sm"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-600 font-extrabold">円</span>
              </div>
              <div className="text-[11px] text-slate-700 font-bold font-mono mt-1 text-right">
                プレビュー: {formatCurrency(formData.amount)}
              </div>
            </div>
          </div>

          {/* 備考 */}
          <div>
            <label className="block text-xs font-extrabold text-slate-900 mb-1">備考 / 特記事項</label>
            <textarea
              rows={3}
              placeholder="契約特記事項、メディア範囲、オプション条件などを入力..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-400 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-sm"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-300 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-bold rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 text-sm font-black rounded-lg shadow-md transition-all disabled:opacity-50"
            >
              {isSaving ? '保存中...' : isEditing ? '更新を保存する' : '案件を新規登録する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
