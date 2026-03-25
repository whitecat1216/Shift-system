"use client";

import { useEffect, useState } from "react";
import type { AiSettings } from "../mock-data";
import { AppShell, InfoList, SectionCard, StatGrid } from "../ui";
import { calculateFillRate, countRequestStatus, useAppState } from "../state";

type AiHistoryRow = {
  id: string;
  planName: string;
  monthLabel: string;
  adoptedAt: string;
  fillRate: number;
  overtimeDelta: number;
  violations: number;
  storeName: string | null;
  notes: string | null;
};

export default function AiShiftPage() {
  const { state, businessConfig, generateAiPlans, applyAiPlan, refreshFromServer } = useAppState();
  const appliedPlan = state.aiPlans.find((plan) => plan.applied);
  const [mobileView, setMobileView] = useState<"summary" | "settings" | "history">("summary");
  const [settings, setSettings] = useState<AiSettings>(state.aiSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [historyRows, setHistoryRows] = useState<AiHistoryRow[]>([]);

  useEffect(() => {
    setSettings(state.aiSettings);
  }, [state.aiSettings]);

  useEffect(() => {
    let ignore = false;

    void fetch(
      `/api/ai-settings?business=${state.businessId}&store=${state.selectedStoreId}&month=${encodeURIComponent(state.currentMonth)}`,
      { cache: "no-store" },
    )
      .then((response) => response.json())
      .then((payload: { settings?: AiSettings }) => {
        if (!ignore && payload.settings) {
          setSettings(payload.settings);
        }
      });

    return () => {
      ignore = true;
    };
  }, [state.businessId, state.currentMonth, state.selectedStoreId]);

  useEffect(() => {
    let ignore = false;

    void fetch(`/api/ai-plan-history?business=${state.businessId}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { rows?: AiHistoryRow[] }) => {
        if (!ignore) {
          setHistoryRows(payload.rows ?? []);
        }
      });

    return () => {
      ignore = true;
    };
  }, [state.businessId, state.aiPlans]);

  async function saveSettingsAndRefresh() {
    setIsSaving(true);

    try {
      await fetch("/api/ai-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: state.businessId,
          storeId: state.selectedStoreId,
          settings,
        }),
      });
      await refreshFromServer();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell
      activePath="/ai-shift"
      eyebrow="Generation"
      title={businessConfig.labels.aiTitle}
      description="制約条件を保存し、その条件で AI 案を再評価できます。採用結果は勤務表へ反映されます。"
      actions={
        <>
          <button
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
            onClick={saveSettingsAndRefresh}
            type="button"
          >
            {isSaving ? "保存中..." : "条件を保存"}
          </button>
          <button
            className="rounded-xl bg-[#0d2a4f] px-4 py-2 text-sm font-semibold text-white"
            onClick={generateAiPlans}
            type="button"
          >
            再評価
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <StatGrid
          items={[
            { label: "最新生成", value: `${state.aiPlans.length}案`, detail: `${state.currentMonth} / ${state.stores.find((store) => store.id === state.selectedStoreId)?.name}` },
            { label: "充足率平均", value: `${calculateFillRate(state, businessConfig)}%`, detail: "現在の採用案ベース" },
            { label: "承認待ち申請", value: `${countRequestStatus(state.leaveRequests, "pending")}件`, detail: settings.includePendingRequests ? "制約に含める" : "制約から除外" },
            { label: "採用中", value: appliedPlan?.name ?? "-", detail: appliedPlan?.notes ?? "未選択" },
          ]}
        />

        <div className="space-y-3 xl:hidden">
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            <button
              className={`rounded-xl px-3 py-3 text-sm font-semibold ${
                mobileView === "summary" ? "bg-[#0d2a4f] text-white" : "text-slate-600"
              }`}
              onClick={() => setMobileView("summary")}
              type="button"
            >
              概要
            </button>
            <button
              className={`rounded-xl px-3 py-3 text-sm font-semibold ${
                mobileView === "settings" ? "bg-[#0d2a4f] text-white" : "text-slate-600"
              }`}
              onClick={() => setMobileView("settings")}
              type="button"
            >
              条件
            </button>
            <button
              className={`rounded-xl px-3 py-3 text-sm font-semibold ${
                mobileView === "history" ? "bg-[#0d2a4f] text-white" : "text-slate-600"
              }`}
              onClick={() => setMobileView("history")}
              type="button"
            >
              履歴
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className={mobileView === "settings" ? "block" : "hidden xl:block"}>
            <SectionCard
              title="生成条件"
              description="保存した条件は、担当者・業種・店舗単位で DB に保持されます。"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">テンプレート名</span>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-base sm:text-sm"
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, templateName: event.target.value }))
                    }
                    value={settings.templateName}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">各シフトの責任者人数</span>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-base sm:text-sm"
                    min={0}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        minManagerPerShift: Number(event.target.value),
                      }))
                    }
                    type="number"
                    value={settings.minManagerPerShift}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">夜勤後の休息日数</span>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-base sm:text-sm"
                    min={0}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        nightRestDays: Number(event.target.value),
                      }))
                    }
                    type="number"
                    value={settings.nightRestDays}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">月間残業上限</span>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-base sm:text-sm"
                    min={0}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        maxMonthlyOvertimeHours: Number(event.target.value),
                      }))
                    }
                    type="number"
                    value={settings.maxMonthlyOvertimeHours}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">兼務活用ウェイト</span>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                    max={100}
                    min={0}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        multiStoreWeight: Number(event.target.value),
                      }))
                    }
                    type="range"
                    value={settings.multiStoreWeight}
                  />
                  <p className="mt-1 text-xs text-slate-500">{settings.multiStoreWeight}</p>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">人件費ウェイト</span>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                    max={100}
                    min={0}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        laborCostWeight: Number(event.target.value),
                      }))
                    }
                    type="range"
                    value={settings.laborCostWeight}
                  />
                  <p className="mt-1 text-xs text-slate-500">{settings.laborCostWeight}</p>
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-semibold text-slate-700">申請優先ウェイト</span>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                    max={100}
                    min={0}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        requestPriorityWeight: Number(event.target.value),
                      }))
                    }
                    type="range"
                    value={settings.requestPriorityWeight}
                  />
                  <p className="mt-1 text-xs text-slate-500">{settings.requestPriorityWeight}</p>
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:col-span-2">
                  <input
                    checked={settings.includePendingRequests}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        includePendingRequests: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  <span className="text-sm text-slate-700">承認待ち申請も制約に含める</span>
                </label>
              </div>
            </SectionCard>
          </div>

          <div className={mobileView === "summary" ? "block" : "hidden xl:block"}>
            <SectionCard
              title="生成結果サマリ"
              description="保存済み条件でサーバー側再計算した案を表示します。"
            >
              <div className="space-y-3">
                {state.aiPlans.map((plan) => (
                  <div key={plan.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{plan.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{plan.notes}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${plan.applied ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                        {plan.applied ? "採用中" : "未採用"}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                      <div>充足率 {plan.fillRate}%</div>
                      <div>残業差分 {plan.overtimeDelta}h</div>
                      <div>違反件数 {plan.violations}件</div>
                    </div>
                    <button
                      className="mt-4 w-full rounded-xl bg-[#0d2a4f] px-4 py-3 text-sm font-semibold text-white sm:w-auto sm:py-2"
                      onClick={() => applyAiPlan(plan.id)}
                      type="button"
                    >
                      この案を採用
                    </button>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>

        <div className={mobileView === "summary" ? "block" : "hidden xl:block"}>
          <SectionCard
            title="評価ポイント"
            description="現在の保存条件から、評価ロジックへ反映している内容です。"
          >
            <InfoList
              rows={[
                {
                  primary: `責任者を各シフト ${settings.minManagerPerShift} 名以上`,
                  secondary: "責任者不足がある案は違反件数として重く扱います。",
                  meta: "固定条件",
                },
                {
                  primary: `夜勤後は ${settings.nightRestDays} 日休息`,
                  secondary: "休息日数が多いほど、充足率より負荷分散を優先します。",
                  meta: "勤務制約",
                },
                {
                  primary: `申請優先 ${settings.requestPriorityWeight} / 人件費 ${settings.laborCostWeight}`,
                  secondary: `承認待ち申請 ${countRequestStatus(state.leaveRequests, "pending")} 件を ${
                    settings.includePendingRequests ? "評価に含めています" : "評価から除外しています"
                  }。`,
                  meta: "重み付け",
                },
              ]}
            />
          </SectionCard>
        </div>

        <div className={mobileView === "history" ? "block" : "hidden xl:block"}>
          <SectionCard
            title="採用履歴"
            description="どの担当者が、どの店舗・どの月でどの案を採用したかを DB に保存しています。"
          >
            <div className="space-y-3">
              {historyRows.map((row) => (
                <div key={row.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{row.planName}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {row.monthLabel} / {row.storeName ?? "全体"} / {new Date(row.adoptedAt).toLocaleString("ja-JP")}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                      充足率 {row.fillRate}%
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    残業差分 {row.overtimeDelta}h / 違反 {row.violations}件 / {row.notes ?? "メモなし"}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
