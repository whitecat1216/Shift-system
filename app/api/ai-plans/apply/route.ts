import { NextResponse } from "next/server";
import { businessIds, type BusinessId } from "@/app/(app)/business-config";
import { getCurrentUser } from "@/lib/auth";
import { applyScopedAiPlan } from "@/lib/scoped-app-state";

function isBusinessId(value: string): value is BusinessId {
  return businessIds.includes(value as BusinessId);
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      businessId?: string;
      planId?: string;
      monthLabel?: string;
      storeId?: string;
    };

    if (!body.businessId || !isBusinessId(body.businessId) || !body.planId || !body.storeId) {
      return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
    }

    await applyScopedAiPlan(user, {
      businessId: body.businessId,
      planId: body.planId,
      monthLabel: body.monthLabel ?? "2026年3月",
      storeId: body.storeId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to apply AI plan", error);
    return NextResponse.json({ message: "Failed to apply AI plan." }, { status: 500 });
  }
}
