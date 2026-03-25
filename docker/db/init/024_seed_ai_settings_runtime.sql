INSERT INTO user_ai_generation_settings (
  user_id,
  business_type_id,
  store_id,
  template_name,
  min_manager_per_shift,
  night_rest_days,
  include_pending_requests,
  max_monthly_overtime_hours,
  multi_store_weight,
  labor_cost_weight,
  request_priority_weight
)
SELECT
  u.id,
  bt.id,
  s.id,
  seed.template_name,
  seed.min_manager_per_shift,
  seed.night_rest_days,
  seed.include_pending_requests,
  seed.max_monthly_overtime_hours,
  seed.multi_store_weight,
  seed.labor_cost_weight,
  seed.request_priority_weight
FROM (
  VALUES
    ('admin@example.com', 'hotel', 'shinagawa', '標準テンプレート', 1, 1, true, 20, 55, 50, 70),
    ('hotel.manager@example.com', 'hotel', 'shinagawa', 'ホテル標準', 1, 1, true, 18, 40, 55, 85),
    ('restaurant.manager@example.com', 'restaurant', 'shibuya', '店舗優先', 1, 0, true, 24, 65, 60, 60)
) AS seed(email, business_code, store_code, template_name, min_manager_per_shift, night_rest_days, include_pending_requests, max_monthly_overtime_hours, multi_store_weight, labor_cost_weight, request_priority_weight)
INNER JOIN users u ON u.email = seed.email
INNER JOIN business_types bt ON bt.code = seed.business_code
INNER JOIN stores s ON s.business_type_id = bt.id AND s.code = seed.store_code
ON CONFLICT (user_id, business_type_id, store_id) DO NOTHING;
