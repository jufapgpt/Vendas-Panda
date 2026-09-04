BEGIN;

CREATE TABLE IF NOT EXISTS source_cursor (
  source_id uuid PRIMARY KEY REFERENCES dim_source(id) ON DELETE CASCADE,
  delta_link text,
  last_seen_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS source_file_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES dim_source(id) ON DELETE CASCADE,
  drive_item_id text NOT NULL,
  file_name text NOT NULL,
  source_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  etag text,
  ctag text,
  content_hash text,
  modified_at timestamptz,
  deleted_at timestamptz,
  last_run_id uuid REFERENCES fact_ingestion_run(id),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_id, drive_item_id)
);

CREATE TABLE IF NOT EXISTS staging_record (
  id bigserial PRIMARY KEY,
  run_id uuid NOT NULL REFERENCES fact_ingestion_run(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES dim_source(id) ON DELETE CASCADE,
  file_state_id uuid REFERENCES source_file_state(id) ON DELETE SET NULL,
  sheet_name text,
  row_number bigint NOT NULL,
  record_key text,
  raw_payload jsonb NOT NULL,
  normalized_payload jsonb,
  validation_state text NOT NULL DEFAULT 'received',
  validation_errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  loaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fact_reconciliation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id uuid NOT NULL REFERENCES dim_indicator(id),
  reference_date date NOT NULL,
  scope_type text NOT NULL,
  scope_id text,
  baseline_source text NOT NULL,
  baseline_value numeric(20, 4) NOT NULL,
  candidate_value numeric(20, 4) NOT NULL,
  absolute_difference numeric(20, 4) NOT NULL,
  relative_difference numeric(20, 8),
  tolerance_absolute numeric(20, 4) NOT NULL DEFAULT 0,
  tolerance_relative numeric(20, 8) NOT NULL DEFAULT 0,
  status text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  reconciled_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outbox_event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id text,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_source_file_source_modified ON source_file_state(source_id, modified_at DESC);
CREATE INDEX IF NOT EXISTS idx_staging_run ON staging_record(run_id, source_id);
CREATE INDEX IF NOT EXISTS idx_staging_validation ON staging_record(source_id, validation_state);
CREATE INDEX IF NOT EXISTS idx_reconciliation_status ON fact_reconciliation(status, reference_date DESC);
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox_event(status, available_at);

COMMIT;
