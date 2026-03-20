"use client";

import { FormEvent, useMemo, useState } from "react";
import { AppShell, SectionCard, StatGrid } from "../ui";
import { useAppState } from "../state";

export default function StaffPage() {
  const { state, addStaff } = useAppState();
  const [name, setName] = useState("");
  const [storeId, setStoreId] = useState(state.selectedStoreId);
  const [employmentType, setEmploymentType] = useState("アルバイト");
  const [qualification, setQualification] = useState("一般");

  const stats = useMemo(() => {
    const active = state.staff.filter((member) => member.active);
    const night = active.filter((member) => member.nightAvailable);
    const multi = active.filter((member) => member.multiStoreAvailable);
    return { active, night, multi };
  }, [state.staff]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;

    addStaff({
      name: name.trim(),
      storeId,
      employmentType,
      role: "フロント",
      shiftSkills: ["A", "B"],
      qualification,
      nightAvailable: qualification === "夜勤可",
      multiStoreAvailable: false,
      hourlyWage: employmentType === "正社員" ? 2100 : 1450,
    });
    setName("");
  }

  return (
    <AppShell
      activePath="/staff"
      eyebrow="Master"
      title="スタッフ管理"
      description="スタッフの追加と、シフト生成に使う属性の確認ができます。"
    >
      <div className="space-y-6">
        <StatGrid
          items={[
            { label: "登録スタッフ", value: `${stats.active.length}名`, detail: "有効スタッフ数" },
            { label: "夜勤対応可", value: `${stats.night.length}名`, detail: "夜勤可能フラグ" },
            { label: "兼務スタッフ", value: `${stats.multi.length}名`, detail: "店舗横断対応可" },
            { label: "選択店舗", value: state.stores.find((store) => store.id === state.selectedStoreId)?.name ?? "-", detail: "ダッシュボードと連動" },
          ]}
        />

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <SectionCard title="スタッフ一覧" description="追加したスタッフはシフト表と人件費に反映されます。">
            <div className="space-y-3">
              {state.staff.map((member) => (
                <div key={member.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{member.name}</p>
                      <p className="text-sm text-slate-500">
                        {state.stores.find((store) => store.id === member.storeId)?.name} / {member.employmentType} / {member.qualification}
                      </p>
                    </div>
                    <div className="text-sm text-slate-500">
                      対応: {member.shiftSkills.join(" / ")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="スタッフ追加" description="まずはフロント側だけで使える簡易登録です。">
            <form className="space-y-3" onSubmit={handleSubmit}>
              <input
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                onChange={(event) => setName(event.target.value)}
                placeholder="氏名"
                value={name}
              />
              <select
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                onChange={(event) => setStoreId(event.target.value as typeof storeId)}
                value={storeId}
              >
                {state.stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                onChange={(event) => setEmploymentType(event.target.value)}
                value={employmentType}
              >
                <option value="正社員">正社員</option>
                <option value="パート">パート</option>
                <option value="アルバイト">アルバイト</option>
              </select>
              <select
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                onChange={(event) => setQualification(event.target.value)}
                value={qualification}
              >
                <option value="一般">一般</option>
                <option value="英語対応">英語対応</option>
                <option value="夜勤可">夜勤可</option>
                <option value="責任者">責任者</option>
              </select>
              <button
                className="w-full rounded-xl bg-[#0d2a4f] px-4 py-3 text-sm font-semibold text-white"
                type="submit"
              >
                スタッフを追加
              </button>
            </form>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
