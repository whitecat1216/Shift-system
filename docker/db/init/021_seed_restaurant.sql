INSERT INTO stores (business_type_id, code, name)
SELECT bt.id, seed.code, seed.name
FROM business_types bt
JOIN (
  VALUES
    ('restaurant', 'shibuya', '渋谷店'),
    ('restaurant', 'shinjuku', '新宿店'),
    ('restaurant', 'ikebukuro', '池袋店')
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
    ('restaurant', 'shibuya', 'R001', '斎藤', 'fulltime', '店長', 'lead', false, true, 2100.00, '2022-03-01'::date),
    ('restaurant', 'shibuya', 'R002', '小林', 'casual', 'ホール', 'cashier', true, false, 1350.00, '2025-02-01'::date),
    ('restaurant', 'shinjuku', 'R003', '中村', 'fulltime', 'キッチン', 'cook', true, true, 1950.00, '2023-09-01'::date),
    ('restaurant', 'ikebukuro', 'R004', '高橋', 'parttime', 'ホール', 'general', false, false, 1280.00, '2024-07-01'::date),
    ('restaurant', 'shibuya', 'R005', '吉田', 'casual', 'キッチン', 'cook', true, false, 1400.00, '2025-01-10'::date)
) AS seed(
  business_code, store_code, employee_code, full_name, employment_type_code, role_name,
  qualification_code, is_night_shift_available, is_multi_store_available, hourly_wage, joined_on
)
  ON bt.code = seed.business_code
JOIN stores s
  ON s.code = seed.store_code
ON CONFLICT (employee_code) DO NOTHING;
