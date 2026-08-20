# 競合排除管理ツール Vercel & Supabase デプロイ手順書

本アプリケーションは **Next.js 14 (App Router)** で構築されており、**GitHub** および **Vercel** へのデプロイが完了すると、社内メンバー全員がWebブラウザで即座に競合排除状況を確認・管理できるようになります。

---

## 1. Supabase (PostgreSQL データベース) のセットアップ

### 手順 A: Supabase プロジェクト作成
1. [Supabase公式](https://supabase.com/) にアクセスしログインします。
2. **「New Project」** をクリックし、プロジェクト名（例: `conflict-management`）とデータベースパスワードを設定して作成します。

### 手順 B: テーブル・初期データの作成
1. Supabase ダッシュボードの左メニュー **「SQL Editor」** を開きます。
2. プロジェクト内の `supabase/schema.sql` の内容をコピー＆ペーストして **「Run」** を実行します。
   - `ips`, `projects`, `project_ips`, `audit_logs` テーブルおよび初期IPマスタが作成されます。

### 手順 C: APIキーの取得
1. Supabase ダッシュボードの **Project Settings** > **API** ページを開きます。
2. 以下の2つの値を控え、Vercelの環境変数に設定します：
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **anon public Key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)

---

## 2. GitHub リポジトリへのプッシュ

### ローカルから Git コミット・プッシュ

Terminal / PowerShell で以下のコマンドを実行して GitHub にプッシュします：

```bash
# Gitリポジトリの初期化と全ファイルの追加
git init
git add .
git commit -m "feat: 競合排除管理くん MVP リリース"

# メインブランチの設定
git branch -M main

# GitHubで作成したリポジトリURLをリモートに設定
git remote add origin https://github.com/YOUR_ORGANIZATION/conflict-management.git

# プッシュ
git push -u origin main
```

---

## 3. Vercel へのワンクリックデプロイ

### 手順
1. [Vercel](https://vercel.com/) にログインし、**「Add New...」** > **「Project」** を選択します。
2. プッシュした GitHub リポジトリ (`conflict-management`) を選択して **「Import」** をクリックします。
3. **Environment Variables** (環境変数) セクションを開き、Supabase のキーを登録します：

| 環境変数名 | 設定値の例 |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` |

4. **「Deploy」** ボタンを押します。
   - 約1分程度で社内共有用のVercel URL (例: `https://conflict-management.vercel.app`) が発行されます！

---

## 4. 特徴とフォールバック構造

- **オフライン/開発中フォールバック**:
  - Supabase環境変数が未設定の場合でも、ローカル環境やブラウザの LocalStorage で完全に動作・データ保存が可能です。

---

## 5. 今後追加可能な拡張機能 (要件15)

- 契約書PDFのアップロード・添付機能
- 契約終了前 (30日前など) の Slack / メール通知
- Googleログイン (NextAuth / Supabase Auth) によるアクセス制限
- CSV/Excel エクスポート・インポート
