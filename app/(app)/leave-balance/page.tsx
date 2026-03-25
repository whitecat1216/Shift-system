"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppShell,
  SectionCard,
  StatGrid,
} from "../ui";
import { useAppState } from "../state";

type LeaveBalanceRow = {
  balanceId: string;
  staffId: string;
  staffName: string;
  grantedOn: string;
  remainingDays: number;
  usedDays: number;
  expiresOn: string | null;
};

export default function LeaveBalancePage() {
  const { state, businessConfig } = useAppState();
  const [rows, setRows] = useState<LeaveBalanceRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftRemaining, setDraftRemaining] = useState("");
  const [draftUsed, setDraftUsed] = useState("");

  useEffect(() => {
    let ignore = false;

    void fetch(`/api/leave-balances?business=${state.businessId}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { rows?: LeaveBalanceRow[] }) => {
        if (!ignore) {
          setRows(payload.rows ?? []);
        }
      });

    return () => {
      ignore = true;
    };
  }, [state.businessId]);

  const stats = useMemo(() => {
    const totalRemaining = rows.reduce((sum, row) => sum + row.remainingDays, 0);
    const expiringSoon = rows.filter((row) => row.expiresOn?.startsWith("2026-")).length;
    const average = rows.length > 0 ? (totalRemaining / rows.length).toFixed(1) : "0.0";
    const lowBalance = rows.filter((row) => row.remainingDays <= 3).length;
    return {
      totalRemaining,
      expiringSoon,
      average,
      lowBalance,
    };
  }, [rows]);

  return (
    <AppShell
      activePath="/leave-balance"
      eyebrow="Balance"
      title={businessConfig.labels.leaveBalanceTitle}
      description="担当者に許可されたスタッフの有給残日数を DB から集計して表示します。"
    >
      <div className="space-y-6">
        <StatGrid
          items={[
            { label: "対象スタッフ", value: `${rows.length}名`, detail: "権限スコープ内で集計" },
            { label: "失効予定", value: `${stats.expiringSoon}名`, detail: "当年内の失効予定" },
            { label: "平均残日数", value: `${stats.average}日`, detail: "表示中スタッフ平均" },
            { label: "要確認", value: `${stats.lowBalance}名`, detail: "残日数 3 日以下" },
          ]}
        />

        <SectionCard
          title="残日数一覧"
          description="付与・使用・失効予定を DB の残日数テーブルから表示しています。"
        >
          <div className="space-y-3">
            {rows.map((row) => {
              const isEditing = editingId === row.balanceId;

              return (
                <div key={row.balanceId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{row.staffName}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        付与日 {row.grantedOn} / 失効予定 {row.expiresOn ?? "なし"}
                      </p>
                    </div>

                    {isEditing ? (
                      <div className="grid gap-2 sm:grid-cols-3">
                        <input
                          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                          onChange={(event) => setDraftRemaining(event.target.value)}
                          placeholder="残日数"
                          value={draftRemaining}
                        />
                        <input
                          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                          onChange={(event) => setDraftUsed(event.target.value)}
                          placeholder="使用日数"
                          value={draftUsed}
                        />
                        <button
                          className="rounded-xl bg-[#0d2a4f] px-4 py-2 text-sm font-semibold text-white"
                          onClick={async () => {
                            await fetch(`/api/leave-balances/${row.balanceId}`, {
                              method: "PATCH",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                remainingDays: Number(draftRemaining),
                                usedDays: Number(draftUsed),
                              }),
                            });

                            setRows((current) =>
                              current.map((item) =>
                                item.balanceId === row.balanceId
                                  ? {
                                      ...item,
                                      remainingDays: Number(draftRemaining),
                                      usedDays: Number(draftUsed),
                                    }
                                  : item,
                              ),
                            );
                            setEditingId(null);
                          }}
                          type="button"
                        >
                          保存
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        <span>残日数 {row.remainingDays}日</span>
                        <span>今月使用 {row.usedDays}日</span>
                        <button
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600"
                          onClick={() => {
                            setEditingId(row.balanceId);
                            setDraftRemaining(String(row.remainingDays));
                            setDraftUsed(String(row.usedDays));
                          }}
                          type="button"
                        >
                          編集
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
