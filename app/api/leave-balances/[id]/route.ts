import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateScopedLeaveBalance } from "@/lib/scoped-page-data";

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
      remainingDays?: number;
      usedDays?: number;
    };

    if (typeof body.remainingDays !== "number" || typeof body.usedDays !== "number") {
      return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
    }

    await updateScopedLeaveBalance(user, {
      balanceId: id,
      remainingDays: body.remainingDays,
      usedDays: body.usedDays,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update leave balance", error);
    return NextResponse.json({ message: "Failed to update leave balance." }, { status: 500 });
  }
}
