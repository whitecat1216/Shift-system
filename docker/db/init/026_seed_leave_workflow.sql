UPDATE leave_requests lr
SET
  reviewed_by = u.id,
  reviewed_at = CASE
    WHEN lr.status IN ('approved', 'adjusting', 'rejected') THEN NOW() - INTERVAL '3 days'
    ELSE lr.reviewed_at
  END,
  adjustment_note = CASE
    WHEN lr.status = 'adjusting' AND lr.adjustment_note IS NULL THEN '繁忙日のため再調整してください。'
    WHEN lr.status = 'rejected' AND lr.adjustment_note IS NULL THEN '人員不足のため今回は見送りです。'
    ELSE lr.adjustment_note
  END
FROM staff st
INNER JOIN stores s ON s.id = st.store_id
INNER JOIN business_types bt ON bt.id = s.business_type_id
INNER JOIN users u
  ON (
    (bt.code = 'hotel' AND u.email = 'hotel.manager@example.com') OR
    (bt.code = 'restaurant' AND u.email = 'restaurant.manager@example.com')
  )
WHERE lr.staff_id = st.id
  AND lr.status IN ('approved', 'adjusting', 'rejected')
  AND lr.reviewed_by IS NULL;
