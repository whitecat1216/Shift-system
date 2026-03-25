import { NextResponse } from "next/server";
import { businessIds, type BusinessId } from "@/app/(app)/business-config";
import { getCurrentUser } from "@/lib/auth";
import { createScopedStaff } from "@/lib/scoped-app-state";

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
      name?: string;
      storeId?: string;
      employmentType?: string;
      qualification?: string;
      role?: string;
      hourlyWage?: number;
      nightAvailable?: boolean;
      multiStoreAvailable?: boolean;
    };

    if (!body.businessId || !isBusinessId(body.businessId) || !body.name || !body.storeId) {
      return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
    }

    await createScopedStaff(user, {
      businessId: body.businessId,
      name: body.name,
      storeId: body.storeId,
      employmentType: body.employmentType ?? "",
      qualification: body.qualification ?? "",
      role: body.role ?? "",
      hourlyWage: body.hourlyWage ?? 0,
      nightAvailable: Boolean(body.nightAvailable),
      multiStoreAvailable: Boolean(body.multiStoreAvailable),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to create staff", error);
    return NextResponse.json({ message: "Failed to create staff." }, { status: 500 });
  }
}
