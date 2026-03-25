import { NextResponse } from "next/server";
import { businessIds, type BusinessId } from "@/app/(app)/business-config";
import { getCurrentUser } from "@/lib/auth";
import { getScopedLeaveBalances } from "@/lib/scoped-page-data";

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

    if (!business || !isBusinessId(business)) {
      return NextResponse.json({ message: "Invalid business." }, { status: 400 });
    }

    const rows = await getScopedLeaveBalances(user, business);
    return NextResponse.json({ rows });
  } catch (error) {
    console.error("Failed to load leave balances", error);
    return NextResponse.json({ message: "Failed to load leave balances." }, { status: 500 });
  }
}
