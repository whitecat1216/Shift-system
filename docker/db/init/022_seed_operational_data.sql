WITH hotel_days AS (
  SELECT generate_series('2026-03-01'::date, '2026-03-31'::date, '1 day'::interval)::date AS target_date
)
INSERT INTO shift_requirements (store_id, target_date, shift_type_id, required_headcount)
SELECT
  s.id,
  d.target_date,
  st.id,
  CASE
    WHEN s.code = 'shinagawa' AND st.code = 'A' THEN (ARRAY[2,5,4,3,3,3,4,4,4,5,4,2])[((EXTRACT(DAY FROM d.target_date)::int - 1) % 12) + 1]
    WHEN s.code = 'shinagawa' AND st.code = 'B' THEN (ARRAY[3,4,4,4,2,3,4,4,4,4,3,2])[((EXTRACT(DAY FROM d.target_date)::int - 1) % 12) + 1]
    WHEN s.code = 'shinagawa' AND st.code = 'N' THEN (ARRAY[2,2,2,2,2,2,3,2,2,3,2,2])[((EXTRACT(DAY FROM d.target_date)::int - 1) % 12) + 1]
    WHEN s.code = 'yokohama' AND st.code = 'A' THEN (ARRAY[2,3,3,3,2,2,3,3,2,3,3,2])[((EXTRACT(DAY FROM d.target_date)::int - 1) % 12) + 1]
    WHEN s.code = 'yokohama' AND st.code = 'B' THEN (ARRAY[2,2,3,2,2,2,3,2,2,2,2,2])[((EXTRACT(DAY FROM d.target_date)::int - 1) % 12) + 1]
    WHEN s.code = 'yokohama' AND st.code = 'N' THEN (ARRAY[1,1,1,1,1,1,2,1,1,1,1,1])[((EXTRACT(DAY FROM d.target_date)::int - 1) % 12) + 1]
    WHEN s.code = 'haneda' AND st.code = 'A' THEN (ARRAY[1,2,2,2,1,1,2,2,2,2,2,1])[((EXTRACT(DAY FROM d.target_date)::int - 1) % 12) + 1]
    WHEN s.code = 'haneda' AND st.code = 'B' THEN (ARRAY[1,2,2,2,1,1,2,2,1,2,2,1])[((EXTRACT(DAY FROM d.target_date)::int - 1) % 12) + 1]
    WHEN s.code = 'haneda' AND st.code = 'N' THEN 1
  END
FROM stores s
INNER JOIN business_types bt ON bt.id = s.business_type_id AND bt.code = 'hotel'
INNER JOIN shift_types st ON st.business_type_id = bt.id AND st.code IN ('A', 'B', 'N')
CROSS JOIN hotel_days d
ON CONFLICT (store_id, target_date, shift_type_id) DO NOTHING;

WITH restaurant_days AS (
  SELECT generate_series('2026-03-01'::date, '2026-03-31'::date, '1 day'::interval)::date AS target_date
)
INSERT INTO shift_requirements (store_id, target_date, shift_type_id, required_headcount)
SELECT
  s.id,
  d.target_date,
  st.id,
  CASE
    WHEN s.code = 'shibuya' AND st.code = 'OP' THEN (ARRAY[3,3,2,2,2,3,4])[((EXTRACT(DAY FROM d.target_date)::int - 1) % 7) + 1]
    WHEN s.code = 'shibuya' AND st.code = 'MD' THEN (ARRAY[4,4,3,3,3,4,5])[((EXTRACT(DAY FROM d.target_date)::int - 1) % 7) + 1]
    WHEN s.code = 'shibuya' AND st.code = 'CL' THEN (ARRAY[3,3,2,2,2,4,4])[((EXTRACT(DAY FROM d.target_date)::int - 1) % 7) + 1]
    WHEN s.code = 'shinjuku' AND st.code = 'OP' THEN (ARRAY[2,2,2,2,2,3,3])[((EXTRACT(DAY FROM d.target_date)::int - 1) % 7) + 1]
    WHEN s.code = 'shinjuku' AND st.code = 'MD' THEN (ARRAY[3,3,3,3,3,4,4])[((EXTRACT(DAY FROM d.target_date)::int - 1) % 7) + 1]
    WHEN s.code = 'shinjuku' AND st.code = 'CL' THEN (ARRAY[2,2,2,2,2,3,3])[((EXTRACT(DAY FROM d.target_date)::int - 1) % 7) + 1]
    WHEN s.code = 'ikebukuro' AND st.code = 'OP' THEN (ARRAY[2,1,1,1,1,2,2])[((EXTRACT(DAY FROM d.target_date)::int - 1) % 7) + 1]
    WHEN s.code = 'ikebukuro' AND st.code = 'MD' THEN (ARRAY[2,2,2,2,2,3,3])[((EXTRACT(DAY FROM d.target_date)::int - 1) % 7) + 1]
    WHEN s.code = 'ikebukuro' AND st.code = 'CL' THEN (ARRAY[1,1,1,1,1,2,2])[((EXTRACT(DAY FROM d.target_date)::int - 1) % 7) + 1]
  END
FROM stores s
INNER JOIN business_types bt ON bt.id = s.business_type_id AND bt.code = 'restaurant'
INNER JOIN shift_types st ON st.business_type_id = bt.id AND st.code IN ('OP', 'MD', 'CL')
CROSS JOIN restaurant_days d
ON CONFLICT (store_id, target_date, shift_type_id) DO NOTHING;

WITH hotel_assignment_patterns AS (
  SELECT *
  FROM (
    VALUES
      ('H001', ARRAY['UNASSIGNED','A','A','UNASSIGNED','UNASSIGNED','UNASSIGNED','UNASSIGNED','UNASSIGNED','A','A','UNASSIGNED','UNASSIGNED']::text[]),
      ('H002', ARRAY['OFF','OFF','A','B','N','A','B','OFF','OFF','N','A','B']::text[]),
      ('H003', ARRAY['B','OFF','OFF','N','A','B','N','A','OFF','OFF','B','N']::text[]),
      ('H004', ARRAY['N','A','OFF','OFF','B','N','A','B','N','OFF','OFF','A']::text[]),
      ('H005', ARRAY['A','B','N','OFF','OFF','A','B','N','A','B','OFF','OFF']::text[]),
      ('H006', ARRAY['B','N','A','B','OFF','OFF','N','A','B','N','A','OFF']::text[])
  ) AS source(employee_code, pattern)
),
hotel_days AS (
  SELECT generate_series('2026-03-01'::date, '2026-03-31'::date, '1 day'::interval)::date AS target_date
)
INSERT INTO shift_assignments (store_id, staff_id, target_date, shift_type_id, status, source)
SELECT
  st.store_id,
  st.id,
  d.target_date,
  shift_types.id,
  'draft',
  'seed'
FROM staff st
INNER JOIN hotel_assignment_patterns hp ON hp.employee_code = st.employee_code
INNER JOIN business_types bt ON bt.id = st.business_type_id AND bt.code = 'hotel'
CROSS JOIN hotel_days d
INNER JOIN shift_types
  ON shift_types.business_type_id = bt.id
  AND shift_types.code = hp.pattern[((EXTRACT(DAY FROM d.target_date)::int - 1) % 12) + 1]
ON CONFLICT (staff_id, target_date) DO NOTHING;

WITH restaurant_assignment_patterns AS (
  SELECT *
  FROM (
    VALUES
      ('R001', ARRAY['OP','MD','MD','UNASSIGNED','OP','OFF','OFF']::text[]),
      ('R002', ARRAY['MD','CL','OFF','OP','MD','CL','OFF']::text[]),
      ('R003', ARRAY['CL','MD','OP','OFF','MD','CL','OP']::text[]),
      ('R004', ARRAY['OP','MD','OFF','OP','MD','OFF','OFF']::text[]),
      ('R005', ARRAY['OFF','CL','MD','CL','OFF','MD','CL']::text[])
  ) AS source(employee_code, pattern)
),
restaurant_days AS (
  SELECT generate_series('2026-03-01'::date, '2026-03-31'::date, '1 day'::interval)::date AS target_date
)
INSERT INTO shift_assignments (store_id, staff_id, target_date, shift_type_id, status, source)
SELECT
  st.store_id,
  st.id,
  d.target_date,
  shift_types.id,
  'draft',
  'seed'
FROM staff st
INNER JOIN restaurant_assignment_patterns rp ON rp.employee_code = st.employee_code
INNER JOIN business_types bt ON bt.id = st.business_type_id AND bt.code = 'restaurant'
CROSS JOIN restaurant_days d
INNER JOIN shift_types
  ON shift_types.business_type_id = bt.id
  AND shift_types.code = rp.pattern[((EXTRACT(DAY FROM d.target_date)::int - 1) % 7) + 1]
ON CONFLICT (staff_id, target_date) DO NOTHING;

INSERT INTO leave_requests (staff_id, request_type_id, starts_on, ends_on, status, reason)
SELECT st.id, rtm.id, seed.starts_on, seed.ends_on, seed.status, seed.reason
FROM (
  VALUES
    ('H006', 'preferred_leave', '2026-03-07'::date, '2026-03-08'::date, 'approved', '私用'),
    ('H003', 'preferred_leave', '2026-03-12'::date, '2026-03-12'::date, 'pending', '通院'),
    ('H004', 'preferred_leave', '2026-03-29'::date, '2026-03-29'::date, 'adjusting', '研修'),
    ('H002', 'paid_leave', '2026-03-22'::date, '2026-03-23'::date, 'pending', '家族都合'),
    ('R002', 'preferred_off', '2026-03-06'::date, '2026-03-07'::date, 'pending', '帰省'),
    ('R003', 'vacation', '2026-03-14'::date, '2026-03-14'::date, 'approved', '私用'),
    ('R005', 'preferred_off', '2026-03-21'::date, '2026-03-22'::date, 'adjusting', '試験')
) AS seed(employee_code, request_type_code, starts_on, ends_on, status, reason)
INNER JOIN staff st ON st.employee_code = seed.employee_code
INNER JOIN request_type_master rtm
  ON rtm.business_type_id = st.business_type_id
  AND rtm.code = seed.request_type_code
ON CONFLICT DO NOTHING;
