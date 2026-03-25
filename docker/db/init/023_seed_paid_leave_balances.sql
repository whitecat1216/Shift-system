INSERT INTO paid_leave_balances (
  staff_id,
  granted_on,
  expires_on,
  granted_days,
  used_days,
  remaining_days
)
SELECT
  st.id,
  seed.granted_on,
  seed.expires_on,
  seed.granted_days,
  seed.used_days,
  seed.remaining_days
FROM (
  VALUES
    ('H001', '2025-10-01'::date, '2027-09-30'::date, 13.0, 1.0, 12.0),
    ('H002', '2025-04-01'::date, '2027-03-31'::date, 6.0, 2.0, 4.0),
    ('H003', '2025-07-01'::date, '2027-06-30'::date, 7.0, 0.0, 7.0),
    ('H005', '2025-01-01'::date, '2026-12-31'::date, 3.0, 1.0, 2.0),
    ('R001', '2025-09-01'::date, '2027-08-31'::date, 11.0, 2.0, 9.0),
    ('R003', '2025-05-01'::date, '2027-04-30'::date, 8.0, 1.0, 7.0),
    ('R004', '2025-12-01'::date, '2027-11-30'::date, 5.0, 0.0, 5.0)
) AS seed(employee_code, granted_on, expires_on, granted_days, used_days, remaining_days)
INNER JOIN staff st ON st.employee_code = seed.employee_code;
