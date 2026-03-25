import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getBusinessTypeSummaries } from "@/lib/business-config-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const businessTypes = (await getBusinessTypeSummaries()).filter((item) =>
      user.allowedBusinessIds.includes(item.id),
    );
    return NextResponse.json({ businessTypes });
  } catch (error) {
    console.error("Failed to load business types", error);
    return NextResponse.json(
      { message: "Failed to load business types." },
      { status: 500 },
    );
  }
}
