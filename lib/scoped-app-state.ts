import "server-only";

import { getBusinessConfig, type BusinessId } from "@/app/(app)/business-config";
import type {
  AiSettings,
  AppState,
  LeaveRequest,
  RequestStatus,
  ShiftRequirement,
  StaffMember,
  Store,
} from "@/app/(app)/mock-data";
import type { AuthenticatedUser } from "@/lib/auth";
import { getPool } from "@/lib/db";

type StaffRow = {
  id: string;
  employee_code: string;
  store_code: string;
  full_name: string;
  employment_type_name: string;
  role_name: string;
  qualification_name: string | null;
  is_night_shift_available: boolean;
  is_multi_store_available: boolean;
  hourly_wage: string | number | null;
};

type StoreRow = {
  code: string;
  name: string;
};

type LeaveRequestRow = {
  id: string;
  staff_id: string;
  request_type_name: string;
  starts_on: string;
  ends_on: string;
  status: string;
  reason: string | null;
  created_at: string;
};

type RequirementRow = {
  store_code: string;
  target_date: string;
  shift_code: string;
  required_headcount: number;
};

type AssignmentRow = {
  staff_id: string;
  target_date: string;
  shift_code: string;
  shift_short_name: string;
  is_time_off: boolean;
  is_unassigned: boolean;
  status: string;
};

type LookupRow = {
  id: string;
};

type AiSettingsRow = {
  template_name: string;
  min_manager_per_shift: number;
  night_rest_days: number;
  include_pending_requests: boolean;
  max_monthly_overtime_hours: number;
  multi_store_weight: number;
  labor_cost_weight: number;
  request_priority_weight: number;
};

export async function getScopedAppState(
  user: AuthenticatedUser,
  businessId: BusinessId,
  monthLabel: string,
): Promise<AppState> {
  if (!user.allowedBusinessIds.includes(businessId)) {
    throw new Error("Forbidden");
  }

  const businessConfig = getBusinessConfig(businessId);
  const { monthKey, monthStart, monthEnd, daysInMonth } = getMonthBounds(monthLabel);
  const allowedStoreCodes = user.allowedStoreIds;
  const pool = getPool();

  const [storesResult, staffResult, leaveResult, requirementsResult, assignmentsResult, aiSettingsResult] =
    await Promise.all([
      pool.query<StoreRow>(
        `
          SELECT s.code, s.name
          FROM stores s
          INNER JOIN business_types bt ON bt.id = s.business_type_id
          WHERE bt.code = $1
            AND s.code = ANY($2::text[])
          ORDER BY s.name ASC
        `,
        [businessId, allowedStoreCodes],
      ),
      pool.query<StaffRow>(
        `
          SELECT
            st.id,
            st.employee_code,
            s.code AS store_code,
            st.full_name,
            etm.name AS employment_type_name,
            st.role_name,
            qm.name AS qualification_name,
            st.is_night_shift_available,
            st.is_multi_store_available,
            st.hourly_wage
          FROM staff st
          INNER JOIN stores s ON s.id = st.store_id
          INNER JOIN business_types bt ON bt.id = st.business_type_id
          LEFT JOIN employment_type_master etm
            ON etm.business_type_id = bt.id AND etm.code = st.employment_type_code
          LEFT JOIN qualification_master qm
            ON qm.business_type_id = bt.id AND qm.code = st.qualification_code
          WHERE bt.code = $1
            AND s.code = ANY($2::text[])
          ORDER BY s.name ASC, st.full_name ASC
        `,
        [businessId, allowedStoreCodes],
      ),
      pool.query<LeaveRequestRow>(
        `
          SELECT
            lr.id,
            lr.staff_id,
            rtm.name AS request_type_name,
            lr.starts_on::text,
            lr.ends_on::text,
            lr.status,
            lr.reason,
            lr.created_at::text
          FROM leave_requests lr
          INNER JOIN staff st ON st.id = lr.staff_id
          INNER JOIN stores s ON s.id = st.store_id
          INNER JOIN business_types bt ON bt.id = st.business_type_id
          INNER JOIN request_type_master rtm ON rtm.id = lr.request_type_id
          WHERE bt.code = $1
            AND s.code = ANY($2::text[])
            AND lr.starts_on <= $4::date
            AND lr.ends_on >= $3::date
          ORDER BY lr.created_at DESC
        `,
        [businessId, allowedStoreCodes, monthStart, monthEnd],
      ),
      pool.query<RequirementRow>(
        `
          SELECT
            s.code AS store_code,
            sr.target_date::text,
            st.code AS shift_code,
            sr.required_headcount
          FROM shift_requirements sr
          INNER JOIN stores s ON s.id = sr.store_id
          INNER JOIN shift_types st ON st.id = sr.shift_type_id
          INNER JOIN business_types bt ON bt.id = s.business_type_id
          WHERE bt.code = $1
            AND s.code = ANY($2::text[])
            AND sr.target_date >= $3::date
            AND sr.target_date <= $4::date
          ORDER BY s.name ASC, sr.target_date ASC, st.sort_order ASC
        `,
        [businessId, allowedStoreCodes, monthStart, monthEnd],
      ),
      pool.query<AssignmentRow>(
        `
          SELECT
            sa.staff_id,
            sa.target_date::text,
            st.code AS shift_code,
            st.short_name AS shift_short_name,
            st.is_time_off,
            st.is_unassigned,
            sa.status
          FROM shift_assignments sa
          INNER JOIN staff sf ON sf.id = sa.staff_id
          INNER JOIN stores s ON s.id = sa.store_id
          INNER JOIN shift_types st ON st.id = sa.shift_type_id
          INNER JOIN business_types bt ON bt.id = s.business_type_id
          WHERE bt.code = $1
            AND s.code = ANY($2::text[])
            AND sa.target_date >= $3::date
            AND sa.target_date <= $4::date
          ORDER BY sa.target_date ASC
        `,
        [businessId, allowedStoreCodes, monthStart, monthEnd],
      ),
      pool.query<AiSettingsRow>(
        `
          SELECT
            settings.template_name,
            settings.min_manager_per_shift,
            settings.night_rest_days,
            settings.include_pending_requests,
            settings.max_monthly_overtime_hours,
            settings.multi_store_weight,
            settings.labor_cost_weight,
            settings.request_priority_weight
          FROM user_ai_generation_settings settings
          INNER JOIN business_types bt ON bt.id = settings.business_type_id
          LEFT JOIN stores s ON s.id = settings.store_id
          WHERE settings.user_id = $1
            AND bt.code = $2
            AND (s.code = $3 OR settings.store_id IS NULL)
          ORDER BY CASE WHEN s.code = $3 THEN 0 ELSE 1 END
          LIMIT 1
        `,
        [user.id, businessId, allowedStoreCodes[0] ?? null],
      ),
    ]);

  const stores: Store[] = storesResult.rows.map((row) => ({
    id: row.code,
    name: row.name,
  }));

  const staff: StaffMember[] = staffResult.rows.map((row) => ({
    id: row.id,
    name: row.full_name,
    storeId: row.store_code,
    employmentType: row.employment_type_name,
    role: row.role_name,
    shiftSkills: businessConfig.shiftTypes.slice(0, 2).map((item) => item.code),
    qualification: row.qualification_name ?? "一般",
    nightAvailable: row.is_night_shift_available,
    multiStoreAvailable: row.is_multi_store_available,
    hourlyWage: Number(row.hourly_wage ?? 0),
    active: true,
  }));

  const leaveRequests: LeaveRequest[] = leaveResult.rows.map((row) => ({
    id: row.id,
    staffId: row.staff_id,
    type: row.request_type_name,
    days: expandDaysWithinMonth(row.starts_on, row.ends_on, monthKey),
    reason: row.reason ?? "",
    status: normalizeRequestStatus(row.status),
    createdAt: row.created_at.slice(0, 10),
  }));

  const shiftRequirements: ShiftRequirement[] = requirementsResult.rows.map((row) => ({
    storeId: row.store_code,
    day: Number.parseInt(row.target_date.slice(-2), 10),
    code: row.shift_code,
    required: row.required_headcount,
  }));

  const assignments = Object.fromEntries(
    staff.map((member) => [
      member.id,
      Array.from({ length: daysInMonth }, () => businessConfig.specialShifts.unassigned.code),
    ]),
  ) as Record<string, string[]>;

  let published = false;

  for (const row of assignmentsResult.rows) {
    const dayIndex = Number.parseInt(row.target_date.slice(-2), 10) - 1;
    const code = row.is_time_off || row.is_unassigned ? row.shift_short_name : row.shift_code;

    if (assignments[row.staff_id]) {
      assignments[row.staff_id][dayIndex] = code;
    }

    if (row.status === "published") {
      published = true;
    }
  }

  const aiSettings = toAiSettings(aiSettingsResult.rows[0], businessId);

  const scopedState = {
    businessId,
    currentMonth: formatMonthLabel(monthKey),
    selectedStoreId: stores[0]?.id ?? "",
    published,
    stores,
    staff,
    leaveRequests,
    shiftRequirements,
    assignments,
    aiPlans: [],
    aiSettings,
  };

  return {
    ...scopedState,
    aiPlans: buildAiPlansFromState(scopedState),
  };
}

export async function createScopedStaff(
  user: AuthenticatedUser,
  payload: {
    businessId: BusinessId;
    name: string;
    storeId: string;
    employmentType: string;
    qualification: string;
    role: string;
    hourlyWage: number;
    nightAvailable: boolean;
    multiStoreAvailable: boolean;
  },
) {
  assertStoreAccess(user, payload.businessId, payload.storeId);
  const pool = getPool();
  const employeeCode = `SP${Date.now().toString().slice(-8)}`;
  const result = await pool.query<LookupRow>(
    `
      WITH business AS (
        SELECT id
        FROM business_types
        WHERE code = $1
        LIMIT 1
      ),
      store_row AS (
        SELECT s.id
        FROM stores s
        INNER JOIN business b ON b.id = s.business_type_id
        WHERE s.code = $2
        LIMIT 1
      ),
      employment AS (
        SELECT etm.code
        FROM employment_type_master etm
        INNER JOIN business b ON b.id = etm.business_type_id
        WHERE etm.name = $3
        LIMIT 1
      ),
      qualification AS (
        SELECT qm.code
        FROM qualification_master qm
        INNER JOIN business b ON b.id = qm.business_type_id
        WHERE qm.name = $4
        LIMIT 1
      )
      INSERT INTO staff (
        employee_code,
        business_type_id,
        store_id,
        full_name,
        employment_type_code,
        role_name,
        qualification_code,
        is_night_shift_available,
        is_multi_store_available,
        hourly_wage,
        joined_on
      )
      SELECT
        $5,
        business.id,
        store_row.id,
        $6,
        employment.code,
        $7,
        qualification.code,
        $8,
        $9,
        $10,
        CURRENT_DATE
      FROM business, store_row, employment, qualification
      RETURNING id
    `,
    [
      payload.businessId,
      payload.storeId,
      payload.employmentType,
      payload.qualification,
      employeeCode,
      payload.name,
      payload.role,
      payload.nightAvailable,
      payload.multiStoreAvailable,
      payload.hourlyWage,
    ],
  );

  return result.rows[0]?.id ?? null;
}

export async function createScopedLeaveRequest(
  user: AuthenticatedUser,
  payload: {
    businessId: BusinessId;
    staffId: string;
    requestType: string;
    days: number[];
    reason: string;
    monthLabel: string;
  },
) {
  const { monthKey } = getMonthBounds(payload.monthLabel);
  const sortedDays = [...payload.days].sort((a, b) => a - b);
  const startsOn = `${monthKey}-${String(sortedDays[0]).padStart(2, "0")}`;
  const endsOn = `${monthKey}-${String(sortedDays[sortedDays.length - 1]).padStart(2, "0")}`;

  await assertStaffAccess(user, payload.businessId, payload.staffId);

  const pool = getPool();
  const result = await pool.query<LookupRow>(
    `
      WITH business AS (
        SELECT id
        FROM business_types
        WHERE code = $1
        LIMIT 1
      ),
      request_type AS (
        SELECT rtm.id
        FROM request_type_master rtm
        INNER JOIN business b ON b.id = rtm.business_type_id
        WHERE rtm.name = $2
        LIMIT 1
      )
      INSERT INTO leave_requests (staff_id, request_type_id, starts_on, ends_on, status, reason)
      SELECT $3, request_type.id, $4::date, $5::date, 'pending', $6
      FROM request_type
      RETURNING id
    `,
    [payload.businessId, payload.requestType, payload.staffId, startsOn, endsOn, payload.reason],
  );

  return result.rows[0]?.id ?? null;
}

export async function updateScopedLeaveRequestStatus(
  user: AuthenticatedUser,
  payload: { businessId: BusinessId; requestId: string; status: RequestStatus },
) {
  const pool = getPool();
  await pool.query(
    `
      UPDATE leave_requests lr
      SET status = $1, updated_at = NOW()
      FROM staff st
      INNER JOIN stores s ON s.id = st.store_id
      INNER JOIN business_types bt ON bt.id = st.business_type_id
      WHERE lr.id = $2
        AND lr.staff_id = st.id
        AND bt.code = $3
        AND s.code = ANY($4::text[])
    `,
    [payload.status, payload.requestId, payload.businessId, user.allowedStoreIds],
  );
}

export async function updateScopedShiftAssignment(
  user: AuthenticatedUser,
  payload: {
    businessId: BusinessId;
    staffId: string;
    day: number;
    code: string;
    monthLabel: string;
  },
) {
  await assertStaffAccess(user, payload.businessId, payload.staffId);
  const { monthKey } = getMonthBounds(payload.monthLabel);
  const targetDate = `${monthKey}-${String(payload.day).padStart(2, "0")}`;
  const pool = getPool();

  await pool.query(
    `
      WITH target_staff AS (
        SELECT st.id, st.store_id, st.business_type_id
        FROM staff st
        INNER JOIN stores s ON s.id = st.store_id
        INNER JOIN business_types bt ON bt.id = st.business_type_id
        WHERE st.id = $1
          AND bt.code = $2
          AND s.code = ANY($3::text[])
        LIMIT 1
      ),
      target_shift AS (
        SELECT shift_types.id
        FROM shift_types
        INNER JOIN target_staff ts ON ts.business_type_id = shift_types.business_type_id
        WHERE shift_types.code = $4 OR shift_types.short_name = $4
        LIMIT 1
      )
      INSERT INTO shift_assignments (store_id, staff_id, target_date, shift_type_id, status, source)
      SELECT ts.store_id, ts.id, $5::date, target_shift.id, 'draft', 'manual'
      FROM target_staff ts, target_shift
      ON CONFLICT (staff_id, target_date)
      DO UPDATE SET
        shift_type_id = EXCLUDED.shift_type_id,
        status = 'draft',
        source = 'manual',
        updated_at = NOW()
    `,
    [payload.staffId, payload.businessId, user.allowedStoreIds, payload.code, targetDate],
  );
}

export async function setScopedPublishState(
  user: AuthenticatedUser,
  payload: {
    businessId: BusinessId;
    storeId: string;
    monthLabel: string;
    published: boolean;
  },
) {
  assertStoreAccess(user, payload.businessId, payload.storeId);
  const { monthStart, monthEnd } = getMonthBounds(payload.monthLabel);
  const pool = getPool();

  await pool.query(
    `
      UPDATE shift_assignments sa
      SET status = $1, updated_at = NOW()
      FROM stores s
      INNER JOIN business_types bt ON bt.id = s.business_type_id
      WHERE sa.store_id = s.id
        AND bt.code = $2
        AND s.code = $3
        AND sa.target_date >= $4::date
        AND sa.target_date <= $5::date
    `,
    [payload.published ? "published" : "draft", payload.businessId, payload.storeId, monthStart, monthEnd],
  );
}

export async function applyScopedAiPlan(
  user: AuthenticatedUser,
  payload: {
    businessId: BusinessId;
    planId: string;
    monthLabel: string;
    storeId: string;
  },
) {
  assertStoreAccess(user, payload.businessId, payload.storeId);
  const state = await getScopedAppState(user, payload.businessId, payload.monthLabel);
  const targetPlan = state.aiPlans.find((plan) => plan.id === payload.planId);
  const targetStaff = state.staff.filter((member) => member.storeId === payload.storeId).slice(0, 3);
  const businessConfig = getBusinessConfig(payload.businessId);
  const shiftCodes = businessConfig.shiftTypes.map((shiftType) => shiftType.code);
  const primary = shiftCodes[0] ?? businessConfig.specialShifts.unassigned.code;
  const secondary = shiftCodes[1] ?? primary;
  const tertiary = shiftCodes[2] ?? secondary;
  const offCode = businessConfig.specialShifts.off.code;
  const emptyCode = businessConfig.specialShifts.unassigned.code;

  if (targetStaff[0]) {
    await updateScopedShiftAssignment(user, {
      businessId: payload.businessId,
      staffId: targetStaff[0].id,
      day: 1,
      code: payload.planId === "plan-c" ? offCode : payload.planId === "plan-a" ? emptyCode : primary,
      monthLabel: payload.monthLabel,
    });
  }

  if (targetStaff[1]) {
    await updateScopedShiftAssignment(user, {
      businessId: payload.businessId,
      staffId: targetStaff[1].id,
      day: 5,
      code: payload.planId === "plan-b" ? secondary : offCode,
      monthLabel: payload.monthLabel,
    });
  }

  if (targetStaff[2]) {
    await updateScopedShiftAssignment(user, {
      businessId: payload.businessId,
      staffId: targetStaff[2].id,
      day: 7,
      code: payload.planId === "plan-b" ? tertiary : offCode,
      monthLabel: payload.monthLabel,
    });
  }

  if (targetPlan) {
    await getPool().query(
      `
        INSERT INTO ai_plan_adoption_history (
          user_id,
          business_type_id,
          store_id,
          month_label,
          plan_id,
          plan_name,
          fill_rate,
          overtime_delta,
          violations,
          notes
        )
        SELECT
          $1,
          bt.id,
          s.id,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10
        FROM business_types bt
        INNER JOIN stores s ON s.business_type_id = bt.id
        WHERE bt.code = $2
          AND s.code = $3
        LIMIT 1
      `,
      [
        user.id,
        payload.businessId,
        payload.storeId,
        payload.monthLabel,
        targetPlan.id,
        targetPlan.name,
        targetPlan.fillRate,
        targetPlan.overtimeDelta,
        targetPlan.violations,
        targetPlan.notes,
      ],
    );
  }
}

function assertStoreAccess(user: AuthenticatedUser, businessId: BusinessId, storeId: string) {
  if (!user.allowedBusinessIds.includes(businessId) || !user.allowedStoreIds.includes(storeId)) {
    throw new Error("Forbidden");
  }
}

async function assertStaffAccess(user: AuthenticatedUser, businessId: BusinessId, staffId: string) {
  const result = await getPool().query<{ store_code: string }>(
    `
      SELECT s.code AS store_code
      FROM staff st
      INNER JOIN stores s ON s.id = st.store_id
      INNER JOIN business_types bt ON bt.id = st.business_type_id
      WHERE st.id = $1
        AND bt.code = $2
      LIMIT 1
    `,
    [staffId, businessId],
  );

  const storeCode = result.rows[0]?.store_code;

  if (!storeCode || !user.allowedStoreIds.includes(storeCode)) {
    throw new Error("Forbidden");
  }
}

function normalizeRequestStatus(value: string): RequestStatus {
  if (value === "approved" || value === "adjusting" || value === "rejected") {
    return value;
  }

  return "pending";
}

function expandDaysWithinMonth(startsOn: string, endsOn: string, monthKey: string) {
  const startDate = new Date(`${startsOn}T00:00:00+09:00`);
  const endDate = new Date(`${endsOn}T00:00:00+09:00`);
  const days: number[] = [];

  for (
    const current = new Date(startDate);
    current <= endDate;
    current.setDate(current.getDate() + 1)
  ) {
    const currentMonth = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
    if (currentMonth === monthKey) {
      days.push(current.getDate());
    }
  }

  return days;
}

function getMonthBounds(monthLabel: string) {
  const matched = monthLabel.match(/^(\d{4})年(\d{1,2})月$/);
  const year = matched ? Number.parseInt(matched[1], 10) : 2026;
  const month = matched ? Number.parseInt(matched[2], 10) : 3;
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const daysInMonth = new Date(year, month, 0).getDate();

  return {
    monthKey,
    monthStart: `${monthKey}-01`,
    monthEnd: `${monthKey}-${String(daysInMonth).padStart(2, "0")}`,
    daysInMonth,
  };
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  return `${year}年${Number.parseInt(month, 10)}月`;
}

function buildAiPlansFromState(state: {
  businessId: BusinessId;
  stores: { id: string }[];
  selectedStoreId: string;
  staff: { id: string; storeId: string; hourlyWage: number }[];
  leaveRequests: { status: string }[];
  shiftRequirements: { storeId: string; day: number; code: string; required: number }[];
  assignments: Record<string, string[]>;
  aiSettings: AiSettings;
}) {
  const businessConfig = getBusinessConfig(state.businessId);
  const coverageRows = Object.fromEntries(
    businessConfig.shiftTypes.map((shiftType) => [shiftType.code, Array.from({ length: 31 }, () => 0)]),
  ) as Record<string, number[]>;

  for (const member of state.staff.filter((item) => item.storeId === state.selectedStoreId)) {
    for (const [index, code] of (state.assignments[member.id] ?? []).entries()) {
      if (coverageRows[code]) {
        coverageRows[code][index] += 1;
      }
    }
  }

  const requirements = state.shiftRequirements.filter((item) => item.storeId === state.selectedStoreId);
  const totals = requirements.reduce(
    (acc, item) => {
      acc.required += item.required;
      acc.filled += Math.min(coverageRows[item.code]?.[item.day - 1] ?? 0, item.required);
      return acc;
    },
    { required: 0, filled: 0 },
  );
  const fillRate = totals.required === 0 ? 0 : Math.round((totals.filled / totals.required) * 100);
  const pendingRequests = state.aiSettings.includePendingRequests
    ? state.leaveRequests.filter((request) => request.status === "pending").length
    : 0;
  const nightCodes = businessConfig.shiftTypes.filter((item) => item.colorToken === "slate").map((item) => item.code);
  const nightAssignments = Object.values(state.assignments).flat().filter((code) => nightCodes.includes(code)).length;
  const laborCost = state.staff.reduce((sum, member) => {
    const assigned = state.assignments[member.id] ?? [];
    const hours = assigned.reduce((total, code) => {
      const shift = businessConfig.shiftTypes.find((item) => item.code === code);
      return total + (shift?.hours ?? 0);
    }, 0);
    return sum + hours * member.hourlyWage;
  }, 0);

  const baseNamePrefix = state.businessId === "restaurant" ? "案" : "案";

  const managerShortagePenalty = Math.max(0, state.aiSettings.minManagerPerShift - 1);
  const restPenalty = Math.max(0, state.aiSettings.nightRestDays - 1);
  const costWeightFactor = Math.max(1, Math.round(state.aiSettings.laborCostWeight / 20));
  const requestWeightFactor = Math.max(1, Math.round(state.aiSettings.requestPriorityWeight / 20));
  const multiStoreFactor = Math.max(1, Math.round(state.aiSettings.multiStoreWeight / 20));

  return [
    {
      id: "plan-a",
      name: `${baseNamePrefix}A: バランス重視`,
      fillRate: Math.max(0, fillRate - restPenalty),
      overtimeDelta: -Math.max(1, Math.round(nightAssignments / (6 + restPenalty))),
      violations: Math.max(0, pendingRequests + managerShortagePenalty - 1),
      notes: `${state.aiSettings.templateName}を基準に不足と負荷のバランスを取った案です。`,
      applied: true,
    },
    {
      id: "plan-b",
      name: `${baseNamePrefix}B: 充足率優先`,
      fillRate: Math.min(99, fillRate + 2 + multiStoreFactor),
      overtimeDelta: Math.max(1, Math.round(laborCost / (180000 / costWeightFactor))),
      violations: Math.max(0, pendingRequests + managerShortagePenalty + 1),
      notes: "不足解消を優先して応援と追加配置を増やす案です。",
      applied: false,
    },
    {
      id: "plan-c",
      name: `${baseNamePrefix}C: 希望休優先`,
      fillRate: Math.max(0, fillRate - 2 - requestWeightFactor),
      overtimeDelta: -Math.max(1, Math.round(laborCost / (320000 / Math.max(1, costWeightFactor - 1)))),
      violations: Math.max(0, pendingRequests - requestWeightFactor),
      notes: "申請反映を優先して勤務変更量を抑える案です。",
      applied: false,
    },
  ];
}

function toAiSettings(row: AiSettingsRow | undefined, businessId: BusinessId): AiSettings {
  if (!row) {
    return businessId === "restaurant"
      ? {
          templateName: "標準テンプレート",
          minManagerPerShift: 1,
          nightRestDays: 0,
          includePendingRequests: true,
          maxMonthlyOvertimeHours: 24,
          multiStoreWeight: 65,
          laborCostWeight: 60,
          requestPriorityWeight: 60,
        }
      : {
          templateName: "標準テンプレート",
          minManagerPerShift: 1,
          nightRestDays: 1,
          includePendingRequests: true,
          maxMonthlyOvertimeHours: 20,
          multiStoreWeight: 55,
          laborCostWeight: 50,
          requestPriorityWeight: 70,
        };
  }

  return {
    templateName: row.template_name,
    minManagerPerShift: row.min_manager_per_shift,
    nightRestDays: row.night_rest_days,
    includePendingRequests: row.include_pending_requests,
    maxMonthlyOvertimeHours: row.max_monthly_overtime_hours,
    multiStoreWeight: row.multi_store_weight,
    laborCostWeight: row.labor_cost_weight,
    requestPriorityWeight: row.request_priority_weight,
  };
}
