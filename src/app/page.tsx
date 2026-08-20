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
  CheckCircle2,
  Filter,
  ArrowUpDown,
  Search,
  Building2,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  PlusCircle,
  Table as TableIcon,
  XCircle,
  Edit,
  LayoutGrid,
  FileSpreadsheet,
} from 'lucide-react';

type SortField = 'end_date_asc' | 'end_date_desc' | 'start_date_desc' | 'amount_desc' | 'amount_asc';

export default function DashboardPage() {
  const [ips, setIps] = useState<IP[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // View Mode: 'table' (スプレッドシート風・一元テーブル) | 'grid' (IP別カード表示)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Filters for Main Table
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

  // Data fetching
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

  // 現在排除中の全案件
  const currentlyExcludedProjects = useMemo(() => {
    return projects.filter((p) => {
      const state = getExclusionState(p);
      return state === '競合排除中' || state === '終了間近';
    });
  }, [projects]);

  // 終了間近の分類 (30日以内, 60日以内, 90日以内)
  const expiringGroups = useMemo(() => {
    const within30: Project[] = [];
    const within60: Project[] = [];
    const within90: Project[] = [];

    projects.forEach((p) => {
      const state = getExclusionState(p);
      if (state === '終了済み') return;

      const days = getDaysUntilExpiration(p.exclusion_end_date);
      if (days >= 0 && days <= 30) {
        within30.push(p);
      } else if (days > 30 && days <= 60) {
        within60.push(p);
      } else if (days > 60 && days <= 90) {
        within90.push(p);
      }
    });

    return { within30, within60, within90 };
  }, [projects]);

  // フィルター・ソート済み案件リスト
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
      {/* Navigation */}
      <Navbar
        ips={ips}
        projects={projects}
        onOpenNewProject={() => {
          setEditingProject(null);
          setIsFormOpen(true);
        }}
      />

      {/* Ultra-compact Hero Header (高密度・省スペース化) */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-b border-slate-800 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              競合排除 統合ダッシュボード
            </h1>
            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 hidden sm:inline-block">
              全{projects.length}件登録
            </span>
          </div>

          {/* Right Area: Metrics + New Project Button + 【View Mode Switcher (移設箇所)】 */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto justify-between md:justify-end">
            {/* Quick Metrics */}
            <div className="flex items-center gap-2">
              <div className="bg-rose-950/40 border border-rose-800/60 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span className="text-[11px] text-rose-300 font-bold">排除中</span>
                <span className="font-mono font-black text-white">{currentlyExcludedProjects.length}件</span>
              </div>

              <div className="bg-amber-950/40 border border-amber-800/60 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] text-amber-300 font-bold">30日以内終了</span>
                <span className="font-mono font-black text-white">{expiringGroups.within30.length}件</span>
              </div>
            </div>

            {/* New Project Button */}
            <button
              onClick={() => {
                setEditingProject(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow transition-all shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              新規登録
            </button>

            {/* 【移設完了】ビュー切替ボタン（赤丸部分を右上に移動） */}
            <div className="flex items-center gap-0.5 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  viewMode === 'table'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="スプレッドシート風 (詳細一元一覧)"
              >
                <TableIcon className="w-3.5 h-3.5" />
                スプレッドシート風
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="IP別カードビュー"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                IP別カード
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 space-y-3">

        {/* Compact Alert Bar (30日以内終了の要対応アプローチ案件がある時のみ主張) */}
        {expiringGroups.within30.length > 0 && (
          <div className="bg-gradient-to-r from-rose-950/80 via-amber-950/60 to-slate-900 border border-rose-500/60 rounded-xl p-2.5 shadow-md flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-rose-600 text-white font-black text-[10px] rounded shadow animate-pulse">
                🔥 30日以内 契約終了 ({expiringGroups.within30.length}件)
              </span>
              <span className="text-rose-200 text-[11px] font-medium hidden sm:inline">
                更新アプローチ・他社解禁タイミング
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto py-0.5">
              {expiringGroups.within30.map((proj) => (
                <button
                  key={proj.id}
                  onClick={() => setSelectedProject(proj)}
                  className="bg-slate-900/90 hover:bg-slate-800 border border-rose-500/40 px-2.5 py-1 rounded-md text-[11px] font-bold text-amber-300 whitespace-nowrap"
                >
                  {proj.exclusion_scope} ({proj.client_name}) - 残り{getDaysUntilExpiration(proj.exclusion_end_date)}日
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filter Toolbar (省スペース・高密度化) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
            <div className="flex items-center gap-2 text-xs font-black text-amber-400">
              <Filter className="w-3.5 h-3.5" />
              <span>高速検索 & 絞り込み</span>
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
                className="text-[11px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
              >
                <XCircle className="w-3 h-3" />
                クリア
              </button>
            )}
          </div>

          {/* Search Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="競合商材/範囲で検索 (赤背景部)..."
                value={scopeSearch}
                onChange={(e) => setScopeSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none font-bold"
              />
            </div>

            <div className="relative">
              <Building2 className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="顧客 (クライアント名) で検索..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <input
              type="text"
              placeholder="代理店名で検索..."
              value={agencySearch}
              onChange={(e) => setAgencySearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Filter Pills & Sort (1行にコンパクトまとめ) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-xs">
            {/* IP Pills */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400">IP:</span>
              <button
                onClick={() => setSelectedIpIds([])}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  selectedIpIds.length === 0
                    ? 'bg-amber-500 text-slate-950 shadow'
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
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {ip.name}
                  </button>
                );
              })}
            </div>

            {/* Sort Dropdown */}
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

        {/* VIEW MODE 1: Spreadsheet Table (ファーストビューで広々と見える高密度テーブル) */}
        {viewMode === 'table' ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="overflow-x-auto max-h-[68vh] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                {/* Header (固定) */}
                <thead className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800 uppercase text-[11px] tracking-wider sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-2.5 bg-slate-950 min-w-[110px]">使用IP</th>
                    <th className="p-2.5 bg-slate-950 min-w-[130px]">顧客 (クライアント名)</th>
                    <th className="p-2.5 bg-rose-950/90 text-rose-200 border-x border-rose-900/60 min-w-[140px]">
                      競合商材 (競合範囲)
                    </th>
                    <th className="p-2.5 bg-slate-950 min-w-[120px]">代理店名</th>
                    <th className="p-2.5 bg-slate-950 min-w-[170px]">施策内容 (対象商品/施策名)</th>
                    <th className="p-2.5 bg-slate-950 min-w-[160px]">競合排除期間 (開始〜終了)</th>
                    <th className="p-2.5 bg-slate-950 min-w-[120px]">競合状態 (自動判定)</th>
                    <th className="p-2.5 bg-slate-950 min-w-[90px]">ステータス</th>
                    <th className="p-2.5 bg-slate-950 min-w-[100px] text-right">金額</th>
                    <th className="p-2.5 bg-slate-950 min-w-[150px]">備考</th>
                    <th className="p-2.5 bg-slate-950 min-w-[50px] text-center">操作</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/80 font-medium">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-10 text-center text-slate-500 text-xs">
                        該当する案件が見つかりませんでした。
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
                          className="hover:bg-slate-800/80 transition-colors cursor-pointer group text-[11px]"
                        >
                          {/* 使用IP */}
                          <td className="p-2.5">
                            <div className="flex flex-wrap gap-1">
                              {matchedIpNames.map((name) => (
                                <span
                                  key={name}
                                  className="bg-amber-400/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-black text-[10px]"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* 顧客 (クライアント名) */}
                          <td className="p-2.5 font-bold text-white whitespace-nowrap">{proj.client_name}</td>

                          {/* 競合商材 / 競合範囲 (赤ハイライト) */}
                          <td className="p-2.5 bg-rose-950/30 border-x border-rose-900/40">
                            <span className="font-black text-white bg-rose-600 border border-rose-400 px-2 py-0.5 rounded shadow-sm inline-block text-xs">
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

                          {/* 競合状態 (自動判定バッジ) */}
                          <td className="p-2.5">
                            <ExclusionBadge project={proj} showDays />
                          </td>

                          {/* 案件ステータス */}
                          <td className="p-2.5 whitespace-nowrap">
                            <span className="bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded font-bold text-[10px]">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ips.map((ip) => {
              const ipProjs = filteredProjects.filter((p) => p.ip_ids.includes(ip.id));
              const activeProjs = ipProjs.filter((p) => {
                const s = getExclusionState(p);
                return s === '競合排除中' || s === '終了間近';
              });

              return (
                <div
                  key={ip.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col justify-between hover:border-slate-700 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                      <Link href={`/ips/${ip.id}`} className="group-hover:text-amber-400 transition-colors">
                        <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-1">
                          {ip.name}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
                        </h3>
                      </Link>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          activeProjs.length > 0
                            ? 'bg-rose-950 text-rose-400 border-rose-800'
                            : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        }`}
                      >
                        排除中: {activeProjs.length}件
                      </span>
                    </div>

                    {ipProjs.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-500 bg-slate-950/40 rounded-lg">
                        該当案件なし
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {ipProjs.slice(0, 4).map((proj) => (
                          <div
                            key={proj.id}
                            onClick={() => setSelectedProject(proj)}
                            className="bg-slate-950/60 hover:bg-slate-800 p-2 rounded-lg border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-black text-rose-400 truncate max-w-[150px]">
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

                  <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">案件数: {ipProjs.length}件</span>
                    <Link
                      href={`/ips/${ip.id}`}
                      className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
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
