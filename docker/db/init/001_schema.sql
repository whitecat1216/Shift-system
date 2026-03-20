CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Tokyo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_code VARCHAR(32) NOT NULL UNIQUE,
  store_id UUID REFERENCES stores(id),
  full_name VARCHAR(120) NOT NULL,
  employment_type VARCHAR(32) NOT NULL,
  role_name VARCHAR(64) NOT NULL,
  is_night_shift_available BOOLEAN NOT NULL DEFAULT FALSE,
  is_multi_store_available BOOLEAN NOT NULL DEFAULT FALSE,
  hourly_wage NUMERIC(10, 2),
  joined_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shift_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(16) NOT NULL UNIQUE,
  name VARCHAR(64) NOT NULL,
  starts_at TIME,
  ends_at TIME,
  color_token VARCHAR(32),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shift_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  target_date DATE NOT NULL,
  shift_type_id UUID NOT NULL REFERENCES shift_types(id),
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
  shift_type_id UUID NOT NULL REFERENCES shift_types(id),
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
  request_type VARCHAR(24) NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_staff_store_id ON staff(store_id);
CREATE INDEX IF NOT EXISTS idx_shift_requirements_store_date ON shift_requirements(store_id, target_date);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_store_date ON shift_assignments(store_id, target_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_staff_status ON leave_requests(staff_id, status);

INSERT INTO stores (code, name)
VALUES
  ('shinagawa', '品川店'),
  ('yokohama', '横浜店'),
  ('haneda', '羽田店')
ON CONFLICT (code) DO NOTHING;

INSERT INTO shift_types (code, name, starts_at, ends_at, color_token, sort_order)
VALUES
  ('A', '早番', '07:00', '16:00', 'amber', 10),
  ('B', '中番', '13:00', '22:00', 'sky', 20),
  ('N', '夜勤', '22:00', '07:00', 'slate', 30),
  ('OFF', '休み', NULL, NULL, 'gray', 99)
ON CONFLICT (code) DO NOTHING;
