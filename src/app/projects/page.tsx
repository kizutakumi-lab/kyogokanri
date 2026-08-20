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
  Table as TableIcon,
  XCircle,
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 space-y-4">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-4 rounded border border-slate-800 shadow">
          <div>
            <div className="flex items-center gap-2">
              <TableIcon className="w-5 h-5 text-amber-400" />
              <h1 className="text-xl font-bold text-white">競合排除 案件一覧</h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              全競合排除案件の一覧テーブル
            </p>
          </div>

          <button
            onClick={() => {
              setEditingProject(null);
              setIsFormOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-xs shadow transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            新規案件登録
          </button>
        </div>

        {/* Filter Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded p-4 space-y-3 shadow">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Filter className="w-4 h-4 text-amber-400" />
              絞り込み・検索
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
                解除
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="競合商材で検索..."
                value={scopeSearch}
                onChange={(e) => setScopeSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="クライアント名..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <input
              type="text"
              placeholder="代理店名..."
              value={agencySearch}
              onChange={(e) => setAgencySearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-400">IP:</span>
            <button
              onClick={() => setSelectedIpIds([])}
              className={`px-2.5 py-0.5 rounded text-xs font-bold transition-all ${
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
                  className={`px-2.5 py-0.5 rounded text-xs font-bold transition-all ${
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
                          ? 'bg-amber-500 text-slate-950'
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
                ソート
              </label>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="w-full bg-slate-950 border border-slate-800 text-xs font-bold text-white rounded px-3 py-1.5 focus:border-amber-500 focus:outline-none"
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

        {/* Data Table */}
        <div className="bg-slate-900 border border-slate-800 rounded shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-3 min-w-[120px]">使用IP</th>
                  <th className="p-3 min-w-[140px]">競合商材 (競合範囲)</th>
                  <th className="p-3 min-w-[130px]">クライアント名</th>
                  <th className="p-3 min-w-[110px]">代理店名</th>
                  <th className="p-3 min-w-[170px]">対象商品／施策名</th>
                  <th className="p-3 min-w-[160px]">競合排除期間</th>
                  <th className="p-3 min-w-[120px]">競合状態 (自動判定)</th>
                  <th className="p-3 min-w-[90px]">ステータス</th>
                  <th className="p-3 min-w-[100px] text-right">金額</th>
                  <th className="p-3 min-w-[50px] text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-500 text-xs">
                      条件に該当する案件がありません。
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
                        <td className="p-3">
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

                        {/* シンプル四角枠 */}
                        <td className="p-3">
                          <span className="font-semibold text-slate-200 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded inline-block text-xs">
                            {proj.exclusion_scope}
                          </span>
                        </td>

                        <td className="p-3 font-bold text-white whitespace-nowrap">{proj.client_name}</td>
                        <td className="p-3 text-slate-300 whitespace-nowrap">{proj.agency_name || '-'}</td>
                        <td className="p-3 text-slate-200 max-w-[180px] truncate" title={proj.campaign_name}>
                          {proj.campaign_name}
                        </td>

                        <td className="p-3 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                          <span className="font-semibold text-slate-200">{proj.exclusion_start_date}</span>
                          <span className="text-slate-400 ml-1">〜 {proj.exclusion_end_date}</span>
                        </td>

                        <td className="p-3">
                          <ExclusionBadge project={proj} showDays />
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          <span className="bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded font-semibold text-[10px]">
                            {proj.status}
                          </span>
                        </td>

                        <td className="p-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                          {formatCurrency(proj.amount)}
                        </td>

                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
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
