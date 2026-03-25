INSERT INTO business_types (code, name)
VALUES
  ('hotel', 'ホテル'),
  ('restaurant', '飲食店')
ON CONFLICT (code) DO NOTHING;

INSERT INTO ui_label_master (business_type_id, label_key, label_value)
SELECT bt.id, seed.label_key, seed.label_value
FROM business_types bt
JOIN (
  VALUES
    ('hotel', 'dashboard_title', 'ダッシュボード'),
    ('hotel', 'schedule_title', 'シフト表'),
    ('hotel', 'requests_title', '希望休一覧'),
    ('hotel', 'leave_control_title', '有給・希望休管理'),
    ('hotel', 'leave_balance_title', '有給残日数管理'),
    ('hotel', 'staff_title', 'スタッフ管理'),
    ('hotel', 'ai_title', 'AIシフト生成'),
    ('hotel', 'labor_cost_title', '人件費管理'),
    ('hotel', 'store_label', '店舗'),
    ('hotel', 'staff_label', 'スタッフ'),
    ('hotel', 'staff_plural_label', 'スタッフ'),
    ('hotel', 'request_single_label', '申請'),
    ('hotel', 'publish_label', '確定版を作成'),
    ('hotel', 'unpublish_label', '公開を解除'),
    ('hotel', 'published_label', '公開中'),
    ('hotel', 'draft_label', '下書き'),
    ('hotel', 'request_add_label', '申請を追加'),
    ('restaurant', 'dashboard_title', '勤務ダッシュボード'),
    ('restaurant', 'schedule_title', '勤務表'),
    ('restaurant', 'requests_title', '休み希望一覧'),
    ('restaurant', 'leave_control_title', '休暇・希望管理'),
    ('restaurant', 'leave_balance_title', '休暇残数管理'),
    ('restaurant', 'staff_title', 'クルー管理'),
    ('restaurant', 'ai_title', 'AI勤務生成'),
    ('restaurant', 'labor_cost_title', '人件費管理'),
    ('restaurant', 'store_label', '店舗'),
    ('restaurant', 'staff_label', 'クルー'),
    ('restaurant', 'staff_plural_label', 'クルー'),
    ('restaurant', 'request_single_label', '休暇申請'),
    ('restaurant', 'publish_label', '確定シフトを作成'),
    ('restaurant', 'unpublish_label', '公開を解除'),
    ('restaurant', 'published_label', '公開中'),
    ('restaurant', 'draft_label', '下書き'),
    ('restaurant', 'request_add_label', '休暇申請を追加')
) AS seed(business_code, label_key, label_value)
  ON bt.code = seed.business_code
ON CONFLICT (business_type_id, label_key) DO NOTHING;

INSERT INTO employment_type_master (business_type_id, code, name, sort_order)
SELECT bt.id, seed.code, seed.name, seed.sort_order
FROM business_types bt
JOIN (
  VALUES
    ('hotel', 'fulltime', '正社員', 10),
    ('hotel', 'parttime', 'パート', 20),
    ('hotel', 'casual', 'アルバイト', 30),
    ('restaurant', 'fulltime', '社員', 10),
    ('restaurant', 'parttime', 'パート', 20),
    ('restaurant', 'casual', 'アルバイト', 30)
) AS seed(business_code, code, name, sort_order)
  ON bt.code = seed.business_code
ON CONFLICT (business_type_id, code) DO NOTHING;

INSERT INTO qualification_master (business_type_id, code, name, sort_order)
SELECT bt.id, seed.code, seed.name, seed.sort_order
FROM business_types bt
JOIN (
  VALUES
    ('hotel', 'general', '一般', 10),
    ('hotel', 'english', '英語対応', 20),
    ('hotel', 'night', '夜勤可', 30),
    ('hotel', 'manager', '責任者', 40),
    ('restaurant', 'general', '一般', 10),
    ('restaurant', 'cook', '調理可', 20),
    ('restaurant', 'cashier', 'レジ可', 30),
    ('restaurant', 'lead', '店長候補', 40)
) AS seed(business_code, code, name, sort_order)
  ON bt.code = seed.business_code
ON CONFLICT (business_type_id, code) DO NOTHING;

INSERT INTO request_type_master (business_type_id, code, name, sort_order)
SELECT bt.id, seed.code, seed.name, seed.sort_order
FROM business_types bt
JOIN (
  VALUES
    ('hotel', 'preferred_leave', '希望休', 10),
    ('hotel', 'paid_leave', '有給', 20),
    ('restaurant', 'preferred_off', '休み希望', 10),
    ('restaurant', 'vacation', '休暇申請', 20)
) AS seed(business_code, code, name, sort_order)
  ON bt.code = seed.business_code
ON CONFLICT (business_type_id, code) DO NOTHING;

INSERT INTO shift_types (
  business_type_id, code, name, short_name, starts_at, ends_at,
  default_hours, color_token, is_time_off, is_unassigned, sort_order
)
SELECT
  bt.id, seed.code, seed.name, seed.short_name, seed.starts_at, seed.ends_at,
  seed.default_hours, seed.color_token, seed.is_time_off, seed.is_unassigned, seed.sort_order
FROM business_types bt
JOIN (
  VALUES
    ('hotel', 'A', '早番', '早', '07:00'::time, '16:00'::time, 8.0, 'amber', false, false, 10),
    ('hotel', 'B', '中番', '中', '13:00'::time, '22:00'::time, 8.0, 'sky', false, false, 20),
    ('hotel', 'N', '夜勤', '夜', '22:00'::time, '07:00'::time, 9.0, 'slate', false, false, 30),
    ('hotel', 'OFF', '休み', '休', NULL::time, NULL::time, 0.0, 'muted', true, false, 90),
    ('hotel', 'UNASSIGNED', '未設定', '-', NULL::time, NULL::time, 0.0, 'empty', false, true, 99),
    ('restaurant', 'OP', '開店', '開', '09:00'::time, '15:00'::time, 6.0, 'amber', false, false, 10),
    ('restaurant', 'MD', '中番', '中', '11:00'::time, '17:00'::time, 6.0, 'sky', false, false, 20),
    ('restaurant', 'CL', '閉店', '閉', '17:00'::time, '24:00'::time, 7.0, 'slate', false, false, 30),
    ('restaurant', 'OFF', '休み', '休', NULL::time, NULL::time, 0.0, 'muted', true, false, 90),
    ('restaurant', 'UNASSIGNED', '未設定', '-', NULL::time, NULL::time, 0.0, 'empty', false, true, 99)
) AS seed(
  business_code, code, name, short_name, starts_at, ends_at,
  default_hours, color_token, is_time_off, is_unassigned, sort_order
)
  ON bt.code = seed.business_code
ON CONFLICT (business_type_id, code) DO NOTHING;
