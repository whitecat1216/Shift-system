CREATE TABLE IF NOT EXISTS ai_plan_adoption_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_type_id UUID NOT NULL REFERENCES business_types(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  month_label VARCHAR(16) NOT NULL,
  plan_id VARCHAR(32) NOT NULL,
  plan_name VARCHAR(120) NOT NULL,
  fill_rate INTEGER NOT NULL,
  overtime_delta INTEGER NOT NULL,
  violations INTEGER NOT NULL,
  notes TEXT,
  adopted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_plan_adoption_history_user_month
  ON ai_plan_adoption_history(user_id, month_label, adopted_at DESC);

CREATE TABLE IF NOT EXISTS labor_budget_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type_id UUID NOT NULL REFERENCES business_types(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  month_label VARCHAR(16) NOT NULL,
  budget_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_type_id, store_id, month_label)
);
