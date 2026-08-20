-- 競合排除管理システム データベース定義 (Supabase / PostgreSQL)

-- 1. IPマスタテーブル
CREATE TABLE IF NOT EXISTS public.ips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 案件テーブル
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    agency_name TEXT,
    campaign_name TEXT NOT NULL,
    exclusion_scope TEXT NOT NULL,
    exclusion_start_date DATE NOT NULL,
    exclusion_end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT '提案中',
    amount NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 3. 案件IP中間テーブル
CREATE TABLE IF NOT EXISTS public.project_ips (
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    ip_id UUID REFERENCES public.ips(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, ip_id)
);

-- 4. 操作ログテーブル
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'DUPLICATE'
    user_name TEXT DEFAULT '営業担当',
    user_email TEXT DEFAULT 'user@company.com',
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 初期IPマスタの登録
INSERT INTO public.ips (name, active) VALUES
    ('秘密結社鷹の爪', true),
    ('吉田勝子', true),
    ('貝社員', true),
    ('そろ谷のアニメっち', true),
    ('耐え子の日常', true),
    ('パンパカパンツ', true),
    ('昼メシの流儀', true),
    ('小３アシベ', true),
    ('きらにこ', true),
    ('その他', true)
ON CONFLICT (name) DO NOTHING;

-- RLS (Row Level Security) の基本ポリシー設定
ALTER TABLE public.ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to ips" ON public.ips FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update to ips" ON public.ips FOR ALL USING (true);

CREATE POLICY "Allow public access to projects" ON public.projects FOR ALL USING (true);
CREATE POLICY "Allow public access to project_ips" ON public.project_ips FOR ALL USING (true);
CREATE POLICY "Allow public access to audit_logs" ON public.audit_logs FOR ALL USING (true);
