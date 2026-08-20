import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '競合排除管理くん | キャラクターIP競合一元管理ツール',
  description: '社内キャラクターIPの競合排除・タイアップ・コラボ案件の競合状態を一元管理する営業支援ツール',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-slate-900 text-slate-100 flex flex-col antialiased selection:bg-amber-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
