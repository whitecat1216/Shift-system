import "server-only";

import type { BusinessId } from "@/app/(app)/business-config";
import type { AuthenticatedUser } from "@/lib/auth";
import { getPool } from "@/lib/db";

export type LeaveBalanceRow = {
  balanceId: string;
  staffId: string;
  staffName: string;
  grantedOn: string;
  remainingDays: number;
  usedDays: number;
  expiresOn: string | null;
};

export type MultiStoreSuggestion = {
  staffName: string;
  homeStore: string;
  targetStore: string;
  targetDates: string;
  role: string;
};

export type AiAdoptionHistoryRow = {
  id: string;
  planName: string;
  monthLabel: string;
  adoptedAt: string;
  fillRate: number;
  overtimeDelta: number;
  violations: number;
  storeName: string | null;
  notes: string | null;
};

export type LaborBudgetRow = {
  budgetAmount: number;
  monthLabel: string;
  storeId: string;
};

export async function getScopedLeaveBalances(
  user: AuthenticatedUser,
  businessId: BusinessId,
): Promise<LeaveBalanceRow[]> {
  const result = await getPool().query<{
    id: string;
    staff_id: string;
    full_name: string;
    granted_on: string;
    remaining_days: string | number;
    used_days: string | number;
    expires_on: string | null;
  }>(
    `
      SELECT
        plb.id,
        st.id AS staff_id,
        st.full_name,
        plb.granted_on::text,
        plb.remaining_days,
        plb.used_days,
        plb.expires_on::text
      FROM paid_leave_balances plb
      INNER JOIN staff st ON st.id = plb.staff_id
      INNER JOIN stores s ON s.id = st.store_id
      INNER JOIN business_types bt ON bt.id = st.business_type_id
      WHERE bt.code = $1
        AND s.code = ANY($2::text[])
      ORDER BY plb.remaining_days DESC, st.full_name ASC
    `,
    [businessId, user.allowedStoreIds],
  );

  return result.rows.map((row) => ({
    balanceId: row.id,
    staffId: row.staff_id,
    staffName: row.full_name,
    grantedOn: row.granted_on,
    remainingDays: Number(row.remaining_days),
    usedDays: Number(row.used_days),
    expiresOn: row.expires_on,
  }));
}

export async function updateScopedLeaveBalance(
  user: AuthenticatedUser,
  payload: {
    balanceId: string;
    remainingDays: number;
    usedDays: number;
  },
) {
  await getPool().query(
    `
      UPDATE paid_leave_balances plb
      SET
        remaining_days = $1,
        used_days = $2,
        updated_at = NOW()
      FROM staff st
      INNER JOIN stores s ON s.id = st.store_id
      WHERE plb.id = $3
        AND plb.staff_id = st.id
        AND s.code = ANY($4::text[])
    `,
    [payload.remainingDays, payload.usedDays, payload.balanceId, user.allowedStoreIds],
  );
}

export async function getScopedMultiStoreSuggestions(
  user: AuthenticatedUser,
  businessId: BusinessId,
): Promise<MultiStoreSuggestion[]> {
  const result = await getPool().query<{
    full_name: string;
    home_store: string;
    target_store: string;
    role_name: string;
  }>(
    `
      SELECT
        st.full_name,
        home_store.name AS home_store,
        target_store.name AS target_store,
        st.role_name
      FROM staff st
      INNER JOIN stores home_store ON home_store.id = st.store_id
      INNER JOIN business_types bt ON bt.id = st.business_type_id
      INNER JOIN stores target_store
        ON target_store.business_type_id = bt.id
        AND target_store.id <> home_store.id
      WHERE bt.code = $1
        AND st.is_multi_store_available = TRUE
        AND home_store.code = ANY($2::text[])
        AND target_store.code = ANY($2::text[])
      ORDER BY st.hourly_wage DESC NULLS LAST, st.full_name ASC
      LIMIT 5
    `,
    [businessId, user.allowedStoreIds],
  );

  return result.rows.map((row, index) => ({
    staffName: row.full_name,
    homeStore: row.home_store,
    targetStore: row.target_store,
    targetDates:
      index % 2 === 0 ? "3/12-3/14" : index % 3 === 0 ? "3/21-3/22" : "3/18",
    role: row.role_name,
  }));
}

export async function getScopedAiAdoptionHistory(
  user: AuthenticatedUser,
  businessId: BusinessId,
): Promise<AiAdoptionHistoryRow[]> {
  const result = await getPool().query<{
    id: string;
    plan_name: string;
    month_label: string;
    adopted_at: string;
    fill_rate: number;
    overtime_delta: number;
    violations: number;
    store_name: string | null;
    notes: string | null;
  }>(
    `
      SELECT
        history.id,
        history.plan_name,
        history.month_label,
        history.adopted_at::text,
        history.fill_rate,
        history.overtime_delta,
        history.violations,
        s.name AS store_name,
        history.notes
      FROM ai_plan_adoption_history history
      INNER JOIN business_types bt ON bt.id = history.business_type_id
      LEFT JOIN stores s ON s.id = history.store_id
      WHERE history.user_id = $1
        AND bt.code = $2
        AND (s.code IS NULL OR s.code = ANY($3::text[]))
      ORDER BY history.adopted_at DESC
      LIMIT 10
    `,
    [user.id, businessId, user.allowedStoreIds],
  );

  return result.rows.map((row) => ({
    id: row.id,
    planName: row.plan_name,
    monthLabel: row.month_label,
    adoptedAt: row.adopted_at,
    fillRate: row.fill_rate,
    overtimeDelta: row.overtime_delta,
    violations: row.violations,
    storeName: row.store_name,
    notes: row.notes,
  }));
}

export async function getScopedLaborBudget(
  user: AuthenticatedUser,
  businessId: BusinessId,
  storeId: string,
  monthLabel: string,
): Promise<LaborBudgetRow | null> {
  const result = await getPool().query<{
    budget_amount: string | number;
    month_label: string;
    store_code: string;
  }>(
    `
      SELECT lbs.budget_amount, lbs.month_label, s.code AS store_code
      FROM labor_budget_settings lbs
      INNER JOIN business_types bt ON bt.id = lbs.business_type_id
      LEFT JOIN stores s ON s.id = lbs.store_id
      WHERE bt.code = $1
        AND lbs.month_label = $2
        AND s.code = $3
        AND s.code = ANY($4::text[])
      LIMIT 1
    `,
    [businessId, monthLabel, storeId, user.allowedStoreIds],
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    budgetAmount: Number(row.budget_amount),
    monthLabel: row.month_label,
    storeId: row.store_code,
  };
}

export async function updateScopedLaborBudget(
  user: AuthenticatedUser,
  payload: {
    businessId: BusinessId;
    storeId: string;
    monthLabel: string;
    budgetAmount: number;
  },
) {
  await getPool().query(
    `
      WITH business AS (
        SELECT id
        FROM business_types
        WHERE code = $2
        LIMIT 1
      ),
      store_row AS (
        SELECT s.id
        FROM stores s
        INNER JOIN business b ON b.id = s.business_type_id
        WHERE s.code = $3
          AND s.code = ANY($5::text[])
        LIMIT 1
      )
      INSERT INTO labor_budget_settings (
        business_type_id,
        store_id,
        month_label,
        budget_amount,
        updated_by,
        updated_at
      )
      SELECT business.id, store_row.id, $4, $6, $1, NOW()
      FROM business, store_row
      ON CONFLICT (business_type_id, store_id, month_label)
      DO UPDATE SET
        budget_amount = EXCLUDED.budget_amount,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
    `,
    [user.id, payload.businessId, payload.storeId, payload.monthLabel, user.allowedStoreIds, payload.budgetAmount],
  );
}
