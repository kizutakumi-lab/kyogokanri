'use client';

import React, { useState, useEffect } from 'react';
import { DataService } from '@/lib/storage';
import { AuditLog } from '@/types';
import { Navbar } from '@/components/Navbar';
import { History, User, Calendar, ShieldAlert } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    DataService.getAuditLogs().then(setLogs);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* Title */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">操作履歴・監査ログ</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              誰が・いつ・どの案件を新規登録／編集／複製／削除したかのセキュリティ履歴
            </p>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>操作記録件数 ({logs.length}件)</span>
            <span className="text-[11px] text-slate-500">※ Google Auth / Supabase Auth 連携対応構造</span>
          </div>

          <div className="divide-y divide-slate-800">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">操作ログはありません。</div>
            ) : (
              logs.map((log) => {
                let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
                if (log.action === 'CREATE') badgeColor = 'bg-emerald-950 text-emerald-400 border-emerald-800';
                if (log.action === 'UPDATE') badgeColor = 'bg-amber-950 text-amber-400 border-amber-800';
                if (log.action === 'DELETE') badgeColor = 'bg-rose-950 text-rose-400 border-rose-800';

                return (
                  <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-black border ${badgeColor}`}>
                          {log.action}
                        </span>
                        <span className="font-bold text-sm text-white">{log.details}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          {log.user_name} ({log.user_email})
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-[11px] font-mono text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(log.created_at).toLocaleString('ja-JP')}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
