'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DataService } from '@/lib/storage';
import { IP, Project, ProjectStatus, ExclusionState } from '@/types';
import { getExclusionState, formatCurrency } from '@/lib/exclusion-status';
import { Navbar } from '@/components/Navbar';
import { ExclusionBadge } from '@/components/ExclusionBadge';
import { ProjectFormModal } from '@/components/ProjectFormModal';
import { ProjectDetailModal } from '@/components/ProjectDetailModal';
import {
  Search,
  Filter,
  ArrowUpDown,
  PlusCircle,
  Edit,
  Building2,
  Calendar,
  Layers,
  XCircle,
  Table as TableIcon,
  Copy,
  ChevronDown,
} from 'lucide-react';

type SortField = 'end_date_asc' | 'end_date_desc' | 'start_date_desc' | 'amount_desc' | 'amount_asc';

export default function ProjectsPage() {
  const [ips, setIps] = useState<IP[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedIpIds, setSelectedIpIds] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<ProjectStatus[]>([]);
  const [selectedExclusionStates, setSelectedExclusionStates] = useState<ExclusionState[]>([]);
  const [scopeSearch, setScopeSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [agencySearch, setAgencySearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('end_date_asc');

  // Modals
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

  // フィルター＆ソート済み案件リスト
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
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <Navbar
        ips={ips}
        projects={projects}
        onOpenNewProject={() => {
          setEditingProject(null);
          setIsFormOpen(true);
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md">
          <div>
            <div className="flex items-center gap-2">
              <TableIcon className="w-6 h-6 text-amber-400" />
              <h1 className="text-2xl font-black text-white">競合排除 案件一覧</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              社内で進行・過去に契約した競合排除案件の高密度データテーブル。各種複合検索に対応。
            </p>
          </div>

          <button
            onClick={() => {
              setEditingProject(null);
              setIsFormOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold text-sm shadow-md transition-all hover:scale-105"
          >
            <PlusCircle className="w-5 h-5" />
            新規案件登録
          </button>
        </div>

        {/* Filter Panel (Requirements 4) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-amber-400 uppercase tracking-wider">
              <Filter className="w-4 h-4" />
              複合検索・絞り込みフィルター
            </div>
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
                <XCircle className="w-4 h-4" />
                フィルター解除
              </button>
            )}
          </div>

          {/* Keyword Search Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">競合範囲で検索</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="例: ビール, コンビニ..."
                  value={scopeSearch}
                  onChange={(e) => setScopeSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">クライアント名で検索</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="部分一致検索..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
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
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
              IPで絞り込み (複数選択可)
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedIpIds([])}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  selectedIpIds.length === 0
                    ? 'bg-amber-500 text-white shadow'
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
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {ip.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status & Exclusion State & Sort Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800/60">
            {/* Exclusion State Pills */}
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

            {/* Project Status Pills */}
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

            {/* Sort Dropdown */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
                並び替え (ソート)
              </label>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="w-full bg-slate-950 border border-slate-800 text-xs font-bold text-white rounded-lg px-3 py-1.5 focus:border-amber-500 focus:outline-none"
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

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>表示件数: <strong className="text-white font-mono">{filteredProjects.length}</strong> / 全 {projects.length} 件</span>
          <span className="text-[11px]">※ テーブル行をクリックすると詳細モーダルが開きます</span>
        </div>

        {/* Data Table (Requirement 3) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-3.5 min-w-[140px]">使用IP</th>
                  <th className="p-3.5 min-w-[150px]">競合範囲</th>
                  <th className="p-3.5 min-w-[140px]">クライアント名</th>
                  <th className="p-3.5 min-w-[120px]">代理店名</th>
                  <th className="p-3.5 min-w-[180px]">対象商品／施策名</th>
                  <th className="p-3.5 min-w-[180px]">競合排除期間</th>
                  <th className="p-3.5 min-w-[130px]">自動判定状態</th>
                  <th className="p-3.5 min-w-[100px]">ステータス</th>
                  <th className="p-3.5 min-w-[110px] text-right">金額</th>
                  <th className="p-3.5 min-w-[60px] text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500 text-sm">
                      条件に該当する案件が見つかりませんでした。
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
                        <td className="p-3.5">
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

                        {/* 競合範囲 */}
                        <td className="p-3.5">
                          <span className="font-extrabold text-rose-300 bg-rose-950/60 px-2 py-1 rounded border border-rose-800/60 inline-block">
                            {proj.exclusion_scope}
                          </span>
                        </td>

                        {/* クライアント */}
                        <td className="p-3.5 font-bold text-white">{proj.client_name}</td>

                        {/* 代理店名 */}
                        <td className="p-3.5 text-slate-400">{proj.agency_name || '-'}</td>

                        {/* 対象商品 / 施策名 */}
                        <td className="p-3.5 text-slate-200 truncate max-w-[200px]" title={proj.campaign_name}>
                          {proj.campaign_name}
                        </td>

                        {/* 競合排除期間 */}
                        <td className="p-3.5 font-mono text-slate-300">
                          <div>{proj.exclusion_start_date}</div>
                          <div className="text-slate-500">〜 {proj.exclusion_end_date}</div>
                        </td>

                        {/* 自動判定バッジ */}
                        <td className="p-3.5">
                          <ExclusionBadge project={proj} showDays />
                        </td>

                        {/* 案件ステータス */}
                        <td className="p-3.5">
                          <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-bold">
                            {proj.status}
                          </span>
                        </td>

                        {/* 金額 */}
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(proj.amount)}
                        </td>

                        {/* 編集ボタン */}
                        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
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
