'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DataService } from '@/lib/storage';
import { IP, Project } from '@/types';
import { getExclusionState, formatCurrency, getDaysUntilExpiration } from '@/lib/exclusion-status';
import { Navbar } from '@/components/Navbar';
import { ExclusionBadge } from '@/components/ExclusionBadge';
import { ProjectFormModal } from '@/components/ProjectFormModal';
import { ProjectDetailModal } from '@/components/ProjectDetailModal';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  Building2,
  Calendar,
  ChevronLeft,
  PlusCircle,
  AlertTriangle,
  Tag,
  DollarSign,
} from 'lucide-react';

export default function IPDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ipId = params.id as string;

  const [ips, setIps] = useState<IP[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      setIps(fetchedIps);
      setProjects(fetchedProjects);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [ipId]);

  const currentIp = useMemo(() => ips.find((i) => i.id === ipId), [ips, ipId]);

  // 当該IPの全案件
  const ipProjects = useMemo(() => {
    return projects.filter((p) => p.ip_ids.includes(ipId));
  }, [projects, ipId]);

  // 3分類 (要件8)
  const activeExclusions = useMemo(() => {
    return ipProjects.filter((p) => {
      const s = getExclusionState(p);
      return s === '競合排除中' || s === '終了間近';
    });
  }, [ipProjects]);

  const upcomingExclusions = useMemo(() => {
    return ipProjects.filter((p) => getExclusionState(p) === '開始予定');
  }, [ipProjects]);

  const expiredExclusions = useMemo(() => {
    return ipProjects.filter((p) => getExclusionState(p) === '終了済み');
  }, [ipProjects]);

  // 禁止カテゴリサマリー
  const blockedCategories = useMemo(() => {
    return Array.from(new Set(activeExclusions.map((p) => p.exclusion_scope)));
  }, [activeExclusions]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-xs font-bold text-slate-400">データ読み込み中...</div>
        </div>
      </div>
    );
  }

  if (!currentIp) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <h2 className="text-lg font-bold">指定されたIPが見つかりません</h2>
        <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg">
          トップに戻る
        </button>
      </div>
    );
  }

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-8">
        {/* Header Breadcrumb */}
        <button
          onClick={() => router.back()}
          className="text-xs font-bold text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          ダッシュボードへ戻る
        </button>

        {/* IP Title Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-amber-400 text-slate-950 text-[11px] font-black px-2 py-0.5 rounded">
                キャラクターIP専用ページ
              </span>
              <span className="text-xs text-slate-400">ID: {currentIp.id}</span>
            </div>
            <h1 className="text-3xl font-black text-white">{currentIp.name}</h1>
            <p className="text-xs text-slate-400 mt-1">
              このキャラクターに関する競合排除案件の全状況と提案可否業種
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingProject({
                  ip_ids: [currentIp.id],
                  client_name: '',
                  agency_name: '',
                  campaign_name: '',
                  exclusion_scope: '',
                  exclusion_start_date: new Date().toISOString().split('T')[0],
                  exclusion_end_date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
                  status: '提案中',
                  amount: 0,
                  notes: '',
                } as any);
                setIsFormOpen(true);
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold shadow flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              このIPで案件を新規登録
            </button>
          </div>
        </div>

        {/* Highlight Alert Area: 現在このIPを提案できない可能性がある業種・カテゴリー (Requirement 8) */}
        <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-900 border-2 border-rose-600/60 rounded-2xl p-6 shadow-2xl space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-500 animate-pulse" />
            <h2 className="text-lg font-black text-white">⚡ 現在「{currentIp.name}」を提案できない可能性がある業種・カテゴリー</h2>
          </div>

          {blockedCategories.length === 0 ? (
            <div className="bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 p-4 rounded-xl flex items-center gap-3 text-xs">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <span className="font-bold text-sm">現在、排除制限中の業種はありません</span>
                <p className="text-emerald-400/80 mt-0.5">全カテゴリーにおいて新規クライアント・代理店への提案が可能です。</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {blockedCategories.map((cat) => (
                  <span
                    key={cat}
                    className="bg-rose-600 text-white font-black text-sm px-3.5 py-1.5 rounded-lg shadow border border-rose-400 flex items-center gap-1.5"
                  >
                    <Tag className="w-4 h-4" />
                    {cat}
                  </span>
                ))}
              </div>
              <p className="text-xs text-rose-200/80">
                上記カテゴリーについては現在競合排除期間内（または終了間近）のため、同業他社への新規提案の際は事前に既存契約の期間・範囲をご確認ください。
              </p>
            </div>
          )}
        </div>

        {/* 30日以内通知等 3分類表示 (現在競合排除中 / 今後開始予定 / 契約終了済み) */}
        <div className="space-y-8">

          {/* 1. 現在競合排除中の案件 */}
          <section className="space-y-3">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              1. 現在競合排除中の案件 ({activeExclusions.length}件)
            </h3>

            {activeExclusions.length === 0 ? (
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs text-slate-500">
                現在競合排除中の案件はありません。
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeExclusions.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => setSelectedProject(proj)}
                    className="bg-slate-900 border border-rose-500/40 p-4 rounded-xl hover:border-rose-500 cursor-pointer transition-all shadow-md space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-rose-300 text-sm bg-rose-950 px-2.5 py-0.5 rounded border border-rose-800">
                        {proj.exclusion_scope}
                      </span>
                      <ExclusionBadge project={proj} showDays />
                    </div>
                    <div className="font-bold text-white text-base">{proj.campaign_name}</div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>クライアント: {proj.client_name} ({proj.agency_name || '直取引'})</span>
                      <span className="font-bold text-emerald-400">{formatCurrency(proj.amount)}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span>期間: {proj.exclusion_start_date} ～ {proj.exclusion_end_date}</span>
                      <span>ステータス: {proj.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 2. 今後開始予定の案件 */}
          <section className="space-y-3">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-sky-400" />
              2. 今後開始予定の案件 ({upcomingExclusions.length}件)
            </h3>

            {upcomingExclusions.length === 0 ? (
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs text-slate-500">
                今後開始予定の案件はありません。
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingExclusions.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => setSelectedProject(proj)}
                    className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-sky-500 cursor-pointer transition-all shadow-md space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-300 text-xs bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                        {proj.exclusion_scope}
                      </span>
                      <ExclusionBadge project={proj} />
                    </div>
                    <div className="font-bold text-white text-sm">{proj.campaign_name}</div>
                    <div className="text-xs text-slate-400">クライアント: {proj.client_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span>期間: {proj.exclusion_start_date} ～ {proj.exclusion_end_date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 3. 契約終了済みの案件 */}
          <section className="space-y-3">
            <h3 className="text-base font-black text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-slate-500" />
              3. 契約終了済みの過去案件 ({expiredExclusions.length}件)
            </h3>

            {expiredExclusions.length === 0 ? (
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs text-slate-500">
                過去の終了済み案件はありません。
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {expiredExclusions.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => setSelectedProject(proj)}
                    className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl opacity-75 hover:opacity-100 cursor-pointer transition-all text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300">{proj.exclusion_scope}</span>
                      <ExclusionBadge project={proj} />
                    </div>
                    <div className="font-semibold text-slate-300">{proj.campaign_name} ({proj.client_name})</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      契約期間: {proj.exclusion_start_date} ～ {proj.exclusion_end_date}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

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
