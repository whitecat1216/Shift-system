"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useAuth } from "./auth-context";
import { useAppState } from "./state";

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
};

type StatCard = {
  label: string;
  value: string;
  detail: string;
};

type PanelRow = {
  primary: string;
  secondary: string;
  meta: string;
  tone?: "neutral" | "warning" | "success";
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "ダッシュボード", shortLabel: "ダ" },
  { href: "/ai-shift", label: "AIシフト生成", shortLabel: "A" },
  { href: "/multi-store", label: "2店舗統合シフト", shortLabel: "2" },
  { href: "/shifts", label: "シフト表", shortLabel: "シ" },
  { href: "/requests", label: "希望休一覧", shortLabel: "希" },
  { href: "/leave-control", label: "有給・希望休管理", shortLabel: "有" },
  { href: "/leave-balance", label: "有給残日数管理", shortLabel: "残" },
  { href: "/labor-cost", label: "人件費管理", shortLabel: "人" },
  { href: "/staff", label: "スタッフ管理", shortLabel: "ス" },
];

export function AppShell({
  activePath,
  title,
  eyebrow,
  description,
  actions,
  children,
}: {
  activePath: string;
  title: string;
  eyebrow: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const auth = useAuth();
  const { dismissToast, hasUnsavedChanges, pendingChanges, toastItems } = useAppState();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const visibleNavItems = useMemo(
    () => navItems.filter((item) => auth.allowedPagePaths.includes(item.href)),
    [auth.allowedPagePaths],
  );
  const primaryMobileNav = visibleNavItems.slice(0, 5);

  const isForbiddenPath = !auth.allowedPagePaths.includes(activePath) && pathname !== "/login";

  useEffect(() => {
    if (isForbiddenPath) {
      router.replace(auth.allowedPagePaths[0] ?? "/login");
    }
  }, [auth.allowedPagePaths, isForbiddenPath, router]);

  useEffect(() => {
    if (toastItems.length === 0) {
      return;
    }

    const timers = toastItems.map((item) =>
      window.setTimeout(() => {
        dismissToast(item.id);
      }, 2600),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [dismissToast, toastItems]);

  if (isForbiddenPath) {
    return null;
  }

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f4f7fb_0%,#edf2f7_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[244px] flex-col bg-[#071b34] text-white shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)] lg:flex">
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-6">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-400/90 font-black text-[#071b34]">
              S
            </div>
            <div>
              <p className="text-base font-semibold">Shift Pilot</p>
              <p className="text-xs text-slate-300">業種横断シフト管理システム</p>
            </div>
          </div>

          <nav className="flex-1 px-3 py-5">
            <p className="px-3 text-[11px] font-semibold tracking-[0.28em] text-slate-400">
              MAIN
            </p>
            <ul className="mt-3 space-y-1">
              {visibleNavItems.map((item) => {
                const active = item.href === activePath;

                return (
                  <li key={item.href}>
                    <Link
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                        active
                          ? "bg-[#0d2a4f] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                      href={item.href}
                    >
                      <span className="grid h-5 w-5 place-items-center rounded-md border border-white/20 text-[10px]">
                        {item.shortLabel}
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-white/10 px-5 py-5">
            <p className="text-sm font-semibold text-white">{auth.displayName}</p>
            <p className="mt-1 text-xs text-slate-400">{auth.email}</p>
            <button
              className="mt-4 w-full rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              disabled={isLoggingOut}
              onClick={handleLogout}
              type="button"
            >
              {isLoggingOut ? "ログアウト中..." : "ログアウト"}
            </button>
          </div>
        </aside>

        <section className="flex-1 px-3 pb-28 pt-3 sm:p-6 lg:p-8 lg:pb-8">
          <div className="mb-3 rounded-[24px] bg-[#071b34] p-4 text-white shadow-[0_18px_40px_rgba(7,27,52,0.18)] lg:hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/90 font-black text-[#071b34]">
                  S
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">{eyebrow}</p>
                  <p className="truncate text-lg font-bold leading-tight">{title}</p>
                  <p className="mt-1 text-xs text-slate-300">{auth.displayName}</p>
                </div>
              </div>
              <button
                className="shrink-0 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-slate-100"
                disabled={isLoggingOut}
                onClick={handleLogout}
                type="button"
              >
                {isLoggingOut ? "..." : "ログアウト"}
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
            <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
              {primaryMobileNav.map((item) => {
                const active = item.href === activePath;

                return (
                  <Link
                    key={item.href}
                    className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold ${
                      active ? "bg-white text-[#071b34]" : "bg-white/10 text-slate-200"
                    }`}
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 sm:rounded-[28px]">
            <header className="border-b border-slate-200 px-4 py-5 sm:px-6 sm:py-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="lg:hidden">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                      {eyebrow}
                    </p>
                    <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-900">{title}</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                    {eyebrow}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                      {auth.roleCodes.includes("admin") ? "管理者" : "担当者"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{description}</p>
                  <p className="mt-2 text-xs font-medium text-slate-400">{auth.displayName}</p>
                </div>
                {actions ? (
                  <div className="grid w-full gap-2 sm:grid-cols-2 lg:flex lg:w-auto lg:flex-wrap lg:gap-3">
                    {actions}
                  </div>
                ) : null}
              </div>
            </header>

            {hasUnsavedChanges ? (
              <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 sm:px-6">
                未保存変更を反映中です。保存キュー {pendingChanges} 件
              </div>
            ) : null}

            <div className="p-4 sm:p-6">{children}</div>
          </div>
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-12px_40px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        <ul className="grid grid-cols-5 gap-1">
          {primaryMobileNav.map((item) => {
            const active = item.href === activePath;

            return (
              <li key={item.href}>
                <Link
                  className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-center text-[10px] font-semibold ${
                    active ? "bg-[#0d2a4f] text-white" : "text-slate-500"
                  }`}
                  href={item.href}
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full border border-current/20 text-[10px]">
                    {item.shortLabel}
                  </span>
                  <span className="leading-tight sm:hidden">{item.shortLabel}</span>
                  <span className="hidden text-[11px] leading-tight sm:inline">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="pointer-events-none fixed left-3 right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-40 flex flex-col gap-3 sm:left-auto sm:right-4 sm:w-[min(360px,calc(100vw-2rem))]">
        {toastItems.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto rounded-2xl border px-4 py-3 text-sm font-medium shadow-[0_18px_40px_rgba(15,23,42,0.12)] ${
              item.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span>{item.message}</span>
              <button
                className="rounded-lg px-2 py-1 text-xs font-semibold opacity-70 transition hover:opacity-100"
                onClick={() => dismissToast(item.id)}
                type="button"
              >
                閉じる
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export function StatGrid({ items }: { items: StatCard[] }) {
  return (
    <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <section
          key={item.label}
          className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
        >
          <p className="text-xs font-semibold tracking-wide text-slate-500">{item.label}</p>
          <p className="mt-2 text-[1.65rem] font-bold tracking-tight text-slate-900 sm:text-3xl">{item.value}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{item.detail}</p>
        </section>
      ))}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function InfoList({ rows }: { rows: PanelRow[] }) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div
          key={`${row.primary}-${row.meta}`}
          className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div>
            <p className="text-sm font-semibold leading-6 text-slate-800">{row.primary}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">{row.secondary}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              row.tone === "warning"
                ? "bg-amber-100 text-amber-700"
                : row.tone === "success"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-600"
            }`}
          >
            {row.meta}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ProgressTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <div key={row.join("-")} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {row.map((cell, index) => (
              <div key={`${cell}-${index}`} className={index === 0 ? "" : "mt-2"}>
                <p className="text-[11px] font-semibold tracking-wide text-slate-400">
                  {headers[index]}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700">{cell}</p>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 md:block">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-[#0d2a4f] text-white">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-4 py-3 text-left font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.join("-")} className="border-t border-slate-200 bg-white">
                {row.map((cell, index) => (
                  <td key={`${cell}-${index}`} className="px-4 py-3 text-slate-600">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ActionButton({
  label,
  variant = "primary",
  onClick,
}: {
  label: string;
  variant?: "primary" | "secondary";
  onClick?: () => void;
}) {
  return (
    <button
      className={
        variant === "primary"
          ? "w-full rounded-xl bg-[#0d2a4f] px-4 py-3 text-sm font-semibold text-white sm:w-auto sm:py-2"
          : "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 sm:w-auto sm:py-2"
      }
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
