import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { revokeUserSession, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await revokeUserSession(token);
    }

    cookieStore.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to logout", error);
    return NextResponse.json({ message: "ログアウト処理に失敗しました。" }, { status: 500 });
  }
}
