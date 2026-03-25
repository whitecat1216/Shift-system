import { NextResponse } from "next/server";
import { businessIds, type BusinessId } from "@/app/(app)/business-config";
import { getCurrentUser } from "@/lib/auth";
import { createScopedLeaveRequest } from "@/lib/scoped-app-state";

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
      staffId?: string;
      requestType?: string;
      days?: number[];
      reason?: string;
      monthLabel?: string;
    };

    if (
      !body.businessId ||
      !isBusinessId(body.businessId) ||
      !body.staffId ||
      !body.requestType ||
      !body.reason ||
      !Array.isArray(body.days) ||
      body.days.length === 0
    ) {
      return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
    }

    await createScopedLeaveRequest(user, {
      businessId: body.businessId,
      staffId: body.staffId,
      requestType: body.requestType,
      days: body.days,
      reason: body.reason,
      monthLabel: body.monthLabel ?? "2026年3月",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to create leave request", error);
    return NextResponse.json({ message: "Failed to create leave request." }, { status: 500 });
  }
}
