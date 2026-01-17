-- Create keywords table
CREATE TABLE IF NOT EXISTS keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  search_volume INT,
  difficulty INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create keyword research results table
CREATE TABLE IF NOT EXISTS keyword_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  related_keywords JSONB,
  people_also_ask JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create rank tracking table (with city-level support)
CREATE TABLE IF NOT EXISTS rank_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  keyword TEXT NOT NULL,
  position INT,
  location TEXT,
  city TEXT,
  country TEXT,
  device TEXT DEFAULT 'desktop',
  tracked_at TIMESTAMP DEFAULT NOW()
);

-- Add city and country columns if they don't exist (for migration)
ALTER TABLE rank_tracking ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE rank_tracking ADD COLUMN IF NOT EXISTS country TEXT;

-- Create SEO audits table
CREATE TABLE IF NOT EXISTS seo_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  title TEXT,
  meta_description TEXT,
  og_tags JSONB,
  twitter_tags JSONB,
  headings JSONB,
  images_without_alt INT,
  internal_links INT,
  external_links INT,
  broken_links INT,
  page_speed FLOAT,
  mobile_friendly BOOLEAN,
  schema_markup JSONB,
  ssl_enabled BOOLEAN,
  sitemap_valid BOOLEAN,
  robots_txt_valid BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create on-page SEO checks table
CREATE TABLE IF NOT EXISTS on_page_seo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  keyword TEXT NOT NULL,
  title_contains_keyword BOOLEAN,
  meta_contains_keyword BOOLEAN,
  headings_contain_keyword BOOLEAN,
  keyword_density FLOAT,
  content_length INT,
  readability_score INT,
  optimization_suggestions JSONB,
  competitor_analysis JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create competitors table
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  your_domain TEXT NOT NULL,
  competitor_domain TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create keyword gap analysis table
CREATE TABLE IF NOT EXISTS keyword_gap_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  your_domain TEXT NOT NULL,
  competitor_domain TEXT NOT NULL,
  competitor_keywords JSONB,
  missing_keywords JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_keywords_keyword ON keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_rank_tracking_domain ON rank_tracking(domain);
CREATE INDEX IF NOT EXISTS idx_rank_tracking_domain_keyword ON rank_tracking(domain, keyword);
CREATE INDEX IF NOT EXISTS idx_seo_audits_url ON seo_audits(url);
CREATE INDEX IF NOT EXISTS idx_on_page_seo_url_keyword ON on_page_seo(url, keyword);
CREATE INDEX IF NOT EXISTS idx_competitors_domains ON competitors(your_domain, competitor_domain);
