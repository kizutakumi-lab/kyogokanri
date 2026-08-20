'use client';

import React, { useState, useEffect } from 'react';
import { DataService } from '@/lib/storage';
import { IP } from '@/types';
import { Navbar } from '@/components/Navbar';
import { Settings, Plus, Edit2, Trash2, Check, X, ShieldAlert } from 'lucide-react';

export default function IPAdminPage() {
  const [ips, setIps] = useState<IP[]>([]);
  const [newIpName, setNewIpName] = useState('');
  const [editingIpId, setEditingIpId] = useState<string | null>(null);
  const [editingIpName, setEditingIpName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadIps = async () => {
    const data = await DataService.getIPs();
    setIps(data);
  };

  useEffect(() => {
    loadIps();
  }, []);

  // IP追加
  const handleAddIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIpName.trim()) return;

    try {
      setIsSubmitting(true);
      await DataService.saveIP({ name: newIpName.trim(), active: true });
      setNewIpName('');
      await loadIps();
    } catch (e) {
      console.error(e);
      alert('IPの追加に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  // IP名前編集
  const handleSaveEdit = async (id: string) => {
    if (!editingIpName.trim()) return;

    try {
      setIsSubmitting(true);
      await DataService.saveIP({ id, name: editingIpName.trim() });
      setEditingIpId(null);
      setEditingIpName('');
      await loadIps();
    } catch (e) {
      console.error(e);
      alert('更新に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  // IP無効化 (削除)
  const handleDeleteIp = async (id: string, name: string) => {
    if (!confirm(`IP「${name}」を無効化してもよろしいですか？（※既存案件の紐付けデータは保持されます）`)) return;

    try {
      await DataService.deleteIP(id);
      await loadIps();
    } catch (e) {
      console.error(e);
      alert('無効化に失敗しました。');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <Navbar ips={ips} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* Title */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">キャラクターIPマスタ管理</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              案件登録時に選択する使用IPの追加・名称修正・無効化設定
            </p>
          </div>
        </div>

        {/* Add New IP Form */}
        <form onSubmit={handleAddIp} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            新規IPの登録
          </label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              required
              placeholder="例: マジカル鷹の爪ちゃん"
              value={newIpName}
              onChange={(e) => setNewIpName(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:border-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 text-sm font-black rounded-xl shadow transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              IPを追加
            </button>
          </div>
        </form>

        {/* IP List Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
            登録済みIP一覧 ({ips.length}件)
          </div>

          <div className="divide-y divide-slate-800">
            {ips.map((ip) => (
              <div key={ip.id} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                {editingIpId === ip.id ? (
                  <div className="flex items-center gap-2 flex-1 max-w-md">
                    <input
                      type="text"
                      value={editingIpName}
                      onChange={(e) => setEditingIpName(e.target.value)}
                      className="flex-1 bg-slate-950 border border-amber-500 rounded-lg px-3 py-1.5 text-sm font-bold text-white"
                    />
                    <button
                      onClick={() => handleSaveEdit(ip.id)}
                      className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingIpId(null)}
                      className="p-1.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="font-black text-sm text-white">{ip.name}</span>
                    {ip.active ? (
                      <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        有効
                      </span>
                    ) : (
                      <span className="bg-slate-800 text-slate-500 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                        無効
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {editingIpId !== ip.id && (
                    <button
                      onClick={() => {
                        setEditingIpId(ip.id);
                        setEditingIpName(ip.name);
                      }}
                      className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="名前を編集"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {ip.active && (
                    <button
                      onClick={() => handleDeleteIp(ip.id, ip.name)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="無効化"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
