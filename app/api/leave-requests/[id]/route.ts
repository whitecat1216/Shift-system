import { NextResponse } from "next/server";
import { businessIds, type BusinessId } from "@/app/(app)/business-config";
import type { RequestStatus } from "@/app/(app)/mock-data";
import { getCurrentUser } from "@/lib/auth";
import { updateScopedLeaveRequestStatus } from "@/lib/scoped-app-state";

function isBusinessId(value: string): value is BusinessId {
  return businessIds.includes(value as BusinessId);
}

function isRequestStatus(value: string): value is RequestStatus {
  return value === "pending" || value === "approved" || value === "adjusting" || value === "rejected";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = (await request.json()) as {
      businessId?: string;
      status?: string;
      note?: string;
    };

    if (!body.businessId || !isBusinessId(body.businessId) || !body.status || !isRequestStatus(body.status)) {
      return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
    }

    await updateScopedLeaveRequestStatus(user, {
      businessId: body.businessId,
      requestId: id,
      status: body.status,
      note: body.note ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update leave request", error);
    return NextResponse.json({ message: "Failed to update leave request." }, { status: 500 });
  }
}
