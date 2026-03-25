ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS adjustment_note TEXT;

CREATE INDEX IF NOT EXISTS idx_leave_requests_reviewed_by
  ON leave_requests(reviewed_by);
