INSERT INTO stores (business_type_id, code, name)
SELECT bt.id, seed.code, seed.name
FROM business_types bt
JOIN (
  VALUES
    ('hotel', 'shinagawa', '品川店'),
    ('hotel', 'yokohama', '横浜店'),
    ('hotel', 'haneda', '羽田店')
) AS seed(business_code, code, name)
  ON bt.code = seed.business_code
ON CONFLICT (code) DO NOTHING;

INSERT INTO staff (
  employee_code, business_type_id, store_id, full_name, employment_type_code, role_name,
  qualification_code, is_night_shift_available, is_multi_store_available, hourly_wage, joined_on
)
SELECT
  seed.employee_code,
  bt.id,
  s.id,
  seed.full_name,
  seed.employment_type_code,
  seed.role_name,
  seed.qualification_code,
  seed.is_night_shift_available,
  seed.is_multi_store_available,
  seed.hourly_wage,
  seed.joined_on
FROM business_types bt
JOIN (
  VALUES
    ('hotel', 'shinagawa', 'H001', '狩野', 'fulltime', 'フロント責任者', 'manager', false, true, 2300.00, '2022-04-01'::date),
    ('hotel', 'yokohama', 'H002', '大塚', 'fulltime', 'ナイト責任者', 'manager', true, true, 2400.00, '2021-10-01'::date),
    ('hotel', 'haneda', 'H003', '田中 優子', 'parttime', 'フロント', 'english', true, false, 1600.00, '2024-02-01'::date),
    ('hotel', 'shinagawa', 'H004', '山本 健太', 'fulltime', '夜勤担当', 'night', true, true, 2100.00, '2023-06-01'::date),
    ('hotel', 'yokohama', 'H005', '佐藤 美咲', 'fulltime', 'フロント', 'general', true, false, 2050.00, '2022-12-01'::date),
    ('hotel', 'shinagawa', 'H006', '鈴木 大輔', 'casual', 'フロント', 'night', true, false, 1450.00, '2025-01-15'::date)
) AS seed(
  business_code, store_code, employee_code, full_name, employment_type_code, role_name,
  qualification_code, is_night_shift_available, is_multi_store_available, hourly_wage, joined_on
)
  ON bt.code = seed.business_code
JOIN stores s
  ON s.code = seed.store_code
ON CONFLICT (employee_code) DO NOTHING;
