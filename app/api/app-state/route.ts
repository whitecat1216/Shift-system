import { NextResponse } from "next/server";
import { businessIds, type BusinessId } from "@/app/(app)/business-config";
import { getCurrentUser } from "@/lib/auth";
import { getScopedAppState } from "@/lib/scoped-app-state";

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
    const business = searchParams.get("business");
    const month = searchParams.get("month") ?? "2026年3月";

    if (!business || !isBusinessId(business)) {
      return NextResponse.json({ message: "Invalid business." }, { status: 400 });
    }

    const state = await getScopedAppState(user, business, month);
    return NextResponse.json(state);
  } catch (error) {
    console.error("Failed to load scoped app state", error);
    return NextResponse.json({ message: "Failed to load app state." }, { status: 500 });
  }
}
