"use client";

import Link from "next/link";
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

export default function DashboardPage() {
  const { state, selectedStoreName, setSelectedStore, togglePublished } = useAppState();
  const fillRate = calculateFillRate(state);
  const laborCost = calculateLaborCost(state);
  const pendingRequests = countRequestStatus(state.leaveRequests, "pending");
  const adjustingRequests = countRequestStatus(state.leaveRequests, "adjusting");
  const coverage = calculateCoverage(state);

  const shortageCount = state.shiftRequirements
    .filter((item) => item.storeId === state.selectedStoreId)
    .filter((item) => coverage[item.code][item.day - 1] < item.required).length;

  return (
    <AppShell
      activePath="/dashboard"
      eyebrow="Overview"
      title="ダッシュボード"
      description={`${selectedStoreName}の運用状況をリアルタイムに確認できます。`}
      actions={
        <>
          <select
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
            onChange={(event) => setSelectedStore(event.target.value as typeof state.selectedStoreId)}
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
            今月のシフトを開く
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <StatGrid
          items={[
            { label: "シフト充足率", value: `${fillRate}%`, detail: `${selectedStoreName}の必要人数比` },
            { label: "未確定シフト", value: `${shortageCount}件`, detail: "不足または未入力セル" },
            { label: "希望休申請", value: `${state.leaveRequests.length}件`, detail: `承認待ち ${pendingRequests}件` },
            { label: "今月人件費", value: `¥${laborCost.toLocaleString()}`, detail: state.published ? "公開中" : "下書き中" },
          ]}
        />

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
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
                  meta: state.published ? "公開中" : "下書き",
                },
              ]}
            />
          </SectionCard>

          <SectionCard
            title="店舗別の進捗"
            description="現在はローカル状態ベースで進捗を計算しています。"
          >
            <ProgressTable
              headers={["店舗", "進捗", "充足率", "公開"]}
              rows={state.stores.map((store) => [
                store.name,
                store.id === state.selectedStoreId ? "編集中" : "確認中",
                `${store.id === state.selectedStoreId ? fillRate : Math.max(fillRate - 3, 82)}%`,
                store.id === state.selectedStoreId && state.published ? "公開中" : "下書き",
              ])}
            />
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
