import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authenticateUser, createUserSession, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ message: "メールアドレスとパスワードを入力してください。" }, { status: 400 });
    }

    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json({ message: "ログイン情報が正しくありません。" }, { status: 401 });
    }

    const session = await createUserSession(user.id);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: session.expiresAt,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to login", error);
    return NextResponse.json({ message: "ログイン処理に失敗しました。" }, { status: 500 });
  }
}
