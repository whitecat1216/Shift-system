"use client";

import { useEffect, useMemo, useState } from "react";
import { getShiftClassName } from "../business-config";
import { ActionButton, AppShell, SectionCard } from "../ui";
import { dayHeaders, ShiftCode } from "../mock-data";
import { calculateCoverage, useAppState } from "../state";

function getWeekendClass(weekday: string) {
  if (weekday === "土") return "bg-sky-50 text-sky-700";
  if (weekday === "日") return "bg-rose-50 text-rose-700";
  return "";
}

export default function ShiftsPage() {
  const { state, businessConfig, changeMonth, togglePublished, updateAssignment } = useAppState();
  const [staffKeyword, setStaffKeyword] = useState("");
  const [showOnlyAttention, setShowOnlyAttention] = useState(false);
  const currentDate = new Date();
  const monthMatch = state.currentMonth.match(/(\d{4})年(\d{1,2})月/);
  const currentMonthYear = monthMatch ? Number(monthMatch[1]) : currentDate.getFullYear();
  const currentMonthIndex = monthMatch ? Number(monthMatch[2]) - 1 : currentDate.getMonth();
  const todayDay =
    currentMonthYear === currentDate.getFullYear() && currentMonthIndex === currentDate.getMonth()
      ? currentDate.getDate()
      : null;
  const [selectedWeek, setSelectedWeek] = useState(
    todayDay ? Math.max(0, Math.ceil(todayDay / 7) - 1) : 0,
  );
  const coverage = calculateCoverage(state, businessConfig);
  const currentStaff = state.staff
    .filter((member) => member.storeId === state.selectedStoreId)
    .filter((member) =>
      !staffKeyword.trim()
        ? true
        : member.name.toLowerCase().includes(staffKeyword.trim().toLowerCase()) ||
          member.qualification.toLowerCase().includes(staffKeyword.trim().toLowerCase()),
    );
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
  const [selectedDay, setSelectedDay] = useState<number>(visibleDays[0]?.day ?? 1);
  const visibleRequirements = showOnlyAttention
    ? businessConfig.shiftTypes.filter((shiftType) =>
        visibleDays.some(({ day }) => {
          const required =
            requirements.find((item) => item.day === day && item.code === shiftType.code)?.required ?? 0;
          const covered = coverage[shiftType.code]?.[day - 1] ?? 0;
          return covered < required;
        }),
      )
    : businessConfig.shiftTypes;
  const gridTemplateColumns = `160px repeat(${visibleDays.length}, minmax(76px, 1fr))`;
  const attentionCount = visibleDays.reduce((sum, { day }) => {
    return (
      sum +
      businessConfig.shiftTypes.filter((shiftType) => {
        const required =
          requirements.find((item) => item.day === day && item.code === shiftType.code)?.required ?? 0;
        const covered = coverage[shiftType.code]?.[day - 1] ?? 0;
        return covered < required;
      }).length
    );
  }, 0);
  const mobileDay = visibleDays.find((day) => day.day === selectedDay) ?? visibleDays[0];

  useEffect(() => {
    setSelectedDay(visibleDays[0]?.day ?? 1);
  }, [selectedWeek, state.currentMonth]);

  return (
    <AppShell
      activePath="/shifts"
      eyebrow="Monthly Grid"
      title={`${state.currentMonth} ${businessConfig.labels.scheduleTitle}`}
      description="セルを直接切り替えて、ドラフト状態のシフトを調整できます。"
      actions={
        <>
          <input
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
            onChange={(event) => setStaffKeyword(event.target.value)}
            placeholder="スタッフ名・資格で検索"
            value={staffKeyword}
          />
          <ActionButton label="前月" onClick={() => changeMonth("prev")} variant="secondary" />
          <ActionButton label="翌月" onClick={() => changeMonth("next")} variant="secondary" />
          <ActionButton label={state.published ? businessConfig.labels.unpublish : businessConfig.labels.publish} onClick={togglePublished} />
        </>
      }
    >
      <div className="space-y-5">
        <SectionCard
          title="編集ルール"
          description="各セルを押すごとに `- -> A -> B -> N -> 休 -> -` の順で切り替わります。今日と申請日を見分けやすくしています。"
        >
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {[
              ...businessConfig.shiftTypes.map((shiftType) => shiftType.code),
              businessConfig.specialShifts.off.code,
              businessConfig.specialShifts.unassigned.code,
            ].map((code) => (
              <span
                key={code}
                className={`rounded-lg px-3 py-2 font-bold ${getShiftClassName(code, businessConfig)}`}
              >
                {code}
              </span>
            ))}
            <span className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 font-bold text-amber-700">
              今日
            </span>
            <span className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-2 font-bold text-violet-700">
              申請日
            </span>
          </div>
        </SectionCard>

        <SectionCard
          title="週切替"
          description="前後移動で週単位に切り替えます。不足枠だけに絞ることもできます。"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
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
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                checked={showOnlyAttention}
                onChange={(event) => setShowOnlyAttention(event.target.checked)}
                type="checkbox"
              />
              不足枠のみ表示
            </label>
          </div>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            今週の要対応枠 {attentionCount} 件 / 表示スタッフ {currentStaff.length} 名
          </div>
        </SectionCard>

        <div className="space-y-4 lg:hidden">
          <SectionCard
            title="スマホ表示"
            description="スマホでは日ごとのカード表示に切り替えています。"
          >
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {visibleDays.map((day) => {
                const isActive = mobileDay?.day === day.day;
                return (
                  <button
                    key={day.day}
                    className={`min-w-[72px] rounded-2xl border px-3 py-3 text-center text-sm font-semibold ${
                      isActive
                        ? "border-[#0d2a4f] bg-[#0d2a4f] text-white"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                    onClick={() => setSelectedDay(day.day)}
                    type="button"
                  >
                    <div>{day.day}日</div>
                    <div className="mt-1 text-xs opacity-80">{day.weekday}</div>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            title={`${mobileDay?.day ?? "-"}日 ${mobileDay?.weekday ?? ""} の必要人数`}
            description="不足している勤務帯を上から確認できます。"
          >
            <div className="space-y-3">
              {visibleRequirements.map((shiftType) => {
                const required =
                  requirements.find(
                    (item) => item.day === (mobileDay?.day ?? 1) && item.code === shiftType.code,
                  )?.required ?? 0;
                const covered = coverage[shiftType.code]?.[(mobileDay?.day ?? 1) - 1] ?? 0;
                const shortage = Math.max(0, required - covered);

                return (
                  <div
                    key={shiftType.code}
                    className={`rounded-2xl border px-4 py-3 ${
                      shortage > 0
                        ? "border-rose-200 bg-rose-50 text-rose-800"
                        : "border-emerald-200 bg-emerald-50 text-emerald-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">{shiftType.label}</span>
                      <span className="text-sm">
                        {covered}/{required}人
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard
            title="スタッフ別シフト"
            description="タップで勤務区分を順送りに変更できます。"
          >
            <div className="space-y-3">
              {currentStaff.map((member) => {
                const shiftIndex = (mobileDay?.day ?? 1) - 1;
                const shift =
                  state.assignments[member.id]?.[shiftIndex] ??
                  businessConfig.specialShifts.unassigned.code;
                const hasRequest = state.leaveRequests.some(
                  (request) =>
                    request.staffId === member.id && request.days.includes(mobileDay?.day ?? 1),
                );

                return (
                  <div key={member.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{member.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{member.qualification}</p>
                      </div>
                      {hasRequest ? (
                        <span className="rounded-full bg-violet-100 px-3 py-1 text-[11px] font-semibold text-violet-700">
                          申請あり
                        </span>
                      ) : null}
                    </div>
                    <button
                      className="mt-4 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
                      onClick={() => {
                        const order: ShiftCode[] = [
                          businessConfig.specialShifts.unassigned.code,
                          ...businessConfig.shiftTypes.map((shiftType) => shiftType.code),
                          businessConfig.specialShifts.off.code,
                        ];
                        const nextCode = order[(order.indexOf(shift) + 1) % order.length];
                        updateAssignment(member.id, mobileDay?.day ?? 1, nextCode);
                      }}
                      type="button"
                    >
                      <span className="text-sm font-medium text-slate-600">勤務区分</span>
                      <span
                        className={`grid h-9 min-w-9 place-items-center rounded-lg px-3 text-xs font-bold ${getShiftClassName(shift, businessConfig)}`}
                      >
                        {shift}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        <div className="hidden overflow-x-auto lg:block">
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

            {visibleRequirements.map((shiftType, rowIndex) => (
              <div
                key={shiftType.code}
                className={`grid border-x border-slate-200 ${rowIndex === visibleRequirements.length - 1 ? "border-b" : ""}`}
                style={{ gridTemplateColumns }}
              >
                <div className="sticky left-0 z-10 flex items-center bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
                  {shiftType.shortLabel}
                </div>
                {visibleDays.map(({ day }) => {
                  const required = requirements.find((item) => item.day === day && item.code === shiftType.code)?.required ?? 0;
                  const covered = coverage[shiftType.code]?.[day - 1] ?? 0;
                  const weekday = dayHeaders[day - 1]?.weekday ?? "";
                  return (
                    <div
                      key={`${shiftType.code}-${day}`}
                      className={`border-l px-2 py-3 text-center text-xs font-semibold ${
                        covered < required
                          ? "border-slate-200 bg-rose-50 text-rose-700"
                          : "border-slate-200 text-emerald-700"
                      } ${weekday === "土" ? "bg-sky-50/70" : weekday === "日" ? "bg-rose-50/70" : ""} ${
                        todayDay === day ? "ring-2 ring-amber-300 ring-inset" : ""
                      }`}
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
                    const shift =
                      state.assignments[member.id]?.[shiftIndex] ??
                      businessConfig.specialShifts.unassigned.code;
                    const weekday = dayHeaders[day - 1]?.weekday ?? "";
                    const hasRequest = state.leaveRequests.some(
                      (request) => request.staffId === member.id && request.days.includes(day),
                    );

                    return (
                      <button
                        key={`${member.id}-${day}`}
                        className={`flex min-h-[74px] items-center justify-center border-l border-slate-200 px-1 py-2 ${
                          weekday === "土" ? "bg-sky-50/50" : weekday === "日" ? "bg-rose-50/50" : ""
                        } ${todayDay === day ? "ring-2 ring-amber-300 ring-inset" : ""} ${
                          hasRequest ? "bg-violet-50/70" : ""
                        }`}
                        onClick={() => {
                          const order: ShiftCode[] = [
                            businessConfig.specialShifts.unassigned.code,
                            ...businessConfig.shiftTypes.map((shiftType) => shiftType.code),
                            businessConfig.specialShifts.off.code,
                          ];
                          const nextCode = order[(order.indexOf(shift) + 1) % order.length];
                          updateAssignment(member.id, day, nextCode);
                        }}
                        type="button"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`grid h-8 min-w-8 place-items-center rounded-lg px-2 text-xs font-bold ${getShiftClassName(shift, businessConfig)}`}
                          >
                            {shift}
                          </span>
                          {hasRequest ? <span className="text-[10px] font-semibold text-violet-700">申請</span> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
        {currentStaff.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            条件に一致するスタッフがいません。
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
