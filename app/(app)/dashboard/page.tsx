"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ActionButton,
  AppShell,
  InfoList,
  ProgressTable,
  SectionCard,
  StatGrid,
} from "../ui";
import {
  calculateFillRate,
  calculateLaborCost,
  calculateCoverage,
  countRequestStatus,
  useAppState,
} from "../state";
import { fetchBusinessTypes, type BusinessId } from "../business-config";
import { useAuth } from "../auth-context";

export default function DashboardPage() {
  const { state, businessConfig, selectedStoreName, setBusiness, setSelectedStore, togglePublished } = useAppState();
  const auth = useAuth();
  const [businessTypes, setBusinessTypes] = useState<Array<{ id: BusinessId; name: string }>>([
    { id: "hotel", name: "ホテル" },
    { id: "restaurant", name: "飲食店" },
  ]);
  const fillRate = calculateFillRate(state, businessConfig);
  const laborCost = calculateLaborCost(state, businessConfig);
  const pendingRequests = countRequestStatus(state.leaveRequests, "pending");
  const adjustingRequests = countRequestStatus(state.leaveRequests, "adjusting");
  const coverage = calculateCoverage(state, businessConfig);
  const shortageCount = state.shiftRequirements
    .filter((item) => item.storeId === state.selectedStoreId)
    .filter((item) => coverage[item.code][item.day - 1] < item.required).length;
  const roleLabel = auth.roleCodes.includes("admin") ? "管理者" : "担当者";
  const priorityTasks = [
    {
      title: shortageCount > 0 ? "不足シフトを埋める" : "シフトは安定しています",
      detail:
        shortageCount > 0
          ? `${shortageCount} 件の不足があります。今週のシフト表から埋めるのが最優先です。`
          : "不足している勤務帯はありません。このまま公開判断に進めます。",
      href: "/shifts",
      cta: "シフト表を開く",
      tone: shortageCount > 0 ? "warning" : "success",
    },
    {
      title: pendingRequests > 0 ? "申請を承認する" : "承認待ちはありません",
      detail:
        pendingRequests > 0
          ? `${pendingRequests} 件の承認待ちがあります。希望休一覧で優先的に処理してください。`
          : "申請一覧に未処理の依頼はありません。",
      href: "/requests",
      cta: "申請一覧を見る",
      tone: pendingRequests > 0 ? "warning" : "success",
    },
    {
      title: state.published ? "公開済みシフトを確認する" : "公開前チェックを行う",
      detail: state.published
        ? "公開中です。変更差分や人件費を確認して必要なら再公開してください。"
        : "下書き状態です。人件費と申請反映を確認した上で公開へ進めます。",
      href: "/labor-cost",
      cta: "人件費を確認",
      tone: "neutral" as const,
    },
  ];

  useEffect(() => {
    let ignore = false;

    void fetchBusinessTypes().then((items) => {
      if (!ignore && items.length > 0) {
        setBusinessTypes(items);
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <AppShell
      activePath="/dashboard"
      eyebrow="Overview"
      title={businessConfig.labels.dashboardTitle}
      description={`${selectedStoreName}の運用状況をリアルタイムに確認できます。`}
      actions={
        <>
          {auth.allowedBusinessIds.length > 1 ? (
            <select
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
              onChange={(event) => setBusiness(event.target.value as "hotel" | "restaurant")}
              value={state.businessId}
            >
              {businessTypes.map((businessType) => (
                <option key={businessType.id} value={businessType.id}>
                  {businessType.name}
                </option>
              ))}
            </select>
          ) : null}
          <select
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
            onChange={(event) => setSelectedStore(event.target.value)}
            value={state.selectedStoreId}
          >
            {state.stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
          <ActionButton
            label={state.published ? "公開を解除" : "公開状態にする"}
            onClick={togglePublished}
            variant="secondary"
          />
          <Link
            className="rounded-xl bg-[#0d2a4f] px-4 py-2 text-sm font-semibold text-white"
            href="/shifts"
          >
            今月の{businessConfig.labels.scheduleTitle}を開く
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <StatGrid
          items={[
            { label: "シフト充足率", value: `${fillRate}%`, detail: `${selectedStoreName}の必要人数比` },
            { label: "未確定シフト", value: `${shortageCount}件`, detail: "不足または未入力セル" },
            { label: businessConfig.labels.requestSingle, value: `${state.leaveRequests.length}件`, detail: `承認待ち ${pendingRequests}件` },
            { label: "今月人件費", value: `¥${laborCost.toLocaleString()}`, detail: `${roleLabel} / ${state.published ? businessConfig.labels.published : `${businessConfig.labels.draft}中`}` },
          ]}
        />

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <SectionCard
            title="今日の優先対応"
            description="いま見るべき項目だけを役割ベースで先に並べています。"
          >
            <div className="space-y-3">
              {priorityTasks.map((task) => (
                <div
                  key={task.title}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{task.detail}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        task.tone === "warning"
                          ? "bg-amber-100 text-amber-700"
                          : task.tone === "success"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {task.tone === "warning" ? "優先" : task.tone === "success" ? "安定" : "確認"}
                    </span>
                    <Link
                      className="rounded-xl bg-[#0d2a4f] px-4 py-2 text-sm font-semibold text-white"
                      href={task.href}
                    >
                      {task.cta}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="運用トピック"
            description="他画面で更新した結果がここへ集約されます。"
          >
            <InfoList
              rows={[
                {
                  primary: `${selectedStoreName}の不足シフトは ${shortageCount} 件`,
                  secondary: "シフト表からセルを修正するか、AI案の適用で埋められます。",
                  meta: shortageCount > 0 ? "要対応" : "安定",
                  tone: shortageCount > 0 ? "warning" : "success",
                },
                {
                  primary: `承認待ちの申請は ${pendingRequests} 件`,
                  secondary: "希望休一覧または有給・希望休管理から承認状態を更新できます。",
                  meta: pendingRequests > 0 ? "承認待ち" : "0件",
                  tone: pendingRequests > 0 ? "warning" : "success",
                },
                {
                  primary: `再調整中の申請は ${adjustingRequests} 件`,
                  secondary: "AIシフト生成で希望休優先案を使うと再調整がしやすくなります。",
                  meta: state.published ? businessConfig.labels.published : businessConfig.labels.draft,
                },
                {
                  primary: `${roleLabel}として利用中`,
                  secondary: `表示中の業種は ${businessTypes.find((item) => item.id === state.businessId)?.name ?? state.businessId} です。権限内の店舗だけを集計しています。`,
                  meta: `${state.stores.length}${businessConfig.labels.store}`,
                },
              ]}
            />
          </SectionCard>

          <SectionCard
            title="店舗別の進捗"
            description="ログイン中の担当者に許可された店舗だけを集計しています。"
          >
            <ProgressTable
              headers={[businessConfig.labels.store, "進捗", "充足率", "公開"]}
              rows={state.stores.map((store) => [
                store.name,
                store.id === state.selectedStoreId ? "編集中" : "確認中",
                `${store.id === state.selectedStoreId ? fillRate : Math.max(fillRate - 3, 82)}%`,
                store.id === state.selectedStoreId && state.published ? businessConfig.labels.published : businessConfig.labels.draft,
              ])}
            />
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
