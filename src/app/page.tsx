'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DataService } from '@/lib/storage';
import { IP, Project } from '@/types';
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
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  PlusCircle,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const [ips, setIps] = useState<IP[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-b border-slate-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4" />
              リアルタイム競合可視化ダッシュボード
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              キャラクターIP 競合排除サマリー
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              全キャラクターIPの競合状況をリアルタイム集計中。どのIPが何の業種で排除中か、終了直前の案件はどれかが一目でわかります。
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1">
            <div className="bg-rose-950/40 border border-rose-800/60 p-4 rounded-xl flex items-center gap-4 min-w-[170px] shadow-lg">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-rose-300 uppercase">現在競合排除中</div>
                <div className="text-2xl font-black text-white font-mono">
                  {currentlyExcludedProjects.length} <span className="text-xs text-rose-300 font-sans">件</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-950/40 border border-amber-800/60 p-4 rounded-xl flex items-center gap-4 min-w-[170px] shadow-lg">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-amber-300 uppercase">30日以内 契約終了</div>
                <div className="text-2xl font-black text-white font-mono">
                  {expiringGroups.within30.length} <span className="text-xs text-amber-300 font-sans">件</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-10">

        {/* Section 1: 契約終了が近い案件 (30日/60日/90日) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/20 rounded-lg text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-extrabold text-white">契約終了が近い競合排除案件</h2>
            </div>
            <Link
              href="/projects"
              className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 font-semibold transition-colors"
            >
              全案件をテーブルで見る <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 30日以内 Highlight Alert Bar */}
          {expiringGroups.within30.length > 0 && (
            <div className="bg-gradient-to-r from-rose-950/80 via-amber-950/60 to-slate-900 border-2 border-rose-500/60 rounded-2xl p-5 shadow-2xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 bg-rose-600 text-white font-black text-xs rounded-md shadow animate-pulse">
                    🔥 最重要 アラート (30日以内に終了)
                  </span>
                  <span className="text-xs text-rose-200 font-semibold">
                    再提案・契約更新の営業アプローチタイミングです
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
                      className="bg-slate-900/90 hover:bg-slate-800 border border-rose-500/40 p-3.5 rounded-xl cursor-pointer transition-all hover:scale-[1.01] shadow"
                    >
                      <div className="flex items-center justify-between mb-1.5">
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
                      <div className="text-xs text-slate-400 truncate mt-0.5">{proj.client_name}</div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 60日以内 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  31日〜60日以内に終了 ({expiringGroups.within60.length}件)
                </span>
              </div>
              {expiringGroups.within60.length === 0 ? (
                <div className="text-xs text-slate-500 py-3 text-center">該当案件はありません</div>
              ) : (
                <div className="space-y-2">
                  {expiringGroups.within60.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => setSelectedProject(proj)}
                      className="bg-slate-800/60 hover:bg-slate-800 p-2.5 rounded-lg border border-slate-700 text-xs flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-slate-200">{proj.exclusion_scope}</div>
                        <div className="text-slate-400">{proj.client_name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-amber-400 font-bold">{proj.exclusion_end_date}</div>
                        <div className="text-[10px] text-slate-500">残り{getDaysUntilExpiration(proj.exclusion_end_date)}日</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 90日以内 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  61日〜90日以内に終了 ({expiringGroups.within90.length}件)
                </span>
              </div>
              {expiringGroups.within90.length === 0 ? (
                <div className="text-xs text-slate-500 py-3 text-center">該当案件はありません</div>
              ) : (
                <div className="space-y-2">
                  {expiringGroups.within90.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => setSelectedProject(proj)}
                      className="bg-slate-800/60 hover:bg-slate-800 p-2.5 rounded-lg border border-slate-700 text-xs flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-slate-200">{proj.exclusion_scope}</div>
                        <div className="text-slate-400">{proj.client_name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sky-300 font-bold">{proj.exclusion_end_date}</div>
                        <div className="text-[10px] text-slate-500">残り{getDaysUntilExpiration(proj.exclusion_end_date)}日</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: IP別の競合排除状況 (要件5) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                IP別 競合排除状況サマリー
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                キャラクターIPごとの排除中件数・競合範囲・クライアント・終了日一覧
              </p>
            </div>
            <Link
              href="/timeline"
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg font-bold transition-colors"
            >
              ガントチャートで重ねて見る
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ips.map((ip) => {
              const ipProjs = projects.filter((p) => p.ip_ids.includes(ip.id));
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
                    {/* Header */}
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
                        競合排除中: {activeProjs.length}件
                      </span>
                    </div>

                    {/* Active Exclusion Items */}
                    {activeProjs.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/50">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto mb-1 opacity-80" />
                        現在、競合排除の制限なし (全業種提案可)
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {activeProjs.slice(0, 4).map((proj) => {
                          const days = getDaysUntilExpiration(proj.exclusion_end_date);
                          return (
                            <div
                              key={proj.id}
                              onClick={() => setSelectedProject(proj)}
                              className="bg-slate-950/60 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-colors text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-amber-300 truncate max-w-[170px]">
                                  • {proj.exclusion_scope}
                                </span>
                                <ExclusionBadge project={proj} showDays />
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                                <span className="truncate">{proj.client_name}</span>
                                <span className="font-mono text-slate-500">{proj.exclusion_end_date}まで</span>
                              </div>
                            </div>
                          );
                        })}
                        {activeProjs.length > 4 && (
                          <div className="text-[11px] text-slate-400 text-center pt-1 font-semibold">
                            他 {activeProjs.length - 4} 件の排除中案件あり
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer link */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">累計登録: {ipProjs.length}件</span>
                    <Link
                      href={`/ips/${ip.id}`}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      IP専用ページを見る <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
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
