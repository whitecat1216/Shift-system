export const businessIds = ["hotel", "restaurant"] as const;

export type BusinessId = (typeof businessIds)[number];

export type BusinessConfig = {
  id: BusinessId;
  name: string;
  labels: {
    dashboardTitle: string;
    scheduleTitle: string;
    requestsTitle: string;
    leaveControlTitle: string;
    leaveBalanceTitle: string;
    staffTitle: string;
    aiTitle: string;
    laborCostTitle: string;
    store: string;
    staffSingle: string;
    staffPlural: string;
    requestSingle: string;
    publish: string;
    unpublish: string;
    published: string;
    draft: string;
    requestAdd: string;
  };
  employmentTypes: string[];
  qualifications: string[];
  shiftTypes: Array<{
    code: string;
    label: string;
    shortLabel: string;
    colorToken: "amber" | "sky" | "slate";
    hours: number;
  }>;
  specialShifts: {
    off: { code: string; label: string; colorToken: "muted" };
    unassigned: { code: string; label: string; colorToken: "empty" };
  };
  requestTypes: string[];
};

type BusinessSummary = {
  id: BusinessId;
  name: string;
};

const fallbackBusinessConfigs: Record<BusinessId, BusinessConfig> = {
  hotel: {
    id: "hotel",
    name: "ホテル",
    labels: {
      dashboardTitle: "ダッシュボード",
      scheduleTitle: "シフト表",
      requestsTitle: "希望休一覧",
      leaveControlTitle: "有給・希望休管理",
      leaveBalanceTitle: "有給残日数管理",
      staffTitle: "スタッフ管理",
      aiTitle: "AIシフト生成",
      laborCostTitle: "人件費管理",
      store: "店舗",
      staffSingle: "スタッフ",
      staffPlural: "スタッフ",
      requestSingle: "申請",
      publish: "確定版を作成",
      unpublish: "公開を解除",
      published: "公開中",
      draft: "下書き",
      requestAdd: "申請を追加",
    },
    employmentTypes: ["正社員", "パート", "アルバイト"],
    qualifications: ["一般", "英語対応", "夜勤可", "責任者"],
    shiftTypes: [
      { code: "A", label: "早番", shortLabel: "早", colorToken: "amber", hours: 8 },
      { code: "B", label: "中番", shortLabel: "中", colorToken: "sky", hours: 8 },
      { code: "N", label: "夜勤", shortLabel: "夜", colorToken: "slate", hours: 9 },
    ],
    specialShifts: {
      off: { code: "休", label: "休み", colorToken: "muted" },
      unassigned: { code: "-", label: "未設定", colorToken: "empty" },
    },
    requestTypes: ["希望休", "有給"],
  },
  restaurant: {
    id: "restaurant",
    name: "飲食店",
    labels: {
      dashboardTitle: "勤務ダッシュボード",
      scheduleTitle: "勤務表",
      requestsTitle: "休み希望一覧",
      leaveControlTitle: "休暇・希望管理",
      leaveBalanceTitle: "休暇残数管理",
      staffTitle: "クルー管理",
      aiTitle: "AI勤務生成",
      laborCostTitle: "人件費管理",
      store: "店舗",
      staffSingle: "クルー",
      staffPlural: "クルー",
      requestSingle: "休暇申請",
      publish: "確定シフトを作成",
      unpublish: "公開を解除",
      published: "公開中",
      draft: "下書き",
      requestAdd: "休暇申請を追加",
    },
    employmentTypes: ["社員", "パート", "アルバイト"],
    qualifications: ["一般", "調理可", "レジ可", "店長候補"],
    shiftTypes: [
      { code: "OP", label: "開店", shortLabel: "開", colorToken: "amber", hours: 6 },
      { code: "MD", label: "中番", shortLabel: "中", colorToken: "sky", hours: 6 },
      { code: "CL", label: "閉店", shortLabel: "閉", colorToken: "slate", hours: 7 },
    ],
    specialShifts: {
      off: { code: "OFF", label: "休み", colorToken: "muted" },
      unassigned: { code: "-", label: "未設定", colorToken: "empty" },
    },
    requestTypes: ["休み希望", "休暇申請"],
  },
};

export const businessConfigs = fallbackBusinessConfigs;

export function getBusinessConfig(id: BusinessId) {
  return fallbackBusinessConfigs[id];
}

export async function fetchBusinessTypes(): Promise<BusinessSummary[]> {
  try {
    const response = await fetch("/api/business-types", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load business types: ${response.status}`);
    }

    const payload = (await response.json()) as { businessTypes?: BusinessSummary[] };
    if (!payload.businessTypes?.length) {
      return businessIds.map((id) => ({
        id,
        name: fallbackBusinessConfigs[id].name,
      }));
    }

    return payload.businessTypes;
  } catch {
    return businessIds.map((id) => ({
      id,
      name: fallbackBusinessConfigs[id].name,
    }));
  }
}

export async function fetchBusinessConfig(id: BusinessId): Promise<BusinessConfig> {
  try {
    const response = await fetch(`/api/business-config/${id}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to load business config: ${response.status}`);
    }

    return (await response.json()) as BusinessConfig;
  } catch {
    return fallbackBusinessConfigs[id];
  }
}

export function getShiftClassName(code: string, config: BusinessConfig) {
  const shiftType = config.shiftTypes.find((item) => item.code === code);
  const special = Object.values(config.specialShifts).find((item) => item.code === code);
  const colorToken = shiftType?.colorToken ?? special?.colorToken ?? "empty";

  if (colorToken === "amber") return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
  if (colorToken === "sky") return "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200";
  if (colorToken === "slate") return "bg-slate-800 text-white";
  if (colorToken === "muted") return "bg-slate-100 text-slate-400 ring-1 ring-inset ring-slate-200";
  return "bg-white text-slate-300 ring-1 ring-inset ring-slate-200";
}
