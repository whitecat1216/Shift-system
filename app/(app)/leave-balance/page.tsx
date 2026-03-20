import {
  ActionButton,
  AppShell,
  ProgressTable,
  SectionCard,
  StatGrid,
} from "../ui";

export default function LeaveBalancePage() {
  return (
    <AppShell
      activePath="/leave-balance"
      eyebrow="Balance"
      title="有給残日数管理"
      description="付与日、消化日数、失効予定日を一覧で確認できる管理画面です。"
      actions={
        <>
          <ActionButton label="付与条件" variant="secondary" />
          <ActionButton label="一括更新" />
        </>
      }
    >
      <div className="space-y-6">
        <StatGrid
          items={[
            { label: "対象スタッフ", value: "42名", detail: "正社員 18名 / パート 24名" },
            { label: "失効予定", value: "9日分", detail: "今月末失効" },
            { label: "平均残日数", value: "8.4日", detail: "全社平均" },
            { label: "要確認", value: "3名", detail: "付与計算差分あり" },
          ]}
        />

        <SectionCard
          title="残日数一覧"
          description="付与と消化の履歴を月次運用に必要な項目へ絞って表示しています。"
        >
          <ProgressTable
            headers={["スタッフ", "付与日", "残日数", "今月使用", "失効予定"]}
            rows={[
              ["狩野", "2025/10/01", "12日", "1日", "なし"],
              ["大塚", "2025/04/01", "4日", "2日", "2日"],
              ["田中 優子", "2025/07/01", "7日", "0日", "なし"],
              ["佐藤 美咲", "2025/01/01", "2日", "1日", "1日"],
            ]}
          />
        </SectionCard>
      </div>
    </AppShell>
  );
}
