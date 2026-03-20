"use client";

import { AppShell, InfoList, SectionCard, StatGrid } from "../ui";
import { calculateFillRate, countRequestStatus, useAppState } from "../state";

export default function AiShiftPage() {
  const { state, generateAiPlans, applyAiPlan } = useAppState();
  const appliedPlan = state.aiPlans.find((plan) => plan.applied);

  return (
    <AppShell
      activePath="/ai-shift"
      eyebrow="Generation"
      title="AIシフト生成"
      description="AI案の再生成と採用切替ができます。採用結果はシフト表へ反映されます。"
      actions={
        <>
          <button
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
            onClick={generateAiPlans}
            type="button"
          >
            条件テンプレートを再評価
          </button>
          <button
            className="rounded-xl bg-[#0d2a4f] px-4 py-2 text-sm font-semibold text-white"
            onClick={generateAiPlans}
            type="button"
          >
            新規生成
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <StatGrid
          items={[
            { label: "最新生成", value: `${state.aiPlans.length}案`, detail: `${state.currentMonth} / ${state.stores.find((store) => store.id === state.selectedStoreId)?.name}` },
            { label: "充足率平均", value: `${calculateFillRate(state)}%`, detail: "現在の採用案ベース" },
            { label: "承認待ち申請", value: `${countRequestStatus(state.leaveRequests, "pending")}件`, detail: "希望休制約に含める対象" },
            { label: "採用中", value: appliedPlan?.name ?? "-", detail: appliedPlan?.notes ?? "未選択" },
          ]}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            title="生成条件"
            description="現時点ではローカル状態の条件を前提にしています。"
          >
            <InfoList
              rows={[
                {
                  primary: "夜勤後の連続勤務を禁止",
                  secondary: "翌日は必ず休み、または遅番のみ許可。",
                  meta: "必須",
                },
                {
                  primary: "ベテランを各シフトに1名以上配置",
                  secondary: "責任者資格を持つスタッフを優先。",
                  meta: "高優先",
                },
                {
                  primary: `希望休の承認待ち ${countRequestStatus(state.leaveRequests, "pending")} 件`,
                  secondary: "承認待ち申請は制約強度を落として比較対象に含めます。",
                  meta: "動的",
                },
              ]}
            />
          </SectionCard>

          <SectionCard
            title="生成結果サマリ"
            description="採用ボタンでシフト表の一部セルに反映します。"
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
                    className="mt-4 rounded-xl bg-[#0d2a4f] px-4 py-2 text-sm font-semibold text-white"
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
    </AppShell>
  );
}
