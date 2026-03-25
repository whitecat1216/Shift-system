"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        setErrorMessage(payload?.message ?? "ログインできませんでした。");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setErrorMessage("通信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#eff6ff_35%,#f8fafc_100%)] px-4 py-6 text-slate-900 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md items-center justify-center sm:min-h-[calc(100vh-5rem)]">
        <section className="w-full rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:rounded-[28px] sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#071b34] font-black text-white sm:h-14 sm:w-14">
              S
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:mt-5 sm:text-3xl">
              ログイン
            </h1>
          </div>

          <form className="mt-6 space-y-4 sm:mt-8 sm:space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">メールアドレス</span>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-[#0d2a4f] focus:ring-4 focus:ring-sky-100 sm:text-sm"
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">パスワード</span>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-[#0d2a4f] focus:ring-4 focus:ring-sky-100 sm:text-sm"
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </label>

            {errorMessage ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            ) : null}

            <button
              className="w-full rounded-2xl bg-[#0d2a4f] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#143763] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "ログイン中..." : "ログインする"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
