INSERT INTO roles (code, name)
VALUES
  ('admin', '管理者'),
  ('manager', '担当者')
ON CONFLICT (code) DO NOTHING;

INSERT INTO page_permissions (code, name, path)
VALUES
  ('dashboard', 'ダッシュボード', '/dashboard'),
  ('ai_shift', 'AIシフト生成', '/ai-shift'),
  ('multi_store', '2店舗統合シフト', '/multi-store'),
  ('shifts', 'シフト表', '/shifts'),
  ('requests', '申請一覧', '/requests'),
  ('leave_control', '有給・希望休管理', '/leave-control'),
  ('leave_balance', '有給残日数管理', '/leave-balance'),
  ('labor_cost', '人件費管理', '/labor-cost'),
  ('staff', 'スタッフ管理', '/staff')
ON CONFLICT (code) DO NOTHING;

INSERT INTO users (email, password_salt, password_hash, display_name, is_active)
VALUES
  (
    'admin@example.com',
    '3a4cd5cdc90740e765cb7d19876bcd31',
    '37082657c25362115ceee0ebec8d1a2a7d9a44a9a27bd09d6469f711238ea63169eec9f9a16c1eaab5d0f050459cd30c332bec0ca23ba11ac292943ceaac63ed',
    '全体管理者',
    TRUE
  ),
  (
    'hotel.manager@example.com',
    'd86e5d992f9cab3f1c5b7b1d2a33377e',
    '1d4b3bd947882e489adfa6757c1ac998e5acec80866ef85e04c4ebfb27f69b98bc5835c6b872307ecb34e30f70b4e0c7e398a4172d7152944ce9d724590ad598',
    'ホテル担当',
    TRUE
  ),
  (
    'restaurant.manager@example.com',
    '47a9992b1f7b9cd94ba44d9463df3c9d',
    '5f1f069353a91ccc07eec1ed1401d9e1e8b788b56228171154afe2b995102f099fb3643ece274e0a2ac591f2da7ce3b4a851ce9c340898b9849efa2ce0ae80f4',
    '飲食担当',
    TRUE
  )
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r
  ON (
    (u.email = 'admin@example.com' AND r.code = 'admin')
    OR (u.email IN ('hotel.manager@example.com', 'restaurant.manager@example.com') AND r.code = 'manager')
  )
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO user_business_access (user_id, business_type_id)
SELECT u.id, bt.id
FROM users u
JOIN business_types bt
  ON (
    u.email = 'admin@example.com'
    OR (u.email = 'hotel.manager@example.com' AND bt.code = 'hotel')
    OR (u.email = 'restaurant.manager@example.com' AND bt.code = 'restaurant')
  )
ON CONFLICT (user_id, business_type_id) DO NOTHING;

INSERT INTO user_page_access (user_id, page_permission_id)
SELECT u.id, pp.id
FROM users u
JOIN page_permissions pp
  ON (
    u.email = 'admin@example.com'
    OR (
      u.email = 'hotel.manager@example.com'
      AND pp.code IN ('dashboard', 'ai_shift', 'shifts', 'requests', 'leave_control', 'leave_balance', 'staff')
    )
    OR (
      u.email = 'restaurant.manager@example.com'
      AND pp.code IN ('dashboard', 'shifts', 'requests', 'staff')
    )
  )
ON CONFLICT (user_id, page_permission_id) DO NOTHING;

INSERT INTO user_store_access (user_id, store_id)
SELECT u.id, s.id
FROM users u
JOIN stores s
  ON (
    u.email = 'admin@example.com'
    OR (u.email = 'hotel.manager@example.com' AND s.code IN ('shinagawa', 'yokohama'))
    OR (u.email = 'restaurant.manager@example.com' AND s.code = 'shibuya')
  )
ON CONFLICT (user_id, store_id) DO NOTHING;
