import { NextResponse } from "next/server";
import { businessIds, type BusinessId } from "@/app/(app)/business-config";
import { getCurrentUser } from "@/lib/auth";
import { getScopedAiAdoptionHistory } from "@/lib/scoped-page-data";

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

    if (!businessId || !isBusinessId(businessId)) {
      return NextResponse.json({ message: "Invalid business." }, { status: 400 });
    }

    const rows = await getScopedAiAdoptionHistory(user, businessId);
    return NextResponse.json({ rows });
  } catch (error) {
    console.error("Failed to load ai plan history", error);
    return NextResponse.json({ message: "Failed to load ai plan history." }, { status: 500 });
  }
}
