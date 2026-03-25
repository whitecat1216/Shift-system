import { NextResponse } from "next/server";
import { businessIds, type BusinessId } from "@/app/(app)/business-config";
import { getCurrentUser } from "@/lib/auth";
import { updateScopedShiftAssignment } from "@/lib/scoped-app-state";

function isBusinessId(value: string): value is BusinessId {
  return businessIds.includes(value as BusinessId);
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      businessId?: string;
      staffId?: string;
      day?: number;
      code?: string;
      monthLabel?: string;
    };

    if (
      !body.businessId ||
      !isBusinessId(body.businessId) ||
      !body.staffId ||
      !body.code ||
      typeof body.day !== "number"
    ) {
      return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
    }

    await updateScopedShiftAssignment(user, {
      businessId: body.businessId,
      staffId: body.staffId,
      day: body.day,
      code: body.code,
      monthLabel: body.monthLabel ?? "2026年3月",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update shift assignment", error);
    return NextResponse.json({ message: "Failed to update shift assignment." }, { status: 500 });
  }
}
