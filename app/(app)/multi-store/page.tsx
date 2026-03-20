import {
  ActionButton,
  AppShell,
  ProgressTable,
  SectionCard,
  StatGrid,
} from "../ui";

export default function MultiStorePage() {
  return (
    <AppShell
      activePath="/multi-store"
      eyebrow="Coordination"
      title="2店舗統合シフト"
      description="店舗間応援を含めた配置案を比較し、負荷と不足を同時に調整します。"
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
            { label: "応援候補", value: "8名", detail: "両店舗兼務可能" },
            { label: "不足シフト", value: "5枠", detail: "夜勤 3枠 / 朝勤 2枠" },
            { label: "移動コスト", value: "¥18,400", detail: "月間見込み" },
            { label: "兼務率", value: "12%", detail: "前月比 +2pt" },
          ]}
        />

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <SectionCard
            title="統合候補"
            description="どの店舗からどのシフトへ応援するかを一覧化しています。"
          >
            <ProgressTable
              headers={["スタッフ", "所属", "応援先", "対象日", "役割"]}
              rows={[
                ["山本 健太", "品川", "横浜", "3/12-3/14", "夜勤"],
                ["佐藤 美咲", "横浜", "品川", "3/18", "遅番"],
                ["伊藤 さくら", "品川", "横浜", "3/21-3/22", "早番"],
              ]}
            />
          </SectionCard>

          <SectionCard
            title="判定ルール"
            description="統合シフト時に守るべき店舗横断ルールです。"
          >
            <div className="space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                連続3日以上の他店舗勤務は不可。交通費が一定以上ならAI評価を減点。
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                各店舗に必ず責任者を1名残し、応援側も最低人員を割らないこと。
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                宿泊需要ピーク日は、フロント経験者を優先して相互配置します。
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
