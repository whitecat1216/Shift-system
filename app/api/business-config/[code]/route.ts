import { NextResponse } from "next/server";
import { businessIds, type BusinessId } from "@/app/(app)/business-config";
import { getCurrentUser } from "@/lib/auth";
import { loadBusinessConfigFromDb } from "@/lib/business-config-db";

export const dynamic = "force-dynamic";

function isBusinessId(value: string): value is BusinessId {
  return businessIds.includes(value as BusinessId);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;

  if (!isBusinessId(code)) {
    return NextResponse.json({ message: "Business config not found." }, { status: 404 });
  }

  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!user.allowedBusinessIds.includes(code)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const config = await loadBusinessConfigFromDb(code);
    return NextResponse.json(config);
  } catch (error) {
    console.error(`Failed to load business config for ${code}`, error);
    return NextResponse.json(
      { message: "Failed to load business config." },
      { status: 500 },
    );
  }
}
