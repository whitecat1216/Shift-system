INSERT INTO labor_budget_settings (
  business_type_id,
  store_id,
  month_label,
  budget_amount,
  updated_by
)
SELECT
  bt.id,
  s.id,
  '2026年3月',
  seed.budget_amount,
  u.id
FROM (
  VALUES
    ('hotel', 'shinagawa', 4430000.00, 'admin@example.com'),
    ('hotel', 'yokohama', 3180000.00, 'admin@example.com'),
    ('restaurant', 'shibuya', 1860000.00, 'restaurant.manager@example.com')
) AS seed(business_code, store_code, budget_amount, updated_by_email)
INNER JOIN business_types bt ON bt.code = seed.business_code
INNER JOIN stores s ON s.business_type_id = bt.id AND s.code = seed.store_code
INNER JOIN users u ON u.email = seed.updated_by_email
ON CONFLICT (business_type_id, store_id, month_label) DO NOTHING;
