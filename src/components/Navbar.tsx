'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Table,
  CalendarDays,
  Settings,
  History,
  PlusCircle,
  Zap,
  Menu,
  X,
  ShieldAlert,
} from 'lucide-react';
import { QuickCheckModal } from './QuickCheckModal';
import { IP, Project } from '@/types';

interface NavbarProps {
  ips?: IP[];
  projects?: Project[];
  onOpenNewProject?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  ips = [],
  projects = [],
  onOpenNewProject,
}) => {
  const pathname = usePathname();
  const [isQuickCheckOpen, setIsQuickCheckOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'ダッシュボード', icon: LayoutDashboard },
    { href: '/projects', label: '案件一覧', icon: Table },
    { href: '/timeline', label: 'ガントチャート', icon: CalendarDays },
    { href: '/admin/ips', label: 'IPマスタ', icon: Settings },
    { href: '/admin/logs', label: '操作ログ', icon: History },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="p-2 bg-gradient-to-tr from-amber-500 to-rose-500 rounded-xl shadow-inner group-hover:scale-105 transition-transform">
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-black text-base tracking-tight flex items-center gap-1.5">
                    競合排除管理くん
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-1.5 py-0.5 rounded border border-rose-500/30">
                      IP競合一元化
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal hidden sm:block">
                    営業用 競合排除判定・可視化ツール
                  </div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Quick Check Button */}
              <button
                onClick={() => setIsQuickCheckOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg text-xs font-black shadow-md hover:shadow-lg transition-all animate-pulse"
                title="30秒で競合判定"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>30秒 競合確認</span>
              </button>

              {/* New Project Button */}
              {onOpenNewProject && (
                <button
                  onClick={onOpenNewProject}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>新規案件登録</span>
                </button>
              )}

              {/* Mobile Menu Trigger */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-800 border-b border-slate-700 px-4 pt-2 pb-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold ${
                    isActive ? 'bg-slate-700 text-amber-400' : 'text-slate-300 hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            {onOpenNewProject && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenNewProject();
                }}
                className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2.5 bg-rose-600 text-white rounded-lg text-sm font-bold"
              >
                <PlusCircle className="w-5 h-5" />
                新規案件登録
              </button>
            )}
          </div>
        )}
      </header>

      {/* 30秒 競合確認 モーダル */}
      <QuickCheckModal
        isOpen={isQuickCheckOpen}
        onClose={() => setIsQuickCheckOpen(false)}
        ips={ips}
        projects={projects}
      />
    </>
  );
};
