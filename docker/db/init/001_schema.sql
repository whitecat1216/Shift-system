CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS business_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ui_label_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type_id UUID NOT NULL REFERENCES business_types(id) ON DELETE CASCADE,
  label_key VARCHAR(64) NOT NULL,
  label_value VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_type_id, label_key)
);

CREATE TABLE IF NOT EXISTS employment_type_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type_id UUID NOT NULL REFERENCES business_types(id) ON DELETE CASCADE,
  code VARCHAR(32) NOT NULL,
  name VARCHAR(64) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_type_id, code)
);

CREATE TABLE IF NOT EXISTS qualification_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type_id UUID NOT NULL REFERENCES business_types(id) ON DELETE CASCADE,
  code VARCHAR(32) NOT NULL,
  name VARCHAR(64) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_type_id, code)
);

CREATE TABLE IF NOT EXISTS request_type_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type_id UUID NOT NULL REFERENCES business_types(id) ON DELETE CASCADE,
  code VARCHAR(32) NOT NULL,
  name VARCHAR(64) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_type_id, code)
);

CREATE TABLE IF NOT EXISTS shift_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type_id UUID NOT NULL REFERENCES business_types(id) ON DELETE CASCADE,
  code VARCHAR(16) NOT NULL,
  name VARCHAR(64) NOT NULL,
  short_name VARCHAR(16) NOT NULL,
  starts_at TIME,
  ends_at TIME,
  default_hours NUMERIC(5, 2) NOT NULL DEFAULT 0,
  color_token VARCHAR(32),
  is_time_off BOOLEAN NOT NULL DEFAULT FALSE,
  is_unassigned BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_type_id, code)
);

CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type_id UUID NOT NULL REFERENCES business_types(id) ON DELETE CASCADE,
  code VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Tokyo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code VARCHAR(32) NOT NULL UNIQUE,
  business_type_id UUID NOT NULL REFERENCES business_types(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  full_name VARCHAR(120) NOT NULL,
  employment_type_code VARCHAR(32) NOT NULL,
  role_name VARCHAR(64) NOT NULL,
  qualification_code VARCHAR(32),
  is_night_shift_available BOOLEAN NOT NULL DEFAULT FALSE,
  is_multi_store_available BOOLEAN NOT NULL DEFAULT FALSE,
  hourly_wage NUMERIC(10, 2),
  joined_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shift_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  target_date DATE NOT NULL,
  shift_type_id UUID NOT NULL REFERENCES shift_types(id) ON DELETE CASCADE,
  required_headcount INTEGER NOT NULL CHECK (required_headcount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, target_date, shift_type_id)
);

CREATE TABLE IF NOT EXISTS shift_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  target_date DATE NOT NULL,
  shift_type_id UUID NOT NULL REFERENCES shift_types(id) ON DELETE CASCADE,
  status VARCHAR(24) NOT NULL DEFAULT 'draft',
  source VARCHAR(24) NOT NULL DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (staff_id, target_date)
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  request_type_id UUID NOT NULL REFERENCES request_type_master(id) ON DELETE CASCADE,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'pending',
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_on >= starts_on)
);

CREATE TABLE IF NOT EXISTS paid_leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  granted_on DATE NOT NULL,
  expires_on DATE,
  granted_days NUMERIC(5, 2) NOT NULL DEFAULT 0,
  used_days NUMERIC(5, 2) NOT NULL DEFAULT 0,
  remaining_days NUMERIC(5, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ui_label_master_business_type_id
  ON ui_label_master(business_type_id);
CREATE INDEX IF NOT EXISTS idx_request_type_master_business_type_id
  ON request_type_master(business_type_id);
CREATE INDEX IF NOT EXISTS idx_shift_types_business_type_id
  ON shift_types(business_type_id);
CREATE INDEX IF NOT EXISTS idx_stores_business_type_id
  ON stores(business_type_id);
CREATE INDEX IF NOT EXISTS idx_staff_business_type_id
  ON staff(business_type_id);
CREATE INDEX IF NOT EXISTS idx_staff_store_id
  ON staff(store_id);
CREATE INDEX IF NOT EXISTS idx_shift_requirements_store_date
  ON shift_requirements(store_id, target_date);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_store_date
  ON shift_assignments(store_id, target_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_staff_status
  ON leave_requests(staff_id, status);
