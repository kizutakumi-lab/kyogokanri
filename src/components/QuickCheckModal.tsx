'use client';

import React, { useState, useMemo } from 'react';
import { IP, Project } from '@/types';
import { getExclusionState, getDaysUntilExpiration } from '@/lib/exclusion-status';
import { ExclusionBadge } from './ExclusionBadge';
import { Zap, X, ShieldAlert, CheckCircle2, AlertTriangle, Search, Building2, Calendar } from 'lucide-react';

interface QuickCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  ips: IP[];
  projects: Project[];
}

export const QuickCheckModal: React.FC<QuickCheckModalProps> = ({
  isOpen,
  onClose,
  ips,
  projects,
}) => {
  const [selectedIpId, setSelectedIpId] = useState<string>(ips[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const selectedIp = useMemo(() => ips.find((i) => i.id === selectedIpId), [ips, selectedIpId]);

  // 選択IPに関連する案件
  const ipProjects = useMemo(() => {
    if (!selectedIpId) return [];
    return projects.filter((p) => p.ip_ids.includes(selectedIpId));
  }, [projects, selectedIpId]);

  // 現在排除中・終了間近の案件
  const activeProjects = useMemo(() => {
    return ipProjects.filter((p) => {
      const state = getExclusionState(p);
      return state === '競合排除中' || state === '終了間近';
    });
  }, [ipProjects]);

  // 今後開始予定の案件
  const upcomingProjects = useMemo(() => {
    return ipProjects.filter((p) => getExclusionState(p) === '開始予定');
  }, [ipProjects]);

  // 検索フィルター
  const filteredActive = useMemo(() => {
    if (!searchQuery.trim()) return activeProjects;
    const q = searchQuery.toLowerCase();
    return activeProjects.filter(
      (p) =>
        p.exclusion_scope.toLowerCase().includes(q) ||
        p.client_name.toLowerCase().includes(q) ||
        p.agency_name.toLowerCase().includes(q)
    );
  }, [activeProjects, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
              <Zap className="w-6 h-6 text-yellow-200 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">30秒 競合確認スピード検索</h2>
                <span className="bg-white/20 text-white text-[11px] px-2 py-0.5 rounded-full font-semibold">
                  営業最適化
                </span>
              </div>
              <p className="text-xs text-orange-100 mt-0.5">
                キャラクターIPを選択するだけで、現在提案不可の業種・クライアント・終了日が即座に分かります。
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 bg-slate-50/50">
          {/* IP Select & Fast Search */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              対象キャラクターIPを選択
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={selectedIpId}
                onChange={(e) => setSelectedIpId(e.target.value)}
                className="w-full font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                {ips.map((ip) => (
                  <option key={ip.id} value={ip.id}>
                    {ip.name}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="業種・競合範囲・クライアントで絞り込み..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Conflict Summary Banner */}
          {selectedIp && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-semibold">選択中のIP</span>
                  <h3 className="text-lg font-black text-amber-400">{selectedIp.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">現在競合排除中</span>
                  <div className="text-2xl font-black text-rose-400">{activeProjects.length}件</div>
                </div>
              </div>

              {/* Status List */}
              <div className="p-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  現在提案できない業種・競合カテゴリー ({filteredActive.length}件)
                </h4>

                {filteredActive.length === 0 ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-sm">現在、競合排除の制限はありません</div>
                      <div className="text-xs text-emerald-700 mt-0.5">
                        全業種・カテゴリにおいて新規のクライアント提案が可能です。
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredActive.map((proj) => {
                      const days = getDaysUntilExpiration(proj.exclusion_end_date);
                      return (
                        <div
                          key={proj.id}
                          className="bg-white p-3.5 rounded-lg border-l-4 border-l-rose-500 border-t border-r border-b border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <span className="inline-block bg-rose-100 text-rose-800 font-black text-sm px-2.5 py-0.5 rounded border border-rose-200 mb-1">
                                {proj.exclusion_scope}
                              </span>
                              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mt-1">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>{proj.client_name}</span>
                                {proj.agency_name && (
                                  <span className="text-slate-400">({proj.agency_name})</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <ExclusionBadge project={proj} showDays />
                              <div className="text-[11px] text-slate-500 flex items-center justify-end gap-1 mt-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>〜 {proj.exclusion_end_date} まで</span>
                              </div>
                            </div>
                          </div>

                          {proj.notes && (
                            <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded mt-2.5 border border-slate-100">
                              <span className="font-semibold text-slate-600">備考:</span> {proj.notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Upcoming Exclusion Alert */}
                {upcomingProjects.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-200">
                    <h5 className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-sky-600" />
                      今後開始予定の競合排除 ({upcomingProjects.length}件)
                    </h5>
                    <div className="space-y-2">
                      {upcomingProjects.map((u) => (
                        <div key={u.id} className="bg-sky-50/60 p-2.5 rounded-lg border border-sky-100 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-sky-900">{u.exclusion_scope}</span>
                            <span className="text-sky-700 ml-2">({u.client_name})</span>
                          </div>
                          <div className="text-sky-800 font-mono">
                            {u.exclusion_start_date} 〜 {u.exclusion_end_date}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-bold transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
