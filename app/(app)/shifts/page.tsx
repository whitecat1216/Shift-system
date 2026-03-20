"use client";

import { useMemo, useState } from "react";
import { ActionButton, AppShell, SectionCard } from "../ui";
import { dayHeaders, ShiftCode } from "../mock-data";
import { calculateCoverage, useAppState } from "../state";

function getShiftClass(code: string) {
  if (code === "A") return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
  if (code === "B") return "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200";
  if (code === "N") return "bg-slate-800 text-white";
  if (code === "休") return "bg-slate-100 text-slate-400 ring-1 ring-inset ring-slate-200";
  return "bg-white text-slate-300 ring-1 ring-inset ring-slate-200";
}

function getWeekendClass(weekday: string) {
  if (weekday === "土") return "bg-sky-50 text-sky-700";
  if (weekday === "日") return "bg-rose-50 text-rose-700";
  return "";
}

export default function ShiftsPage() {
  const { state, changeMonth, togglePublished, updateAssignment } = useAppState();
  const [selectedWeek, setSelectedWeek] = useState(0);
  const coverage = calculateCoverage(state);
  const currentStaff = state.staff.filter((member) => member.storeId === state.selectedStoreId);
  const requirements = state.shiftRequirements.filter(
    (item) => item.storeId === state.selectedStoreId,
  );
  const weekGroups = useMemo(
    () =>
      Array.from({ length: Math.ceil(dayHeaders.length / 7) }, (_, index) =>
        dayHeaders.slice(index * 7, index * 7 + 7),
      ),
    [],
  );
  const visibleDays = weekGroups[selectedWeek] ?? weekGroups[0];
  const gridTemplateColumns = `160px repeat(${visibleDays.length}, minmax(76px, 1fr))`;

  return (
    <AppShell
      activePath="/shifts"
      eyebrow="Monthly Grid"
      title={`${state.currentMonth} シフト表`}
      description="セルを直接切り替えて、ドラフト状態のシフトを調整できます。"
      actions={
        <>
          <ActionButton label="前月" onClick={() => changeMonth("prev")} variant="secondary" />
          <ActionButton label="翌月" onClick={() => changeMonth("next")} variant="secondary" />
          <ActionButton label={state.published ? "公開を解除" : "確定版を作成"} onClick={togglePublished} />
        </>
      }
    >
      <div className="space-y-5">
        <SectionCard
          title="編集ルール"
          description="各セルを押すごとに `- -> A -> B -> N -> 休 -> -` の順で切り替わります。週切替で見たい範囲だけ表示できます。"
        >
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {(["A", "B", "N", "休", "-"] as ShiftCode[]).map((code) => (
              <span
                key={code}
                className={`rounded-lg px-3 py-2 font-bold ${getShiftClass(code)}`}
              >
                {code}
              </span>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="週切替"
          description="前後移動で週単位に切り替えます。"
        >
          <div className="flex items-center justify-between gap-3">
            <button
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40"
              disabled={selectedWeek === 0}
              onClick={() => setSelectedWeek((current) => Math.max(0, current - 1))}
              type="button"
            >
              前週
            </button>
            <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              {selectedWeek + 1}週 ({visibleDays[0]?.day}-{visibleDays[visibleDays.length - 1]?.day}日)
            </div>
            <button
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40"
              disabled={selectedWeek === weekGroups.length - 1}
              onClick={() =>
                setSelectedWeek((current) => Math.min(weekGroups.length - 1, current + 1))
              }
              type="button"
            >
              次週
            </button>
          </div>
        </SectionCard>

        <div className="overflow-x-auto">
          <div className="min-w-max">
            <div
              className="grid rounded-t-2xl bg-[#0d2a4f] text-white"
              style={{ gridTemplateColumns }}
            >
              <div className="sticky left-0 z-10 flex items-center bg-[#0d2a4f] px-4 py-5 text-sm font-semibold">
                スタッフ
              </div>
              {visibleDays.map((day) => (
                <div
                  key={day.day}
                  className={`border-l border-white/10 px-2 py-3 text-center ${getWeekendClass(day.weekday)}`}
                >
                  <div className="text-lg font-semibold leading-none">{day.day}</div>
                  <div className="mt-1 text-xs text-slate-300">{day.weekday}</div>
                </div>
              ))}
            </div>

            {(["A", "B", "N"] as const).map((code, rowIndex) => (
              <div
                key={code}
                className={`grid border-x border-slate-200 ${rowIndex === 2 ? "border-b" : ""}`}
                style={{ gridTemplateColumns }}
              >
                <div className="sticky left-0 z-10 flex items-center bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
                  {code === "A" ? "早" : code === "B" ? "中" : "夜"}
                </div>
                {visibleDays.map(({ day }) => {
                  const required = requirements.find((item) => item.day === day && item.code === code)?.required ?? 0;
                  const covered = coverage[code][day - 1];
                  const weekday = dayHeaders[day - 1]?.weekday ?? "";
                  return (
                    <div
                      key={`${code}-${day}`}
                      className={`border-l px-2 py-3 text-center text-xs font-semibold ${
                        covered < required
                          ? "border-slate-200 bg-rose-50 text-rose-700"
                          : "border-slate-200 text-emerald-700"
                      } ${weekday === "土" ? "bg-sky-50/70" : weekday === "日" ? "bg-rose-50/70" : ""}`}
                    >
                      {covered}/{required}人
                    </div>
                  );
                })}
              </div>
            ))}

            <div className="rounded-b-2xl border border-t-0 border-slate-200">
              {currentStaff.map((member, rowIndex) => (
                <div
                  key={member.id}
                  className={`grid ${rowIndex !== currentStaff.length - 1 ? "border-b border-slate-200" : ""}`}
                  style={{ gridTemplateColumns }}
                >
                  <div className="sticky left-0 z-10 flex flex-col justify-center bg-white px-4 py-4 text-sm font-semibold text-slate-700">
                    <span>{member.name}</span>
                    <span className="text-xs font-normal text-slate-400">{member.qualification}</span>
                  </div>
                  {visibleDays.map(({ day }) => {
                    const shiftIndex = day - 1;
                    const shift = state.assignments[member.id]?.[shiftIndex] ?? "-";
                    const weekday = dayHeaders[day - 1]?.weekday ?? "";

                    return (
                      <button
                        key={`${member.id}-${day}`}
                        className={`flex min-h-[74px] items-center justify-center border-l border-slate-200 px-1 py-2 ${
                          weekday === "土" ? "bg-sky-50/50" : weekday === "日" ? "bg-rose-50/50" : ""
                        }`}
                        onClick={() => {
                          const order: ShiftCode[] = ["-", "A", "B", "N", "休"];
                          const nextCode = order[(order.indexOf(shift) + 1) % order.length];
                          updateAssignment(member.id, day, nextCode);
                        }}
                        type="button"
                      >
                        <span
                          className={`grid h-8 min-w-8 place-items-center rounded-lg px-2 text-xs font-bold ${getShiftClass(
                            shift,
                          )}`}
                        >
                          {shift}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
