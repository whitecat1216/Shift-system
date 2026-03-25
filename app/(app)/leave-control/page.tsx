"use client";

import { AppShell, InfoList, SectionCard, StatGrid } from "../ui";
import { countRequestStatus, getStaffName, useAppState } from "../state";

export default function LeaveControlPage() {
  const { state, businessConfig } = useAppState();
  const pendingRows: {
    primary: string;
    secondary: string;
    meta: string;
    tone: "neutral" | "warning" | "success";
  }[] = state.leaveRequests
    .filter((request) => request.status !== "approved")
    .map((request) => ({
      primary: `${getStaffName(state.staff, request.staffId)} の${request.type}申請`,
      secondary: `${request.days.join(", ")}日 / ${request.reason}${
        request.adjustmentNote ? ` / コメント: ${request.adjustmentNote}` : ""
      }${
        request.reviewedByName
          ? ` / 担当: ${request.reviewedByName}`
          : ""
      }`,
      meta:
        request.status === "pending"
          ? "要確認"
          : request.status === "adjusting"
            ? "要調整"
            : "却下",
      tone:
        request.status === "pending"
          ? "warning"
          : request.status === "adjusting"
            ? "neutral"
            : "success",
    }));

  return (
    <AppShell
      activePath="/leave-control"
      eyebrow="Control"
      title={businessConfig.labels.leaveControlTitle}
      description="希望休一覧と同じ状態を参照し、承認待ちを集約して確認できます。"
    >
      <div className="space-y-6">
        <StatGrid
          items={[
            { label: businessConfig.requestTypes[1] ?? businessConfig.labels.requestSingle, value: `${state.leaveRequests.filter((request) => request.type === businessConfig.requestTypes[1]).length}件`, detail: "担当者スコープで DB 集計" },
            { label: businessConfig.requestTypes[0] ?? businessConfig.labels.requestSingle, value: `${state.leaveRequests.filter((request) => request.type === businessConfig.requestTypes[0]).length}件`, detail: "申請一覧と連動" },
            { label: "承認待ち", value: `${countRequestStatus(state.leaveRequests, "pending")}件`, detail: "優先処理対象" },
            { label: "差し戻し/調整", value: `${countRequestStatus(state.leaveRequests, "adjusting")}件`, detail: "再調整が必要" },
          ]}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="処理待ち" description="申請状態を変えるとここも即時更新されます。">
            <InfoList rows={pendingRows} />
          </SectionCard>

          <SectionCard title="運用ルール" description="本実装時の判定ロジックを残しています。">
            <div className="space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                月末締めの7日前までの申請は原則自動反映、それ以降は店長承認を必須化。
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                繁忙日の希望休はAI生成前に不足影響を表示し、代替案を提案します。
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                承認済みデータはシフト確定前に再同期し、手動修正との差分を記録します。
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
