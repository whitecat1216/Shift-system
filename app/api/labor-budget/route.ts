import { NextResponse } from "next/server";
import { businessIds, type BusinessId } from "@/app/(app)/business-config";
import { getCurrentUser } from "@/lib/auth";
import { getScopedLaborBudget, updateScopedLaborBudget } from "@/lib/scoped-page-data";

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

    const budget = await getScopedLaborBudget(user, businessId, storeId, monthLabel);
    return NextResponse.json({ budget });
  } catch (error) {
    console.error("Failed to load labor budget", error);
    return NextResponse.json({ message: "Failed to load labor budget." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      businessId?: string;
      storeId?: string;
      monthLabel?: string;
      budgetAmount?: number;
    };

    if (
      !body.businessId ||
      !isBusinessId(body.businessId) ||
      !body.storeId ||
      typeof body.budgetAmount !== "number"
    ) {
      return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
    }

    await updateScopedLaborBudget(user, {
      businessId: body.businessId,
      storeId: body.storeId,
      monthLabel: body.monthLabel ?? "2026年3月",
      budgetAmount: body.budgetAmount,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update labor budget", error);
    return NextResponse.json({ message: "Failed to update labor budget." }, { status: 500 });
  }
}
