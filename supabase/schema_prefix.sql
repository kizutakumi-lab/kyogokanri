-- 既存の Supabase DBプロジェクトに同居させるためのSQL (テーブル接頭辞: conflict_)

-- 1. IPマスタテーブル
CREATE TABLE IF NOT EXISTS public.conflict_ips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 案件テーブル
CREATE TABLE IF NOT EXISTS public.conflict_projects (
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
CREATE TABLE IF NOT EXISTS public.conflict_project_ips (
    project_id UUID REFERENCES public.conflict_projects(id) ON DELETE CASCADE,
    ip_id UUID REFERENCES public.conflict_ips(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, ip_id)
);

-- 4. 操作ログテーブル
CREATE TABLE IF NOT EXISTS public.conflict_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.conflict_projects(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    user_name TEXT DEFAULT '営業担当',
    user_email TEXT DEFAULT 'user@company.com',
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 初期IPマスタの登録
INSERT INTO public.conflict_ips (name, active) VALUES
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

-- RLS 設定
ALTER TABLE public.conflict_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflict_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflict_project_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflict_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to conflict_ips" ON public.conflict_ips FOR ALL USING (true);
CREATE POLICY "Allow public access to conflict_projects" ON public.conflict_projects FOR ALL USING (true);
CREATE POLICY "Allow public access to conflict_project_ips" ON public.conflict_project_ips FOR ALL USING (true);
CREATE POLICY "Allow public access to conflict_audit_logs" ON public.conflict_audit_logs FOR ALL USING (true);
