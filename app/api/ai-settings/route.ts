import { NextResponse } from "next/server";
import { businessIds, type BusinessId } from "@/app/(app)/business-config";
import type { AiSettings } from "@/app/(app)/mock-data";
import { getCurrentUser } from "@/lib/auth";
import { getPool } from "@/lib/db";

function isBusinessId(value: string): value is BusinessId {
  return businessIds.includes(value as BusinessId);
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("business");
    const storeId = searchParams.get("store");
    const monthLabel = searchParams.get("month") ?? "2026年3月";

    if (!businessId || !isBusinessId(businessId) || !storeId) {
      return NextResponse.json({ message: "Invalid query." }, { status: 400 });
    }

    const response = await fetch(
      `${new URL(request.url).origin}/api/app-state?business=${businessId}&month=${encodeURIComponent(monthLabel)}`,
      {
        headers: {
          cookie: request.headers.get("cookie") ?? "",
        },
      },
    );
    const state = (await response.json()) as { aiSettings?: AiSettings };
    return NextResponse.json({ settings: state.aiSettings });
  } catch (error) {
    console.error("Failed to load ai settings", error);
    return NextResponse.json({ message: "Failed to load ai settings." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { businessId?: string; storeId?: string; settings?: AiSettings };

    if (!body.businessId || !isBusinessId(body.businessId) || !body.storeId || !body.settings) {
      return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
    }

    if (!user.allowedBusinessIds.includes(body.businessId) || !user.allowedStoreIds.includes(body.storeId)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await getPool().query(
      `
        WITH business AS (
          SELECT id
          FROM business_types
          WHERE code = $2
          LIMIT 1
        ),
        store_row AS (
          SELECT stores.id
          FROM stores
          INNER JOIN business ON business.id = stores.business_type_id
          WHERE stores.code = $3
          LIMIT 1
        )
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
          request_priority_weight,
          updated_at
        )
        SELECT
          $1,
          business.id,
          store_row.id,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          NOW()
        FROM business, store_row
        ON CONFLICT (user_id, business_type_id, store_id)
        DO UPDATE SET
          template_name = EXCLUDED.template_name,
          min_manager_per_shift = EXCLUDED.min_manager_per_shift,
          night_rest_days = EXCLUDED.night_rest_days,
          include_pending_requests = EXCLUDED.include_pending_requests,
          max_monthly_overtime_hours = EXCLUDED.max_monthly_overtime_hours,
          multi_store_weight = EXCLUDED.multi_store_weight,
          labor_cost_weight = EXCLUDED.labor_cost_weight,
          request_priority_weight = EXCLUDED.request_priority_weight,
          updated_at = NOW()
      `,
      [
        user.id,
        body.businessId,
        body.storeId,
        body.settings.templateName,
        body.settings.minManagerPerShift,
        body.settings.nightRestDays,
        body.settings.includePendingRequests,
        body.settings.maxMonthlyOvertimeHours,
        body.settings.multiStoreWeight,
        body.settings.laborCostWeight,
        body.settings.requestPriorityWeight,
      ],
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to save ai settings", error);
    return NextResponse.json({ message: "Failed to save ai settings." }, { status: 500 });
  }
}
