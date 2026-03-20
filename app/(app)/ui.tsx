import Link from "next/link";
import { ReactNode } from "react";

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

const primaryMobileNav = navItems.slice(0, 5);

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
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f4f7fb_0%,#edf2f7_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[244px] flex-col bg-[#071b34] text-white shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)] lg:flex">
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-6">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-400/90 font-black text-[#071b34]">
              H
            </div>
            <div>
              <p className="text-base font-semibold">Hotel Shift AI</p>
              <p className="text-xs text-slate-300">シフト管理システム</p>
            </div>
          </div>

          <nav className="flex-1 px-3 py-5">
            <p className="px-3 text-[11px] font-semibold tracking-[0.28em] text-slate-400">
              MAIN
            </p>
            <ul className="mt-3 space-y-1">
              {navItems.map((item) => {
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
        </aside>

        <section className="flex-1 px-3 pb-24 pt-3 sm:p-6 lg:p-8 lg:pb-8">
          <div className="mb-3 rounded-[24px] bg-[#071b34] p-4 text-white shadow-[0_18px_40px_rgba(7,27,52,0.18)] lg:hidden">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/90 font-black text-[#071b34]">
                H
              </div>
              <div>
                <p className="text-base font-semibold">Hotel Shift AI</p>
                <p className="text-xs text-slate-300">スマホ運用プレビュー</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {navItems.map((item) => {
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

          <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 sm:rounded-[28px]">
            <header className="border-b border-slate-200 px-6 py-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                    {eyebrow}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                      Demo
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{description}</p>
                </div>
                {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
              </div>
            </header>

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
                  className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-center text-[11px] font-semibold ${
                    active ? "bg-[#0d2a4f] text-white" : "text-slate-500"
                  }`}
                  href={item.href}
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full border border-current/20 text-[10px]">
                    {item.shortLabel}
                  </span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </main>
  );
}

export function StatGrid({ items }: { items: StatCard[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <section
          key={item.label}
          className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5"
        >
          <p className="text-sm font-medium text-slate-500">{item.label}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{item.value}</p>
          <p className="mt-2 text-sm text-slate-500">{item.detail}</p>
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
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
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
          className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
        >
          <div>
            <p className="text-sm font-semibold text-slate-800">{row.primary}</p>
            <p className="mt-1 text-sm text-slate-500">{row.secondary}</p>
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
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
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
          ? "rounded-xl bg-[#0d2a4f] px-4 py-2 text-sm font-semibold text-white"
          : "rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
      }
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
