import "server-only";

import { BusinessConfig, BusinessId, businessIds, getBusinessConfig } from "@/app/(app)/business-config";
import { getPool } from "@/lib/db";

type LabelKey =
  | "dashboardTitle"
  | "scheduleTitle"
  | "requestsTitle"
  | "leaveControlTitle"
  | "leaveBalanceTitle"
  | "staffTitle"
  | "aiTitle"
  | "laborCostTitle"
  | "store"
  | "staffSingle"
  | "staffPlural"
  | "requestSingle"
  | "publish"
  | "unpublish"
  | "published"
  | "draft"
  | "requestAdd";

const labelKeyMap: Record<string, LabelKey> = {
  dashboard_title: "dashboardTitle",
  schedule_title: "scheduleTitle",
  requests_title: "requestsTitle",
  leave_control_title: "leaveControlTitle",
  leave_balance_title: "leaveBalanceTitle",
  staff_title: "staffTitle",
  ai_title: "aiTitle",
  labor_cost_title: "laborCostTitle",
  store_label: "store",
  staff_label: "staffSingle",
  staff_plural_label: "staffPlural",
  request_single_label: "requestSingle",
  publish_label: "publish",
  unpublish_label: "unpublish",
  published_label: "published",
  draft_label: "draft",
  request_add_label: "requestAdd",
};

type BusinessRow = {
  code: string;
  name: string;
};

type LabelRow = {
  label_key: string;
  label_value: string;
};

type NameRow = {
  name: string;
};

type ShiftRow = {
  code: string;
  name: string;
  short_name: string;
  default_hours: string | number;
  color_token: string | null;
  is_time_off: boolean;
  is_unassigned: boolean;
};

function assertBusinessId(value: string): BusinessId | null {
  return businessIds.includes(value as BusinessId) ? (value as BusinessId) : null;
}

export async function getBusinessTypeSummaries() {
  const pool = getPool();
  const result = await pool.query<BusinessRow>(
    `
      SELECT code, name
      FROM business_types
      ORDER BY name ASC
    `,
  );

  return result.rows
    .map((row) => {
      const id = assertBusinessId(row.code);
      return id ? { id, name: row.name } : null;
    })
    .filter((row): row is { id: BusinessId; name: string } => Boolean(row));
}

export async function loadBusinessConfigFromDb(businessId: BusinessId): Promise<BusinessConfig> {
  const pool = getPool();
  const fallback = getBusinessConfig(businessId);

  const businessResult = await pool.query<BusinessRow>(
    `
      SELECT code, name
      FROM business_types
      WHERE code = $1
      LIMIT 1
    `,
    [businessId],
  );

  if (businessResult.rowCount === 0) {
    return fallback;
  }

  const business = businessResult.rows[0];

  const [labelResult, employmentResult, qualificationResult, requestTypeResult, shiftTypeResult] =
    await Promise.all([
      pool.query<LabelRow>(
        `
          SELECT ulm.label_key, ulm.label_value
          FROM ui_label_master ulm
          INNER JOIN business_types bt ON bt.id = ulm.business_type_id
          WHERE bt.code = $1
        `,
        [businessId],
      ),
      pool.query<NameRow>(
        `
          SELECT etm.name
          FROM employment_type_master etm
          INNER JOIN business_types bt ON bt.id = etm.business_type_id
          WHERE bt.code = $1
          ORDER BY etm.sort_order ASC, etm.name ASC
        `,
        [businessId],
      ),
      pool.query<NameRow>(
        `
          SELECT qm.name
          FROM qualification_master qm
          INNER JOIN business_types bt ON bt.id = qm.business_type_id
          WHERE bt.code = $1
          ORDER BY qm.sort_order ASC, qm.name ASC
        `,
        [businessId],
      ),
      pool.query<NameRow>(
        `
          SELECT rtm.name
          FROM request_type_master rtm
          INNER JOIN business_types bt ON bt.id = rtm.business_type_id
          WHERE bt.code = $1
          ORDER BY rtm.sort_order ASC, rtm.name ASC
        `,
        [businessId],
      ),
      pool.query<ShiftRow>(
        `
          SELECT
            st.code,
            st.name,
            st.short_name,
            st.default_hours,
            st.color_token,
            st.is_time_off,
            st.is_unassigned
          FROM shift_types st
          INNER JOIN business_types bt ON bt.id = st.business_type_id
          WHERE bt.code = $1
          ORDER BY st.sort_order ASC, st.code ASC
        `,
        [businessId],
      ),
    ]);

  const labels = { ...fallback.labels };

  for (const row of labelResult.rows) {
    const mappedKey = labelKeyMap[row.label_key];
    if (mappedKey) {
      labels[mappedKey] = row.label_value;
    }
  }

  labels.staffPlural ||= labels.staffSingle;
  labels.requestSingle ||= requestTypeResult.rows[0]?.name ?? fallback.labels.requestSingle;
  labels.publish ||= fallback.labels.publish;
  labels.unpublish ||= fallback.labels.unpublish;
  labels.published ||= fallback.labels.published;
  labels.draft ||= fallback.labels.draft;
  labels.requestAdd ||= fallback.labels.requestAdd;

  const shiftTypes = shiftTypeResult.rows
    .filter((row) => !row.is_time_off && !row.is_unassigned)
    .map((row) => ({
      code: row.code,
      label: row.name,
      shortLabel: row.short_name,
      colorToken: normalizeShiftColor(row.color_token, fallback.shiftTypes[0]?.colorToken ?? "amber"),
      hours: Number(row.default_hours),
    }));

  const offShift = shiftTypeResult.rows.find((row) => row.is_time_off);
  const unassignedShift = shiftTypeResult.rows.find((row) => row.is_unassigned);

  return {
    id: businessId,
    name: business.name,
    labels,
    employmentTypes: collectNames(employmentResult.rows, fallback.employmentTypes),
    qualifications: collectNames(qualificationResult.rows, fallback.qualifications),
    shiftTypes: shiftTypes.length > 0 ? shiftTypes : fallback.shiftTypes,
    specialShifts: {
      off: {
        code: offShift?.short_name ?? fallback.specialShifts.off.code,
        label: offShift?.name ?? fallback.specialShifts.off.label,
        colorToken: "muted",
      },
      unassigned: {
        code: unassignedShift?.short_name ?? fallback.specialShifts.unassigned.code,
        label: unassignedShift?.name ?? fallback.specialShifts.unassigned.label,
        colorToken: "empty",
      },
    },
    requestTypes: collectNames(requestTypeResult.rows, fallback.requestTypes),
  };
}

function normalizeShiftColor(
  value: string | null,
  fallback: BusinessConfig["shiftTypes"][number]["colorToken"],
): BusinessConfig["shiftTypes"][number]["colorToken"] {
  if (value === "amber" || value === "sky" || value === "slate") {
    return value;
  }

  return fallback;
}

function collectNames(rows: NameRow[], fallback: string[]) {
  const names = rows.map((row) => row.name).filter(Boolean);
  return names.length > 0 ? names : fallback;
}
