BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS dim_company (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  tax_id text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dim_region (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  state_code text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dim_store (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  company_id uuid REFERENCES dim_company(id),
  region_id uuid REFERENCES dim_region(id),
  operation text NOT NULL,
  state_code text,
  commercial boolean NOT NULL DEFAULT true,
  participates_in_goals boolean NOT NULL DEFAULT true,
  participates_in_ranking boolean NOT NULL DEFAULT true,
  opened_on date,
  closed_on date,
  active boolean NOT NULL DEFAULT true,
  source_aliases jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dim_person (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_key text NOT NULL UNIQUE,
  name text NOT NULL,
  email text,
  role_name text,
  store_id uuid REFERENCES dim_store(id),
  valid_from date NOT NULL DEFAULT CURRENT_DATE,
  valid_to date,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dim_indicator (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  label text NOT NULL,
  domain text NOT NULL,
  operation text,
  unit text NOT NULL,
  direction text NOT NULL,
  description text NOT NULL,
  original_measure text,
  original_dax text,
  canonical_formula text NOT NULL,
  lifecycle text NOT NULL DEFAULT 'draft',
  valid_from date NOT NULL DEFAULT CURRENT_DATE,
  valid_to date,
  owner text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(code, version)
);

CREATE TABLE IF NOT EXISTS dim_source (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  domain text NOT NULL,
  operation text,
  drive_id text,
  source_path text,
  table_or_sheet text,
  expected_grain text NOT NULL,
  frequency text NOT NULL,
  owner text,
  sensitivity text NOT NULL DEFAULT 'internal',
  status text NOT NULL DEFAULT 'pending_connection',
  last_successful_run_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fact_metric_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date date NOT NULL,
  store_id uuid REFERENCES dim_store(id),
  indicator_id uuid NOT NULL REFERENCES dim_indicator(id),
  source_id uuid REFERENCES dim_source(id),
  realized numeric(20, 4) NOT NULL,
  goal numeric(20, 4),
  trend numeric(20, 4),
  comparison numeric(20, 4),
  quality_score numeric(8, 6) NOT NULL DEFAULT 1,
  pending_records integer NOT NULL DEFAULT 0,
  pending_value numeric(20, 4) NOT NULL DEFAULT 0,
  is_closed boolean NOT NULL DEFAULT false,
  dimensions jsonb NOT NULL DEFAULT '{}'::jsonb,
  loaded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(metric_date, store_id, indicator_id, source_id, dimensions)
);

CREATE TABLE IF NOT EXISTS fact_ingestion_run (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES dim_source(id),
  cursor_before text,
  cursor_after text,
  started_at timestamptz NOT NULL,
  finished_at timestamptz,
  status text NOT NULL,
  files_seen integer NOT NULL DEFAULT 0,
  files_processed integer NOT NULL DEFAULT 0,
  rows_received bigint NOT NULL DEFAULT 0,
  rows_valid bigint NOT NULL DEFAULT 0,
  rows_rejected bigint NOT NULL DEFAULT 0,
  checksum text,
  error_message text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS fact_quality_issue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES dim_source(id),
  store_id uuid REFERENCES dim_store(id),
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  record_count integer NOT NULL DEFAULT 0,
  financial_impact numeric(20, 4) NOT NULL DEFAULT 0,
  severity text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  owner text,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  opened_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS fact_action_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id uuid REFERENCES dim_indicator(id),
  store_id uuid REFERENCES dim_store(id),
  quality_issue_id uuid REFERENCES fact_quality_issue(id),
  title text NOT NULL,
  description text NOT NULL,
  impact numeric(20, 4) NOT NULL DEFAULT 0,
  priority text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  owner text NOT NULL,
  due_at timestamptz NOT NULL,
  evidence_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS app_user_scope (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  role_name text NOT NULL,
  scope_type text NOT NULL,
  scope_id text,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  request_id text,
  before_state jsonb,
  after_state jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metric_daily_date ON fact_metric_daily(metric_date);
CREATE INDEX IF NOT EXISTS idx_metric_daily_store ON fact_metric_daily(store_id);
CREATE INDEX IF NOT EXISTS idx_quality_open ON fact_quality_issue(status, severity);
CREATE INDEX IF NOT EXISTS idx_action_due ON fact_action_plan(status, due_at);
CREATE INDEX IF NOT EXISTS idx_user_scope_email ON app_user_scope(user_email);

COMMIT;
