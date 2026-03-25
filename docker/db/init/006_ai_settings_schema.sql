CREATE TABLE IF NOT EXISTS user_ai_generation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_type_id UUID NOT NULL REFERENCES business_types(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  template_name VARCHAR(120) NOT NULL DEFAULT '標準テンプレート',
  min_manager_per_shift INTEGER NOT NULL DEFAULT 1,
  night_rest_days INTEGER NOT NULL DEFAULT 1,
  include_pending_requests BOOLEAN NOT NULL DEFAULT TRUE,
  max_monthly_overtime_hours INTEGER NOT NULL DEFAULT 20,
  multi_store_weight INTEGER NOT NULL DEFAULT 50,
  labor_cost_weight INTEGER NOT NULL DEFAULT 50,
  request_priority_weight INTEGER NOT NULL DEFAULT 70,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, business_type_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_user_ai_generation_settings_user_id
  ON user_ai_generation_settings(user_id);
