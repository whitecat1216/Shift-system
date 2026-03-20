"use client";

import { AppShell, InfoList, SectionCard, StatGrid } from "../ui";
import { calculateLaborCost, calculateFillRate, useAppState } from "../state";

export default function LaborCostPage() {
  const { state } = useAppState();
  const laborCost = calculateLaborCost(state);
  const budget = 4_430_000;
  const diff = budget - laborCost;
  const fillRate = calculateFillRate(state);

  return (
    <AppShell
      activePath="/labor-cost"
      eyebrow="Cost"
      title="人件費管理"
      description="スタッフ追加やシフト編集の結果を人件費に反映しています。"
    >
      <div className="space-y-6">
        <StatGrid
          items={[
            { label: "今月予算", value: `¥${budget.toLocaleString()}`, detail: "全店舗合計の仮予算" },
            { label: "見込み実績", value: `¥${laborCost.toLocaleString()}`, detail: `予算比 ${diff >= 0 ? "-" : "+"}¥${Math.abs(diff).toLocaleString()}` },
            { label: "深夜手当相当", value: `¥${Math.round(laborCost * 0.14).toLocaleString()}`, detail: "夜勤セルから簡易算出" },
            { label: "充足率", value: `${fillRate}%`, detail: "シフト充足と人件費を併読" },
          ]}
        />

        <div className="grid gap-6 lg:grid-cols-2">
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

          <SectionCard title="集計メモ" description="DB/API 接続時に置き換えやすい粒度で残しています。">
            <div className="space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                シフト見込みから勤務時間を推定し、時給マスタと掛け合わせて簡易人件費を算出。
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                スタッフ管理で追加した時給も即時計算対象になります。
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                実データ接続時は勤怠実績テーブルに差し替えるだけで済む構成です。
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
