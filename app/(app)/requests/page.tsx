"use client";

import { FormEvent, useMemo, useState } from "react";
import { AppShell, SectionCard, StatGrid } from "../ui";
import { countRequestStatus, getStaffName, useAppState } from "../state";
import { RequestStatus } from "../mock-data";

const labels: Record<RequestStatus, string> = {
  pending: "承認待ち",
  approved: "承認済み",
  adjusting: "要調整",
  rejected: "却下",
};

export default function RequestsPage() {
  const { state, businessConfig, updateRequestStatus, addLeaveRequest } = useAppState();
  const [mobileView, setMobileView] = useState<"list" | "form">("list");
  const [filter, setFilter] = useState<RequestStatus | "all">("all");
  const [requestTypeFilter, setRequestTypeFilter] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [staffId, setStaffId] = useState(state.staff[0]?.id ?? "");
  const [requestType, setRequestType] = useState(businessConfig.requestTypes[0] ?? "");
  const [days, setDays] = useState("");
  const [reason, setReason] = useState("");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const requests = useMemo(
    () => {
      const normalizedKeyword = keyword.trim().toLowerCase();

      return state.leaveRequests
        .filter((request) => filter === "all" || request.status === filter)
        .filter((request) => requestTypeFilter === "all" || request.type === requestTypeFilter)
        .filter((request) => {
          if (!normalizedKeyword) return true;
          const staffName = getStaffName(state.staff, request.staffId).toLowerCase();
          return (
            staffName.includes(normalizedKeyword) ||
            request.reason.toLowerCase().includes(normalizedKeyword)
          );
        })
        .sort((left, right) => {
          const rank = { pending: 0, adjusting: 1, approved: 2, rejected: 3 } as const;
          return rank[left.status] - rank[right.status];
        });
    },
    [filter, keyword, requestTypeFilter, state.leaveRequests, state.staff],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedDays = days
      .split(",")
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => Number.isFinite(value) && value >= 1 && value <= 31);

    if (!staffId || parsedDays.length === 0 || !reason.trim()) {
      return;
    }

    addLeaveRequest({
      staffId,
      type: requestType,
      days: parsedDays,
      reason: reason.trim(),
    });
    setDays("");
    setReason("");
  }

  return (
    <AppShell
      activePath="/requests"
      eyebrow="Requests"
      title={businessConfig.labels.requestsTitle}
      description="申請一覧を確認し、その場で承認状態を更新できます。"
      actions={
        <>
          <input
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="名前・理由で検索"
            value={keyword}
          />
          <select
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
            onChange={(event) => setRequestTypeFilter(event.target.value)}
            value={requestTypeFilter}
          >
            <option value="all">申請種別: すべて</option>
            {businessConfig.requestTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
            onChange={(event) => setFilter(event.target.value as RequestStatus | "all")}
            value={filter}
          >
            <option value="all">状態: すべて</option>
            <option value="pending">承認待ち</option>
            <option value="approved">承認済み</option>
            <option value="adjusting">要調整</option>
            <option value="rejected">却下</option>
          </select>
        </>
      }
    >
      <div className="space-y-6">
        <StatGrid
          items={[
            { label: "申請総数", value: `${state.leaveRequests.length}件`, detail: `${state.currentMonth}提出分` },
            { label: "承認済み", value: `${countRequestStatus(state.leaveRequests, "approved")}件`, detail: "シフト反映済みを含む" },
            { label: "保留", value: `${countRequestStatus(state.leaveRequests, "pending")}件`, detail: "承認判断待ち" },
            { label: "要調整", value: `${countRequestStatus(state.leaveRequests, "adjusting")}件`, detail: "人員再配置が必要" },
          ]}
        />

        <div className="space-y-3 lg:hidden">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            <button
              className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                mobileView === "list" ? "bg-[#0d2a4f] text-white" : "text-slate-600"
              }`}
              onClick={() => setMobileView("list")}
              type="button"
            >
              一覧を見る
            </button>
            <button
              className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                mobileView === "form" ? "bg-[#0d2a4f] text-white" : "text-slate-600"
              }`}
              onClick={() => setMobileView("form")}
              type="button"
            >
              申請を追加
            </button>
          </div>

          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {(["all", "pending", "approved", "adjusting", "rejected"] as const).map((status) => (
              <button
                key={status}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold ${
                  filter === status
                    ? "bg-[#0d2a4f] text-white"
                    : "border border-slate-200 bg-white text-slate-600"
                }`}
                onClick={() => setFilter(status)}
                type="button"
              >
                {status === "all" ? "すべて" : labels[status]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className={mobileView === "form" ? "block" : "hidden lg:block"}>
            <SectionCard title="申請フォーム" description={`${businessConfig.requestTypes.join("・")} をこの画面から追加できます。`}>
              <form className="space-y-3" onSubmit={handleSubmit}>
                <select
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base sm:text-sm"
                  onChange={(event) => setStaffId(event.target.value)}
                  value={staffId}
                >
                  {state.staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base sm:text-sm"
                  onChange={(event) => setRequestType(event.target.value)}
                  value={requestType}
                >
                  {businessConfig.requestTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base sm:text-sm"
                  onChange={(event) => setDays(event.target.value)}
                  placeholder="希望日をカンマ区切りで入力 例: 14,15"
                  value={days}
                />
                <textarea
                  className="min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 text-base sm:text-sm"
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="理由"
                  value={reason}
                />
                <button
                  className="w-full rounded-xl bg-[#0d2a4f] px-4 py-3 text-sm font-semibold text-white"
                  type="submit"
                >
                  {businessConfig.labels.requestAdd}
                </button>
              </form>
            </SectionCard>
          </div>

          <div className={mobileView === "list" ? "block" : "hidden lg:block"}>
            <SectionCard title="申請一覧" description="状態変更はダッシュボードと有給管理画面にも反映されます。">
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  表示件数 {requests.length} 件
                  {keyword ? ` / 検索: ${keyword}` : ""}
                  {requestTypeFilter !== "all" ? ` / 種別: ${requestTypeFilter}` : ""}
                </div>
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {getStaffName(state.staff, request.staffId)} / {request.type}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          希望日: {request.days.join(", ")}日 / 理由: {request.reason}
                        </p>
                        {request.reviewedByName || request.reviewedAt ? (
                          <p className="mt-1 text-xs text-slate-400">
                            {request.reviewedByName ?? "担当者"} /{" "}
                            {request.reviewedAt
                              ? new Date(request.reviewedAt).toLocaleString("ja-JP")
                              : "時刻未記録"}
                          </p>
                        ) : null}
                        {request.adjustmentNote ? (
                          <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                            差し戻し理由: {request.adjustmentNote}
                          </p>
                        ) : null}
                      </div>
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                        {labels[request.status]}
                      </span>
                    </div>
                    <textarea
                      className="mt-4 min-h-20 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base sm:text-sm"
                      onChange={(event) =>
                        setReviewNotes((current) => ({
                          ...current,
                          [request.id]: event.target.value,
                        }))
                      }
                      placeholder="差し戻し理由・承認コメント"
                      value={reviewNotes[request.id] ?? request.adjustmentNote ?? ""}
                    />
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                      {(["approved", "pending", "adjusting", "rejected"] as RequestStatus[]).map(
                        (status) => (
                          <button
                            key={status}
                            className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                              request.status === status
                                ? "bg-[#0d2a4f] text-white"
                                : "border border-slate-200 bg-white text-slate-600"
                            }`}
                            onClick={() =>
                              updateRequestStatus(
                                request.id,
                                status,
                                reviewNotes[request.id] ?? request.adjustmentNote ?? "",
                              )
                            }
                            type="button"
                          >
                            {labels[status]}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                ))}
                {requests.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    条件に一致する申請はありません。
                  </div>
                ) : null}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
