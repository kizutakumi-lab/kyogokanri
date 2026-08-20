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
  Zap,
  Filter,
  ArrowUpDown,
  Search,
  Building2,
  Calendar,
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

  // フィルター・ソート済み案件リスト (トップページ一括テーブル用)
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        // IP filter
        if (selectedIpIds.length > 0) {
          const hasMatchedIp = p.ip_ids.some((id) => selectedIpIds.includes(id));
          if (!hasMatchedIp) return false;
        }

        // Status filter
        if (selectedStatuses.length > 0) {
          if (!selectedStatuses.includes(p.status)) return false;
        }

        // Exclusion state filter
        if (selectedExclusionStates.length > 0) {
          const state = getExclusionState(p);
          if (!selectedExclusionStates.includes(state)) return false;
        }

        // 競合範囲検索 (部分一致)
        if (scopeSearch.trim()) {
          const q = scopeSearch.toLowerCase();
          if (!p.exclusion_scope.toLowerCase().includes(q)) return false;
        }

        // クライアント名検索
        if (clientSearch.trim()) {
          const q = clientSearch.toLowerCase();
          if (!p.client_name.toLowerCase().includes(q)) return false;
        }

        // 代理店名検索
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

  // IPトグル
  const toggleIpFilter = (id: string) => {
    setSelectedIpIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // ステータストグル
  const toggleStatusFilter = (st: ProjectStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st]
    );
  };

  // ExclusionStateトグル
  const toggleExclusionStateFilter = (es: ExclusionState) => {
    setSelectedExclusionStates((prev) =>
      prev.includes(es) ? prev.filter((s) => s !== es) : [...prev, es]
    );
  };

  // フィルターリセット
  const resetFilters = () => {
    setSelectedIpIds([]);
    setSelectedStatuses([]);
    setSelectedExclusionStates([]);
    setScopeSearch('');
    setClientSearch('');
    setAgencySearch('');
    setSortField('end_date_asc');
  };

  // 案件保存
  const handleSaveProject = async (projectData: any) => {
    await DataService.saveProject(projectData);
    await loadData();
  };

  // 案件複製
  const handleDuplicateProject = async (id: string) => {
    await DataService.duplicateProject(id);
    await loadData();
  };

  // 案件削除
  const handleDeleteProject = async (id: string) => {
    await DataService.deleteProject(id);
    await loadData();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Navigation */}
      <Navbar
        ips={ips}
        projects={projects}
        onOpenNewProject={() => {
          setEditingProject(null);
          setIsFormOpen(true);
        }}
      />

      {/* Hero Header */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-b border-slate-800 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4" />
              リアルタイム競合排除 一元管理ダッシュボード
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              競合排除 統合ダッシュボード
              <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                スプレッドシート互換ビュー
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
              全案件の競合商材・クライアント・代理店・施策名・排除期間が一画面でぱっと見渡せます。
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1">
            <div className="bg-rose-950/40 border border-rose-800/60 p-3.5 rounded-xl flex items-center gap-3 min-w-[160px] shadow-lg">
              <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-rose-300 uppercase">現在競合排除中</div>
                <div className="text-xl font-black text-white font-mono">
                  {currentlyExcludedProjects.length} <span className="text-xs text-rose-300 font-sans">件</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-950/40 border border-amber-800/60 p-3.5 rounded-xl flex items-center gap-3 min-w-[160px] shadow-lg">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-amber-300 uppercase">30日以内 契約終了</div>
                <div className="text-xl font-black text-white font-mono">
                  {expiringGroups.within30.length} <span className="text-xs text-amber-300 font-sans">件</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingProject(null);
                setIsFormOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold text-xs shadow-md transition-all hover:scale-105 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              新規案件登録
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-8">

        {/* Section 1: 契約終了が近い案件 (30日/60日/90日) アラート機能 */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/20 rounded-lg text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 className="text-base font-extrabold text-white">契約終了が近い競合排除案件 (アプローチ用アラート)</h2>
            </div>
            <span className="text-xs text-slate-400">更新アプローチ・再提案タイミング</span>
          </div>

          {/* 30日以内 Highlight Alert Bar */}
          {expiringGroups.within30.length > 0 && (
            <div className="bg-gradient-to-r from-rose-950/80 via-amber-950/60 to-slate-900 border-2 border-rose-500/60 rounded-2xl p-4 shadow-2xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-rose-600 text-white font-black text-xs rounded-md shadow animate-pulse">
                    🔥 最重要 アラート (30日以内に終了)
                  </span>
                  <span className="text-xs text-rose-200 font-semibold">
                    他社提案解禁が近づいています
                  </span>
                </div>
                <span className="text-xs font-mono font-black text-rose-300">
                  {expiringGroups.within30.length}件 該当
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {expiringGroups.within30.map((proj) => {
                  const days = getDaysUntilExpiration(proj.exclusion_end_date);
                  const matchedIpNames = ips
                    .filter((ip) => proj.ip_ids.includes(ip.id))
                    .map((ip) => ip.name);

                  return (
                    <div
                      key={proj.id}
                      onClick={() => setSelectedProject(proj)}
                      className="bg-slate-900/90 hover:bg-slate-800 border border-rose-500/40 p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.01] shadow"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex flex-wrap gap-1">
                          {matchedIpNames.map((name) => (
                            <span key={name} className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-1.5 py-0.5 rounded">
                              {name}
                            </span>
                          ))}
                        </div>
                        <span className="text-xs font-black text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                          あと{days}日
                        </span>
                      </div>
                      <div className="font-bold text-sm text-white truncate">{proj.exclusion_scope}</div>
                      <div className="text-xs text-slate-400 truncate">{proj.client_name}</div>
                      <div className="text-[11px] text-slate-500 mt-2 font-mono flex items-center justify-between border-t border-slate-800 pt-1.5">
                        <span>終了: {proj.exclusion_end_date}</span>
                        <span className="text-emerald-400 font-bold">{formatCurrency(proj.amount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 60日以内 & 90日以内 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 60日以内 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  31日〜60日以内に終了 ({expiringGroups.within60.length}件)
                </span>
              </div>
              {expiringGroups.within60.length === 0 ? (
                <div className="text-xs text-slate-500 py-2 text-center">該当案件はありません</div>
              ) : (
                <div className="space-y-1.5">
                  {expiringGroups.within60.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => setSelectedProject(proj)}
                      className="bg-slate-800/60 hover:bg-slate-800 p-2 rounded-lg border border-slate-700 text-xs flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <span className="font-bold text-slate-200">{proj.exclusion_scope}</span>
                        <span className="text-slate-400 ml-2">({proj.client_name})</span>
                      </div>
                      <div className="text-right font-mono text-[11px]">
                        <span className="text-amber-400 font-bold">{proj.exclusion_end_date}</span>
                        <span className="text-slate-500 ml-1">({getDaysUntilExpiration(proj.exclusion_end_date)}日残)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 90日以内 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  61日〜90日以内に終了 ({expiringGroups.within90.length}件)
                </span>
              </div>
              {expiringGroups.within90.length === 0 ? (
                <div className="text-xs text-slate-500 py-2 text-center">該当案件はありません</div>
              ) : (
                <div className="space-y-1.5">
                  {expiringGroups.within90.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => setSelectedProject(proj)}
                      className="bg-slate-800/60 hover:bg-slate-800 p-2 rounded-lg border border-slate-700 text-xs flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <span className="font-bold text-slate-200">{proj.exclusion_scope}</span>
                        <span className="text-slate-400 ml-2">({proj.client_name})</span>
                      </div>
                      <div className="text-right font-mono text-[11px]">
                        <span className="text-sky-300 font-bold">{proj.exclusion_end_date}</span>
                        <span className="text-slate-500 ml-1">({getDaysUntilExpiration(proj.exclusion_end_date)}日残)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: トップページ一元 高密度一覧テーブル (スプレッドシート互換ビュー) */}
        <section className="space-y-4 pt-2">
          {/* Header Bar & View Switcher */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  全案件データ スプレッドシート一覧
                  <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                    全{filteredProjects.length}件表示中
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  一案件の情報を横一列に並べ、全詳細（使用IP, 顧客, 競合商材, 代理店, 施策名, 期間, 金額, 備考）をぱっと確認できます。
                </p>
              </div>
            </div>

            {/* View Mode Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start md:self-auto">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  viewMode === 'table'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TableIcon className="w-4 h-4" />
                スプレッドシート風 (詳細一元一覧)
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                IP別カードビュー
              </button>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-black text-amber-400 flex items-center gap-1.5 uppercase">
                <Filter className="w-4 h-4" />
                高速検索 & 絞り込みフィルター
              </span>
              {(selectedIpIds.length > 0 ||
                selectedStatuses.length > 0 ||
                selectedExclusionStates.length > 0 ||
                scopeSearch ||
                clientSearch ||
                agencySearch) && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  フィルター解除
                </button>
              )}
            </div>

            {/* Search Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">競合商材／範囲で検索 (赤背景部)</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="例: ビール, コンビニ, 携帯..."
                    value={scopeSearch}
                    onChange={(e) => setScopeSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">顧客 (クライアント名) で検索</label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="部分一致検索..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">代理店名で検索</label>
                <input
                  type="text"
                  placeholder="部分一致検索..."
                  value={agencySearch}
                  onChange={(e) => setAgencySearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* IP Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-400">IP絞り込み:</span>
              <button
                onClick={() => setSelectedIpIds([])}
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition-all ${
                  selectedIpIds.length === 0
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                全IP表示
              </button>
              {ips.map((ip) => {
                const isSelected = selectedIpIds.includes(ip.id);
                return (
                  <button
                    key={ip.id}
                    onClick={() => toggleIpFilter(ip.id)}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition-all ${
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

            {/* Status & Sort Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800/60">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">競合排除状態</label>
                <div className="flex flex-wrap gap-1">
                  {(['競合排除中', '終了間近', '開始予定', '終了済み'] as ExclusionState[]).map((state) => {
                    const isSelected = selectedExclusionStates.includes(state);
                    return (
                      <button
                        key={state}
                        onClick={() => toggleExclusionStateFilter(state)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                          isSelected
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {state}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">案件ステータス</label>
                <div className="flex flex-wrap gap-1">
                  {(['提案前', '提案中', '受注／制作中', '公開中', '契約終了'] as ProjectStatus[]).map((st) => {
                    const isSelected = selectedStatuses.includes(st);
                    return (
                      <button
                        key={st}
                        onClick={() => toggleStatusFilter(st)}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
                  並び替え
                </label>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs font-bold text-white rounded-lg px-2.5 py-1 focus:border-amber-500 focus:outline-none"
                >
                  <option value="end_date_asc">競合排除 終了日が近い順</option>
                  <option value="end_date_desc">競合排除 終了日が遠い順</option>
                  <option value="start_date_desc">競合排除 開始日順</option>
                  <option value="amount_desc">金額が高い順</option>
                  <option value="amount_asc">金額が安い順</option>
                </select>
              </div>
            </div>
          </div>

          {/* VIEW MODE 1: Spreadsheet Table (横にズラリと積む形式 - 要望のメイン) */}
          {viewMode === 'table' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  {/* Spreadsheet Header (添付画像を参考にした見やすいカラム構成) */}
                  <thead className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800 uppercase text-[11px] tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="p-3 bg-slate-950 min-w-[120px]">使用IP</th>
                      <th className="p-3 bg-slate-950 min-w-[130px]">顧客 (クライアント名)</th>
                      <th className="p-3 bg-rose-950/80 text-rose-200 border-x border-rose-900/60 min-w-[150px]">
                        競合商材 (競合範囲)
                      </th>
                      <th className="p-3 bg-slate-950 min-w-[130px]">代理店名</th>
                      <th className="p-3 bg-slate-950 min-w-[180px]">施策内容 (対象商品/施策名)</th>
                      <th className="p-3 bg-slate-950 min-w-[170px]">競合排除期間 (開始〜終了)</th>
                      <th className="p-3 bg-slate-950 min-w-[130px]">競合状態 (自動判定)</th>
                      <th className="p-3 bg-slate-950 min-w-[100px]">ステータス</th>
                      <th className="p-3 bg-slate-950 min-w-[100px] text-right">金額</th>
                      <th className="p-3 bg-slate-950 min-w-[160px]">備考</th>
                      <th className="p-3 bg-slate-950 min-w-[60px] text-center">操作</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800/80 font-medium">
                    {filteredProjects.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-500 text-sm">
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
                            className="hover:bg-slate-800/80 transition-colors cursor-pointer group"
                          >
                            {/* 使用IP */}
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {matchedIpNames.map((name) => (
                                  <span
                                    key={name}
                                    className="bg-amber-400/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-black text-[11px]"
                                  >
                                    {name}
                                  </span>
                                ))}
                              </div>
                            </td>

                            {/* 顧客 (クライアント名) */}
                            <td className="p-3 font-bold text-white whitespace-nowrap">{proj.client_name}</td>

                            {/* 競合商材 / 競合範囲 (添付シートの赤ハイライトをリッチに表現) */}
                            <td className="p-3 bg-rose-950/30 border-x border-rose-900/40">
                              <span className="font-black text-white bg-rose-600 border border-rose-400 px-2.5 py-1 rounded shadow-sm inline-block text-xs">
                                {proj.exclusion_scope}
                              </span>
                            </td>

                            {/* 代理店名 */}
                            <td className="p-3 text-slate-300 whitespace-nowrap">{proj.agency_name || '-'}</td>

                            {/* 施策内容 (対象商品 / 施策名) */}
                            <td className="p-3 text-slate-200 max-w-[200px] truncate" title={proj.campaign_name}>
                              {proj.campaign_name}
                            </td>

                            {/* 競合排除期間 */}
                            <td className="p-3 font-mono text-xs text-slate-300 whitespace-nowrap">
                              <div className="font-semibold text-slate-200">{proj.exclusion_start_date}</div>
                              <div className="text-slate-400 text-[11px]">〜 {proj.exclusion_end_date}</div>
                            </td>

                            {/* 競合状態 (自動判定バッジ) */}
                            <td className="p-3">
                              <ExclusionBadge project={proj} showDays />
                            </td>

                            {/* 案件ステータス */}
                            <td className="p-3 whitespace-nowrap">
                              <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-bold text-xs">
                                {proj.status}
                              </span>
                            </td>

                            {/* 金額 */}
                            <td className="p-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                              {formatCurrency(proj.amount)}
                            </td>

                            {/* 備考 */}
                            <td className="p-3 text-slate-400 max-w-[180px] truncate text-[11px]" title={proj.notes}>
                              {proj.notes || '-'}
                            </td>

                            {/* 編集操作 */}
                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setEditingProject(proj);
                                  setIsFormOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                                title="編集"
                              >
                                <Edit className="w-4 h-4" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {ips.map((ip) => {
                const ipProjs = filteredProjects.filter((p) => p.ip_ids.includes(ip.id));
                const activeProjs = ipProjs.filter((p) => {
                  const s = getExclusionState(p);
                  return s === '競合排除中' || s === '終了間近';
                });

                return (
                  <div
                    key={ip.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                        <Link href={`/ips/${ip.id}`} className="group-hover:text-amber-400 transition-colors">
                          <h3 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                            {ip.name}
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                          </h3>
                        </Link>
                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                            activeProjs.length > 0
                              ? 'bg-rose-950 text-rose-400 border-rose-800'
                              : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          }`}
                        >
                          排除中: {activeProjs.length}件
                        </span>
                      </div>

                      {ipProjs.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/50">
                          該当する案件はありません
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {ipProjs.slice(0, 5).map((proj) => (
                            <div
                              key={proj.id}
                              onClick={() => setSelectedProject(proj)}
                              className="bg-slate-950/60 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-colors text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-black text-rose-400 truncate max-w-[170px]">
                                  • {proj.exclusion_scope}
                                </span>
                                <ExclusionBadge project={proj} showDays />
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                                <span className="truncate">{proj.client_name}</span>
                                <span className="font-mono text-slate-500">{proj.exclusion_end_date}まで</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">案件数: {ipProjs.length}件</span>
                      <Link
                        href={`/ips/${ip.id}`}
                        className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        専用ページを見る <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
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
