-- CardLink データベーススキーマ
-- Supabase で実行してください

-- タグテーブル
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 会社テーブル
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  name_kana TEXT,
  industry TEXT,
  phone TEXT,
  email TEXT,
  postal_code TEXT,
  address TEXT,
  website TEXT,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 名刺テーブル
CREATE TABLE IF NOT EXISTS business_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  name_kana TEXT,
  company_name TEXT,
  company_name_kana TEXT,
  department TEXT,
  position TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  fax TEXT,
  postal_code TEXT,
  address TEXT,
  website TEXT,
  front_image_url TEXT,
  back_image_url TEXT,
  exchange_date DATE,
  memo TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 名刺タグ中間テーブル
CREATE TABLE IF NOT EXISTS card_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES business_cards(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(card_id, tag_id)
);

-- 交流履歴テーブル
CREATE TABLE IF NOT EXISTS contact_histories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_id UUID REFERENCES business_cards(id) ON DELETE CASCADE NOT NULL,
  contact_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  content TEXT,
  next_contact_date TIMESTAMPTZ,
  next_contact_memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 変更履歴テーブル
CREATE TABLE IF NOT EXISTS card_change_histories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID REFERENCES business_cards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- マイ名刺テーブル
CREATE TABLE IF NOT EXISTS my_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT,
  department TEXT,
  position TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  postal_code TEXT,
  address TEXT,
  website TEXT,
  sns_twitter TEXT,
  sns_linkedin TEXT,
  sns_facebook TEXT,
  logo_url TEXT,
  photo_url TEXT,
  template_id TEXT DEFAULT 'simple-white',
  design_config JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) ポリシー設定
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_change_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE my_cards ENABLE ROW LEVEL SECURITY;

-- tagsポリシー
DROP POLICY IF EXISTS "Users can manage own tags" ON tags;
CREATE POLICY "Users can manage own tags" ON tags
  FOR ALL USING (auth.uid() = user_id);

-- companiesポリシー
DROP POLICY IF EXISTS "Users can manage own companies" ON companies;
CREATE POLICY "Users can manage own companies" ON companies
  FOR ALL USING (auth.uid() = user_id);

-- business_cardsポリシー
DROP POLICY IF EXISTS "Users can manage own cards" ON business_cards;
CREATE POLICY "Users can manage own cards" ON business_cards
  FOR ALL USING (auth.uid() = user_id);

-- card_tagsポリシー
DROP POLICY IF EXISTS "Users can manage own card_tags" ON card_tags;
CREATE POLICY "Users can manage own card_tags" ON card_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM business_cards
      WHERE business_cards.id = card_tags.card_id
      AND business_cards.user_id = auth.uid()
    )
  );

-- contact_historiesポリシー
DROP POLICY IF EXISTS "Users can manage own contact_histories" ON contact_histories;
CREATE POLICY "Users can manage own contact_histories" ON contact_histories
  FOR ALL USING (auth.uid() = user_id);

-- card_change_historiesポリシー
DROP POLICY IF EXISTS "Users can manage own card_change_histories" ON card_change_histories;
CREATE POLICY "Users can manage own card_change_histories" ON card_change_histories
  FOR ALL USING (auth.uid() = user_id);

-- my_cardsポリシー
DROP POLICY IF EXISTS "Users can manage own my_cards" ON my_cards;
CREATE POLICY "Users can manage own my_cards" ON my_cards
  FOR ALL USING (auth.uid() = user_id);

-- updated_at自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガー設定
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_cards_updated_at ON business_cards;
CREATE TRIGGER update_business_cards_updated_at
  BEFORE UPDATE ON business_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_histories_updated_at ON contact_histories;
CREATE TRIGGER update_contact_histories_updated_at
  BEFORE UPDATE ON contact_histories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_my_cards_updated_at ON my_cards;
CREATE TRIGGER update_my_cards_updated_at
  BEFORE UPDATE ON my_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- インデックス
CREATE INDEX IF NOT EXISTS idx_business_cards_user_id ON business_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_business_cards_name_kana ON business_cards(name_kana);
CREATE INDEX IF NOT EXISTS idx_business_cards_company_name ON business_cards(company_name);
CREATE INDEX IF NOT EXISTS idx_business_cards_is_favorite ON business_cards(is_favorite);
CREATE INDEX IF NOT EXISTS idx_card_tags_card_id ON card_tags(card_id);
CREATE INDEX IF NOT EXISTS idx_card_tags_tag_id ON card_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_contact_histories_card_id ON contact_histories(card_id);

-- Storageバケット設定 (Supabase Dashboardで設定するか、以下をAPIで実行)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('card-images', 'card-images', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('my-card-assets', 'my-card-assets', false);
