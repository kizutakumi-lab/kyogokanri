'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DataService } from '@/lib/storage';
import { IP, Project, ProjectStatus, ExclusionState } from '@/types';
import { getExclusionState, getDaysUntilExpiration, formatCurrency } from '@/lib/exclusion-status';
import { Navbar } from '@/components/Navbar';
import { ExclusionBadge } from '@/components/ExclusionBadge';
import { ProjectFormModal } from '@/components/ProjectFormModal';
import { ProjectDetailModal } from '@/components/ProjectDetailModal';
import {
  ShieldAlert,
  Clock,
  Filter,
  ArrowUpDown,
  Search,
  Building2,
  PlusCircle,
  Table as TableIcon,
  XCircle,
  Edit,
  LayoutGrid,
  ChevronRight,
} from 'lucide-react';

type SortField = 'end_date_asc' | 'end_date_desc' | 'start_date_desc' | 'amount_desc' | 'amount_asc';

export default function DashboardPage() {
  const [ips, setIps] = useState<IP[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View Mode: 'table' | 'grid'
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Filters
  const [selectedIpIds, setSelectedIpIds] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<ProjectStatus[]>([]);
  const [selectedExclusionStates, setSelectedExclusionStates] = useState<ExclusionState[]>([]);
  const [scopeSearch, setScopeSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [agencySearch, setAgencySearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('end_date_asc');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [fetchedIps, fetchedProjects] = await Promise.all([
        DataService.getIPs(),
        DataService.getProjects(),
      ]);
      setIps(fetchedIps.filter((i) => i.active));
      setProjects(fetchedProjects);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentlyExcludedProjects = useMemo(() => {
    return projects.filter((p) => {
      const state = getExclusionState(p);
      return state === '競合排除中' || state === '終了間近';
    });
  }, [projects]);

  const expiringGroups = useMemo(() => {
    const within30: Project[] = [];

    projects.forEach((p) => {
      const state = getExclusionState(p);
      if (state === '終了済み') return;

      const days = getDaysUntilExpiration(p.exclusion_end_date);
      if (days >= 0 && days <= 30) {
        within30.push(p);
      }
    });

    return { within30 };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        if (selectedIpIds.length > 0) {
          const hasMatchedIp = p.ip_ids.some((id) => selectedIpIds.includes(id));
          if (!hasMatchedIp) return false;
        }

        if (selectedStatuses.length > 0) {
          if (!selectedStatuses.includes(p.status)) return false;
        }

        if (selectedExclusionStates.length > 0) {
          const state = getExclusionState(p);
          if (!selectedExclusionStates.includes(state)) return false;
        }

        if (scopeSearch.trim()) {
          const q = scopeSearch.toLowerCase();
          if (!p.exclusion_scope.toLowerCase().includes(q)) return false;
        }

        if (clientSearch.trim()) {
          const q = clientSearch.toLowerCase();
          if (!p.client_name.toLowerCase().includes(q)) return false;
        }

        if (agencySearch.trim()) {
          const q = agencySearch.toLowerCase();
          if (!p.agency_name.toLowerCase().includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortField) {
          case 'end_date_asc':
            return a.exclusion_end_date.localeCompare(b.exclusion_end_date);
          case 'end_date_desc':
            return b.exclusion_end_date.localeCompare(a.exclusion_end_date);
          case 'start_date_desc':
            return b.exclusion_start_date.localeCompare(a.exclusion_start_date);
          case 'amount_desc':
            return b.amount - a.amount;
          case 'amount_asc':
            return a.amount - b.amount;
          default:
            return 0;
        }
      });
  }, [
    projects,
    selectedIpIds,
    selectedStatuses,
    selectedExclusionStates,
    scopeSearch,
    clientSearch,
    agencySearch,
    sortField,
  ]);

  const toggleIpFilter = (id: string) => {
    setSelectedIpIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleStatusFilter = (st: ProjectStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st]
    );
  };

  const toggleExclusionStateFilter = (es: ExclusionState) => {
    setSelectedExclusionStates((prev) =>
      prev.includes(es) ? prev.filter((s) => s !== es) : [...prev, es]
    );
  };

  const resetFilters = () => {
    setSelectedIpIds([]);
    setSelectedStatuses([]);
    setSelectedExclusionStates([]);
    setScopeSearch('');
    setClientSearch('');
    setAgencySearch('');
    setSortField('end_date_asc');
  };

  const handleSaveProject = async (projectData: any) => {
    await DataService.saveProject(projectData);
    await loadData();
  };

  const handleDuplicateProject = async (id: string) => {
    await DataService.duplicateProject(id);
    await loadData();
  };

  const handleDeleteProject = async (id: string) => {
    await DataService.deleteProject(id);
    await loadData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-8">
      <Navbar
        ips={ips}
        projects={projects}
        onOpenNewProject={() => {
          setEditingProject(null);
          setIsFormOpen(true);
        }}
      />

      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-white tracking-tight">
              競合排除 統合ダッシュボード
            </h1>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              全{projects.length}件登録
            </span>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto justify-between md:justify-end">
            <div className="flex items-center gap-2 text-xs">
              <div className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[11px] text-slate-300">排除中</span>
                <span className="font-mono font-bold text-white">{currentlyExcludedProjects.length}件</span>
              </div>

              <div className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] text-slate-300">30日以内終了</span>
                <span className="font-mono font-bold text-white">{expiringGroups.within30.length}件</span>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingProject(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-xs shadow transition-all shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              新規登録
            </button>

            {/* ビュー切替ボタン */}
            <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded border border-slate-800 shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  viewMode === 'table'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TableIcon className="w-3 h-3" />
                一覧
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                IP別
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 space-y-3">

        {/* 30日以内アラート（存在時のみ表示） */}
        {expiringGroups.within30.length > 0 && (
          <div className="bg-slate-900 border border-amber-800/60 rounded p-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-950 text-amber-300 font-bold text-[10px] rounded border border-amber-800">
                ⚠️ 30日以内 契約終了 ({expiringGroups.within30.length}件)
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto py-0.5">
              {expiringGroups.within30.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => setSelectedProject(proj)}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-0.5 rounded text-[11px] text-amber-300 whitespace-nowrap"
                >
                  {proj.exclusion_scope} ({proj.client_name}) - 残り{getDaysUntilExpiration(proj.exclusion_end_date)}日
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="bg-slate-900 border border-slate-800 rounded p-2.5 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-300">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>絞り込み・検索</span>
              <span className="text-[11px] font-normal text-slate-400">
                (該当: <strong className="text-white">{filteredProjects.length}</strong> / 全{projects.length}件)
              </span>
            </div>
            {(selectedIpIds.length > 0 ||
              selectedStatuses.length > 0 ||
              selectedExclusionStates.length > 0 ||
              scopeSearch ||
              clientSearch ||
              agencySearch) && (
              <button
                onClick={resetFilters}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
              >
                <XCircle className="w-3 h-3" />
                解除
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="競合商材/範囲で検索..."
                value={scopeSearch}
                onChange={(e) => setScopeSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-2.5 py-1 text-xs text-white focus:border-amber-500 focus:outline-none font-semibold"
              />
            </div>

            <div className="relative">
              <Building2 className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="顧客 (クライアント名)..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-2.5 py-1 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <input
              type="text"
              placeholder="代理店名..."
              value={agencySearch}
              onChange={(e) => setAgencySearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-xs">
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400">IP:</span>
              <button
                onClick={() => setSelectedIpIds([])}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  selectedIpIds.length === 0
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                全IP
              </button>
              {ips.map((ip) => {
                const isSelected = selectedIpIds.includes(ip.id);
                return (
                  <button
                    key={ip.id}
                    onClick={() => toggleIpFilter(ip.id)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {ip.name}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                <ArrowUpDown className="w-3 h-3 text-amber-400" />
                ソート:
              </span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="bg-slate-950 border border-slate-800 text-[11px] font-bold text-white rounded px-2 py-0.5 focus:border-amber-500 focus:outline-none"
              >
                <option value="end_date_asc">終了日が近い順</option>
                <option value="end_date_desc">終了日が遠い順</option>
                <option value="start_date_desc">開始日順</option>
                <option value="amount_desc">金額が高い順</option>
                <option value="amount_asc">金額が安い順</option>
              </select>
            </div>
          </div>
        </div>

        {/* VIEW MODE 1: Table (シンプル四角枠に統一) */}
        {viewMode === 'table' ? (
          <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800 text-[11px] tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5 min-w-[110px]">使用IP</th>
                    <th className="p-2.5 min-w-[130px]">顧客 (クライアント名)</th>
                    {/* 【変更点】派手な赤背景を廃止し、他と統一したシンプルヘッダーへ */}
                    <th className="p-2.5 min-w-[140px]">競合商材 (競合範囲)</th>
                    <th className="p-2.5 min-w-[120px]">代理店名</th>
                    <th className="p-2.5 min-w-[170px]">施策内容 (対象商品/施策名)</th>
                    <th className="p-2.5 min-w-[160px]">競合排除期間 (開始〜終了)</th>
                    <th className="p-2.5 min-w-[120px]">競合状態 (自動判定)</th>
                    <th className="p-2.5 min-w-[90px]">ステータス</th>
                    <th className="p-2.5 min-w-[100px] text-right">金額</th>
                    <th className="p-2.5 min-w-[150px]">備考</th>
                    <th className="p-2.5 min-w-[50px] text-center">操作</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/80 font-medium">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-10 text-center text-slate-500 text-xs">
                        該当する案件がありません。
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((proj) => {
                      const matchedIpNames = ips
                        .filter((ip) => proj.ip_ids.includes(ip.id))
                        .map((ip) => ip.name);

                      return (
                        <tr
                          key={proj.id}
                          onClick={() => setSelectedProject(proj)}
                          className="hover:bg-slate-800/80 transition-colors cursor-pointer text-[11px]"
                        >
                          {/* 使用IP */}
                          <td className="p-2.5">
                            <div className="flex flex-wrap gap-1">
                              {matchedIpNames.map((name) => (
                                <span
                                  key={name}
                                  className="bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded font-semibold text-[10px]"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* 顧客 (クライアント名) */}
                          <td className="p-2.5 font-bold text-white whitespace-nowrap">{proj.client_name}</td>

                          {/* 【変更点】赤枠を廃止し、右と同じシンプルな四角枠スタイルへ変更 */}
                          <td className="p-2.5">
                            <span className="font-semibold text-slate-200 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded inline-block text-xs">
                              {proj.exclusion_scope}
                            </span>
                          </td>

                          {/* 代理店名 */}
                          <td className="p-2.5 text-slate-300 whitespace-nowrap">{proj.agency_name || '-'}</td>

                          {/* 施策内容 */}
                          <td className="p-2.5 text-slate-200 max-w-[180px] truncate" title={proj.campaign_name}>
                            {proj.campaign_name}
                          </td>

                          {/* 競合排除期間 */}
                          <td className="p-2.5 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                            <span className="font-semibold text-slate-200">{proj.exclusion_start_date}</span>
                            <span className="text-slate-400 ml-1">〜 {proj.exclusion_end_date}</span>
                          </td>

                          {/* 競合状態 (自動判定 - 丸枠からシンプルな四角枠へ) */}
                          <td className="p-2.5">
                            <ExclusionBadge project={proj} showDays />
                          </td>

                          {/* 案件ステータス (右の四角枠) */}
                          <td className="p-2.5 whitespace-nowrap">
                            <span className="bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded font-semibold text-[10px]">
                              {proj.status}
                            </span>
                          </td>

                          {/* 金額 */}
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                            {formatCurrency(proj.amount)}
                          </td>

                          {/* 備考 */}
                          <td className="p-2.5 text-slate-400 max-w-[150px] truncate text-[10px]" title={proj.notes}>
                            {proj.notes || '-'}
                          </td>

                          {/* 編集操作 */}
                          <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setEditingProject(proj);
                                setIsFormOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                              title="編集"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* VIEW MODE 2: IP別カード表示 */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ips.map((ip) => {
              const ipProjs = filteredProjects.filter((p) => p.ip_ids.includes(ip.id));
              const activeProjs = ipProjs.filter((p) => {
                const s = getExclusionState(p);
                return s === '競合排除中' || s === '終了間近';
              });

              return (
                <div
                  key={ip.id}
                  className="bg-slate-900 border border-slate-800 rounded p-3 shadow flex flex-col justify-between hover:border-slate-700 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                      <Link href={`/ips/${ip.id}`} className="group-hover:text-amber-400 transition-colors">
                        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1">
                          {ip.name}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        </h3>
                      </Link>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-800 text-slate-300 border-slate-700">
                        排除中: {activeProjs.length}件
                      </span>
                    </div>

                    {ipProjs.length === 0 ? (
                      <div className="py-3 text-center text-xs text-slate-500 bg-slate-950/40 rounded">
                        該当案件なし
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {ipProjs.slice(0, 4).map((proj) => (
                          <div
                            key={proj.id}
                            onClick={() => setSelectedProject(proj)}
                            className="bg-slate-950/60 hover:bg-slate-800 p-2 rounded border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-200 truncate max-w-[150px]">
                                • {proj.exclusion_scope}
                              </span>
                              <ExclusionBadge project={proj} showDays />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                              <span className="truncate">{proj.client_name}</span>
                              <span className="font-mono text-slate-500">{proj.exclusion_end_date}まで</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">案件数: {ipProjs.length}件</span>
                    <Link
                      href={`/ips/${ip.id}`}
                      className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      専用ページ <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modals */}
      <ProjectFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        project={editingProject}
        ips={ips}
        allProjects={projects}
      />

      <ProjectDetailModal
        isOpen={Boolean(selectedProject)}
        onClose={() => setSelectedProject(null)}
        project={selectedProject}
        ips={ips}
        onEdit={(proj) => {
          setEditingProject(proj);
          setIsFormOpen(true);
        }}
        onDuplicate={handleDuplicateProject}
        onDelete={handleDeleteProject}
      />
    </div>
  );
}
