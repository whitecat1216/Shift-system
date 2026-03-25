import { NextResponse } from "next/server";
import { businessIds, type BusinessId } from "@/app/(app)/business-config";
import { getCurrentUser } from "@/lib/auth";
import { setScopedPublishState } from "@/lib/scoped-app-state";

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
      storeId?: string;
      monthLabel?: string;
      published?: boolean;
    };

    if (!body.businessId || !isBusinessId(body.businessId) || !body.storeId || typeof body.published !== "boolean") {
      return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
    }

    await setScopedPublishState(user, {
      businessId: body.businessId,
      storeId: body.storeId,
      monthLabel: body.monthLabel ?? "2026年3月",
      published: body.published,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update publish state", error);
    return NextResponse.json({ message: "Failed to update publish state." }, { status: 500 });
  }
}
