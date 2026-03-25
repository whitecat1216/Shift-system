"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell, InfoList, SectionCard, StatGrid } from "../ui";
import { calculateLaborCost, calculateFillRate, useAppState } from "../state";

export default function LaborCostPage() {
  const { state, businessConfig } = useAppState();
  const laborCost = calculateLaborCost(state, businessConfig);
  const [mobileView, setMobileView] = useState<"summary" | "budget">("summary");
  const [budget, setBudget] = useState(4_430_000);
  const [draftBudget, setDraftBudget] = useState("4430000");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let ignore = false;

    void fetch(
      `/api/labor-budget?business=${state.businessId}&store=${state.selectedStoreId}&month=${encodeURIComponent(state.currentMonth)}`,
      { cache: "no-store" },
    )
      .then((response) => response.json())
      .then((payload: { budget?: { budgetAmount: number } | null }) => {
        if (!ignore && payload.budget?.budgetAmount) {
          setBudget(payload.budget.budgetAmount);
          setDraftBudget(String(payload.budget.budgetAmount));
        }
      });

    return () => {
      ignore = true;
    };
  }, [state.businessId, state.currentMonth, state.selectedStoreId]);

  const diff = budget - laborCost;
  const fillRate = calculateFillRate(state, businessConfig);
  const nightAllowance = useMemo(() => Math.round(laborCost * 0.14), [laborCost]);

  async function saveBudget() {
    const nextBudget = Number(draftBudget);
    if (!Number.isFinite(nextBudget) || nextBudget < 0) {
      return;
    }

    setIsSaving(true);

    try {
      await fetch("/api/labor-budget", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: state.businessId,
          storeId: state.selectedStoreId,
          monthLabel: state.currentMonth,
          budgetAmount: nextBudget,
        }),
      });

      setBudget(nextBudget);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell
      activePath="/labor-cost"
      eyebrow="Cost"
      title={businessConfig.labels.laborCostTitle}
      description="担当者の権限スコープ内で、人件費見込みと月次予算を DB ベースで管理します。"
    >
      <div className="space-y-6">
        <StatGrid
          items={[
            { label: "今月予算", value: `¥${budget.toLocaleString()}`, detail: "選択店舗の DB 予算" },
            { label: "見込み実績", value: `¥${laborCost.toLocaleString()}`, detail: `予算比 ${diff >= 0 ? "-" : "+"}¥${Math.abs(diff).toLocaleString()}` },
            { label: "深夜手当相当", value: `¥${nightAllowance.toLocaleString()}`, detail: "夜勤セルから簡易算出" },
            { label: "充足率", value: `${fillRate}%`, detail: "シフト充足と人件費を併読" },
          ]}
        />

        <div className="space-y-3 lg:hidden">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            <button
              className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                mobileView === "summary" ? "bg-[#0d2a4f] text-white" : "text-slate-600"
              }`}
              onClick={() => setMobileView("summary")}
              type="button"
            >
              概要
            </button>
            <button
              className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                mobileView === "budget" ? "bg-[#0d2a4f] text-white" : "text-slate-600"
              }`}
              onClick={() => setMobileView("budget")}
              type="button"
            >
              予算編集
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className={mobileView === "budget" ? "block" : "hidden lg:block"}>
            <SectionCard title="予算設定" description="月・店舗ごとの人件費予算を保存できます。">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    対象: {state.currentMonth} / {state.stores.find((store) => store.id === state.selectedStoreId)?.name}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">¥{budget.toLocaleString()}</p>
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base sm:text-sm"
                      inputMode="numeric"
                      onChange={(event) => setDraftBudget(event.target.value)}
                      value={draftBudget}
                    />
                    <div className="grid gap-2 sm:flex sm:flex-wrap sm:gap-3">
                      <button
                        className="rounded-xl bg-[#0d2a4f] px-4 py-3 text-sm font-semibold text-white sm:py-2"
                        onClick={saveBudget}
                        type="button"
                      >
                        {isSaving ? "保存中..." : "予算を保存"}
                      </button>
                      <button
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 sm:py-2"
                        onClick={() => {
                          setDraftBudget(String(budget));
                          setIsEditing(false);
                        }}
                        type="button"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 sm:w-auto sm:py-2"
                    onClick={() => setIsEditing(true)}
                    type="button"
                  >
                    予算を編集
                  </button>
                )}
              </div>
            </SectionCard>
          </div>

          <div className={mobileView === "summary" ? "block" : "hidden lg:block"}>
            <SectionCard title="注視ポイント" description="現在のフロント状態から動的に計算したコメントです。">
              <InfoList
                rows={[
                  {
                    primary: diff < 0 ? "予算超過の可能性あり" : "現状は予算内",
                    secondary: "シフト表の変更はここに即時反映されます。",
                    meta: diff < 0 ? "注視" : "良好",
                    tone: diff < 0 ? "warning" : "success",
                  },
                  {
                    primary: `夜勤対応スタッフは ${state.staff.filter((member) => member.nightAvailable).length} 名`,
                    secondary: "夜勤セルの増加は手当率にそのまま効きます。",
                    meta: "構成",
                  },
                  {
                    primary: `公開状態: ${state.published ? "公開中" : "下書き"}`,
                    secondary: "確定版作成後もコスト確認を続けられます。",
                    meta: "状態",
                  },
                ]}
              />
            </SectionCard>
          </div>

          <div className={mobileView === "summary" ? "block" : "hidden lg:block"}>
            <SectionCard title="集計メモ" description="予算も実績も DB/API を基準に扱える状態です。">
              <div className="space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  DB 上のシフト割当とスタッフ時給から勤務時間を集計し、人件費を算出しています。
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  月次予算は担当者スコープで保存され、同じ店舗・月を開くと再取得されます。
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  将来は勤怠実績テーブルへ差し替えることで、実績ベースの人件費へ移行できます。
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
