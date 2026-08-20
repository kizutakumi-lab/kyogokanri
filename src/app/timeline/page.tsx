'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DataService } from '@/lib/storage';
import { IP, Project } from '@/types';
import { getExclusionState } from '@/lib/exclusion-status';
import { Navbar } from '@/components/Navbar';
import { ProjectFormModal } from '@/components/ProjectFormModal';
import { ProjectDetailModal } from '@/components/ProjectDetailModal';
import { CalendarDays, ChevronLeft, ChevronRight, Layers, ShieldAlert, Sparkles } from 'lucide-react';

export default function TimelinePage() {
  const [ips, setIps] = useState<IP[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [targetYear, setTargetYear] = useState<number>(2026);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

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

  // 年の指定における月別のPositionパーセントを算出
  const getTimelinePosition = (startDateStr: string, endDateStr: string) => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);

    const yearStart = new Date(targetYear, 0, 1);
    const yearEnd = new Date(targetYear, 11, 31);

    if (end < yearStart || start > yearEnd) return null;

    const clampedStart = start < yearStart ? yearStart : start;
    const clampedEnd = end > yearEnd ? yearEnd : end;

    const totalDays = (yearEnd.getTime() - yearStart.getTime()) / (1000 * 3600 * 24);
    const startDiff = (clampedStart.getTime() - yearStart.getTime()) / (1000 * 3600 * 24);
    const endDiff = (clampedEnd.getTime() - yearStart.getTime()) / (1000 * 3600 * 24);

    const left = Math.max(0, (startDiff / totalDays) * 100);
    const width = Math.min(100 - left, Math.max(2, ((endDiff - startDiff) / totalDays) * 100));

    return { left: `${left}%`, width: `${width}%` };
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
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4" />
              視覚的重複チェック
            </div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-amber-400" />
              IP別 競合排除ガントチャート / タイムライン
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              キャラクターIPごとに「いつからいつまで何のために競合排除がかかっているか」を横軸時間で俯瞰。
            </p>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
            <button
              onClick={() => setTargetYear((y) => y - 1)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-mono font-black text-lg text-amber-400 px-2">{targetYear} 年</span>
            <button
              onClick={() => setTargetYear((y) => y + 1)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 text-xs">
          <span className="font-bold text-slate-400">凡例:</span>
          <span className="flex items-center gap-1.5 font-bold text-rose-400">
            <span className="w-3 h-3 rounded bg-rose-600 inline-block"></span>
            競合排除中 / 終了間近
          </span>
          <span className="flex items-center gap-1.5 font-bold text-sky-400">
            <span className="w-3 h-3 rounded bg-sky-500 inline-block"></span>
            開始予定
          </span>
          <span className="flex items-center gap-1.5 font-bold text-slate-400">
            <span className="w-3 h-3 rounded bg-slate-600 inline-block"></span>
            終了済み / 契約終了
          </span>
        </div>

        {/* Gantt Chart Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Timeline Header (Months) */}
          <div className="grid grid-cols-12 bg-slate-950 border-b border-slate-800 text-center text-xs font-mono font-black text-slate-400 py-3">
            {months.map((m) => (
              <div key={m} className="border-r border-slate-800/60 last:border-0">
                {m}月
              </div>
            ))}
          </div>

          {/* IP Rows */}
          <div className="divide-y divide-slate-800/80">
            {ips.map((ip) => {
              const ipProjs = projects.filter((p) => p.ip_ids.includes(ip.id));

              return (
                <div key={ip.id} className="p-4 space-y-3 hover:bg-slate-900/80 transition-colors">
                  {/* IP Label */}
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-amber-400 bg-amber-950/60 px-3 py-1 rounded-lg border border-amber-800/60">
                      {ip.name}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      全{ipProjs.length}件の登録案件
                    </span>
                  </div>

                  {/* Gantt Bar Area */}
                  {ipProjs.length === 0 ? (
                    <div className="h-9 bg-slate-950/30 rounded-lg flex items-center justify-center text-[11px] text-slate-600 italic">
                      {targetYear}年の登録案件はありません
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {ipProjs.map((proj) => {
                        const pos = getTimelinePosition(proj.exclusion_start_date, proj.exclusion_end_date);
                        if (!pos) return null;

                        const state = getExclusionState(proj);
                        let barColorClass = 'bg-slate-700 hover:bg-slate-600 border-slate-500';
                        if (state === '競合排除中') barColorClass = 'bg-rose-600 hover:bg-rose-500 border-rose-400 shadow-rose-900/50';
                        if (state === '終了間近') barColorClass = 'bg-gradient-to-r from-rose-600 to-amber-500 hover:brightness-110 border-amber-300 shadow-amber-900/50 animate-pulse';
                        if (state === '開始予定') barColorClass = 'bg-sky-600 hover:bg-sky-500 border-sky-400 shadow-sky-900/50';

                        return (
                          <div
                            key={proj.id}
                            className="relative h-8 bg-slate-950/80 rounded-lg border border-slate-800/80 overflow-hidden group/bar"
                          >
                            {/* Background Month Grids */}
                            <div className="absolute inset-0 grid grid-cols-12 pointer-events-none opacity-20">
                              {months.map((m) => (
                                <div key={m} className="border-r border-slate-700"></div>
                              ))}
                            </div>

                            {/* Bar item */}
                            <div
                              onClick={() => setSelectedProject(proj)}
                              style={{ left: pos.left, width: pos.width }}
                              className={`absolute top-1 bottom-1 rounded-md border text-[11px] font-bold text-white px-2 flex items-center justify-between cursor-pointer transition-all shadow-md ${barColorClass}`}
                              title={`${proj.campaign_name} (${proj.client_name})\n競合範囲: ${proj.exclusion_scope}\n期間: ${proj.exclusion_start_date} 〜 ${proj.exclusion_end_date}`}
                            >
                              <span className="truncate pr-1">
                                {proj.exclusion_scope} ({proj.client_name})
                              </span>
                              <span className="font-mono text-[10px] opacity-90 hidden sm:inline">
                                {proj.exclusion_start_date.slice(5)} ~ {proj.exclusion_end_date.slice(5)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
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
