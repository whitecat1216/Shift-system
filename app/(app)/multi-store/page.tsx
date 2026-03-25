"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ActionButton,
  AppShell,
  ProgressTable,
  SectionCard,
  StatGrid,
} from "../ui";
import { useAppState } from "../state";

type MultiStoreSuggestion = {
  staffName: string;
  homeStore: string;
  targetStore: string;
  targetDates: string;
  role: string;
};

export default function MultiStorePage() {
  const { state } = useAppState();
  const [rows, setRows] = useState<MultiStoreSuggestion[]>([]);

  useEffect(() => {
    let ignore = false;

    void fetch(`/api/multi-store-summary?business=${state.businessId}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { rows?: MultiStoreSuggestion[] }) => {
        if (!ignore) {
          setRows(payload.rows ?? []);
        }
      });

    return () => {
      ignore = true;
    };
  }, [state.businessId]);

  const stats = useMemo(() => {
    const targetStores = new Set(rows.map((row) => row.targetStore));
    return {
      candidates: rows.length,
      shortages: Math.max(0, state.shiftRequirements.filter((item) => item.storeId === state.selectedStoreId).length - rows.length * 2),
      cost: rows.length * 6200,
      targetStores: targetStores.size,
    };
  }, [rows, state.selectedStoreId, state.shiftRequirements]);

  return (
    <AppShell
      activePath="/multi-store"
      eyebrow="Coordination"
      title="2店舗統合シフト"
      description="担当者が見られる店舗範囲内で、兼務可能スタッフを横断配置候補として表示します。"
      actions={
        <>
          <ActionButton label="応援ルール" variant="secondary" />
          <ActionButton label="統合案を更新" />
        </>
      }
    >
      <div className="space-y-6">
        <StatGrid
          items={[
            { label: "応援候補", value: `${stats.candidates}名`, detail: "兼務可スタッフから抽出" },
            { label: "不足シフト", value: `${stats.shortages}枠`, detail: "表示中店舗の必要人数から概算" },
            { label: "移動コスト", value: `¥${stats.cost.toLocaleString()}`, detail: "月間見込み" },
            { label: "対象店舗", value: `${stats.targetStores}店`, detail: "相互応援候補あり" },
          ]}
        />

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <SectionCard
            title="統合候補"
            description="DB のスタッフ情報と店舗権限から、応援候補を一覧化しています。"
          >
            <ProgressTable
              headers={["スタッフ", "所属", "応援先", "対象日", "役割"]}
              rows={rows.map((row) => [
                row.staffName,
                row.homeStore,
                row.targetStore,
                row.targetDates,
                row.role,
              ])}
            />
          </SectionCard>

          <SectionCard
            title="判定ルール"
            description="統合シフト時に守るべき店舗横断ルールです。"
          >
            <div className="space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                連続3日以上の他店舗勤務は不可。交通費が一定以上ならAI評価を減点します。
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                各店舗に必ず責任者を1名残し、応援側も最低人員を割らない条件を優先します。
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                表示内容はログイン担当者に許可された店舗だけで集計しています。
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
