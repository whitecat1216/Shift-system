"use client";

import { FormEvent, useMemo, useState } from "react";
import { AppShell, SectionCard, StatGrid } from "../ui";
import { useAppState } from "../state";

export default function StaffPage() {
  const { state, businessConfig, addStaff } = useAppState();
  const [mobileView, setMobileView] = useState<"list" | "form">("list");
  const [name, setName] = useState("");
  const [storeId, setStoreId] = useState(state.selectedStoreId);
  const [employmentType, setEmploymentType] = useState(businessConfig.employmentTypes[0] ?? "");
  const [qualification, setQualification] = useState(businessConfig.qualifications[0] ?? "");
  const [keyword, setKeyword] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "night" | "multi">("all");

  const stats = useMemo(() => {
    const active = state.staff.filter((member) => member.active);
    const night = active.filter((member) => member.nightAvailable);
    const multi = active.filter((member) => member.multiStoreAvailable);
    return { active, night, multi };
  }, [state.staff]);

  const filteredStaff = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return state.staff.filter((member) => {
      const matchesKeyword =
        !normalizedKeyword ||
        member.name.toLowerCase().includes(normalizedKeyword) ||
        member.qualification.toLowerCase().includes(normalizedKeyword) ||
        member.role.toLowerCase().includes(normalizedKeyword);
      const matchesStore = storeFilter === "all" || member.storeId === storeFilter;
      const matchesAvailability =
        availabilityFilter === "all" ||
        (availabilityFilter === "night" && member.nightAvailable) ||
        (availabilityFilter === "multi" && member.multiStoreAvailable);

      return matchesKeyword && matchesStore && matchesAvailability;
    });
  }, [availabilityFilter, keyword, state.staff, storeFilter]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;

    addStaff({
      name: name.trim(),
      storeId,
      employmentType,
      role: businessConfig.labels.staffSingle,
      shiftSkills: businessConfig.shiftTypes.slice(0, 2).map((item) => item.code),
      qualification,
      nightAvailable: businessConfig.shiftTypes.length > 2 && qualification !== "一般",
      multiStoreAvailable: false,
      hourlyWage: employmentType === "正社員" ? 2100 : 1450,
    });
    setName("");
  }

  return (
    <AppShell
      activePath="/staff"
      eyebrow="Master"
      title={businessConfig.labels.staffTitle}
      description={`${businessConfig.labels.staffSingle}の追加と、勤務生成に使う属性の確認ができます。`}
      actions={
        <>
          <input
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={`${businessConfig.labels.staffSingle}名・資格で検索`}
            value={keyword}
          />
          <select
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
            onChange={(event) => setStoreFilter(event.target.value)}
            value={storeFilter}
          >
            <option value="all">全店舗</option>
            {state.stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
            onChange={(event) => setAvailabilityFilter(event.target.value as "all" | "night" | "multi")}
            value={availabilityFilter}
          >
            <option value="all">すべて</option>
            <option value="night">夜勤対応可</option>
            <option value="multi">兼務可能</option>
          </select>
        </>
      }
    >
      <div className="space-y-6">
        <StatGrid
          items={[
            { label: "登録スタッフ", value: `${stats.active.length}名`, detail: "有効スタッフ数" },
            { label: "夜勤対応可", value: `${stats.night.length}名`, detail: "夜勤可能フラグ" },
            { label: "兼務スタッフ", value: `${stats.multi.length}名`, detail: "店舗横断対応可" },
            { label: `選択${businessConfig.labels.store}`, value: state.stores.find((store) => store.id === state.selectedStoreId)?.name ?? "-", detail: "ダッシュボードと連動" },
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
              追加する
            </button>
          </div>

          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {(["all", "night", "multi"] as const).map((value) => (
              <button
                key={value}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold ${
                  availabilityFilter === value
                    ? "bg-[#0d2a4f] text-white"
                    : "border border-slate-200 bg-white text-slate-600"
                }`}
                onClick={() => setAvailabilityFilter(value)}
                type="button"
              >
                {value === "all" ? "すべて" : value === "night" ? "夜勤対応可" : "兼務可能"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className={mobileView === "list" ? "block" : "hidden lg:block"}>
            <SectionCard title={`${businessConfig.labels.staffPlural}一覧`} description={`追加した${businessConfig.labels.staffSingle}は勤務表と人件費に反映されます。`}>
              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  表示件数 {filteredStaff.length} 名
                </div>
                {filteredStaff.map((member) => (
                  <div key={member.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{member.name}</p>
                        <p className="text-sm text-slate-500">
                          {state.stores.find((store) => store.id === member.storeId)?.name} / {member.employmentType} / {member.qualification}
                        </p>
                      </div>
                      <div className="text-left text-sm text-slate-500 sm:text-right">
                        <div>対応: {member.shiftSkills.join(" / ")}</div>
                        <div className="mt-1">
                          {member.nightAvailable ? "夜勤可" : "夜勤不可"} / {member.multiStoreAvailable ? "兼務可" : "単独"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredStaff.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    条件に一致するスタッフはいません。
                  </div>
                ) : null}
              </div>
            </SectionCard>
          </div>

          <div className={mobileView === "form" ? "block" : "hidden lg:block"}>
            <SectionCard title={`${businessConfig.labels.staffSingle}追加`} description="追加した内容は権限スコープ内の DB へ保存されます。">
              <form className="space-y-3" onSubmit={handleSubmit}>
                <input
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base sm:text-sm"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="氏名"
                  value={name}
                />
                <select
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base sm:text-sm"
                  onChange={(event) => setStoreId(event.target.value)}
                  value={storeId}
                >
                  {state.stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base sm:text-sm"
                  onChange={(event) => setEmploymentType(event.target.value)}
                  value={employmentType}
                >
                  {businessConfig.employmentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base sm:text-sm"
                  onChange={(event) => setQualification(event.target.value)}
                  value={qualification}
                >
                  {businessConfig.qualifications.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <button
                  className="w-full rounded-xl bg-[#0d2a4f] px-4 py-3 text-sm font-semibold text-white"
                  type="submit"
                >
                  {businessConfig.labels.staffSingle}を追加
                </button>
              </form>
            </SectionCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
