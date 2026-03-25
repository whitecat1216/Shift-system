import { BusinessId } from "./business-config";

export type StoreId = string;
export type ShiftCode = string;
export type RequestStatus = "pending" | "approved" | "adjusting" | "rejected";

export type Store = {
  id: StoreId;
  name: string;
};

export type StaffMember = {
  id: string;
  name: string;
  storeId: StoreId;
  employmentType: string;
  role: string;
  shiftSkills: string[];
  qualification: string;
  nightAvailable: boolean;
  multiStoreAvailable: boolean;
  hourlyWage: number;
  active: boolean;
};

export type LeaveRequest = {
  id: string;
  staffId: string;
  type: string;
  days: number[];
  reason: string;
  status: RequestStatus;
  createdAt: string;
};

export type ShiftRequirement = {
  storeId: StoreId;
  day: number;
  code: string;
  required: number;
};

export type AiPlan = {
  id: string;
  name: string;
  fillRate: number;
  overtimeDelta: number;
  violations: number;
  notes: string;
  applied: boolean;
};

export type AiSettings = {
  templateName: string;
  minManagerPerShift: number;
  nightRestDays: number;
  includePendingRequests: boolean;
  maxMonthlyOvertimeHours: number;
  multiStoreWeight: number;
  laborCostWeight: number;
  requestPriorityWeight: number;
};

export type AppState = {
  businessId: BusinessId;
  currentMonth: string;
  selectedStoreId: StoreId;
  published: boolean;
  stores: Store[];
  staff: StaffMember[];
  leaveRequests: LeaveRequest[];
  shiftRequirements: ShiftRequirement[];
  assignments: Record<string, ShiftCode[]>;
  aiPlans: AiPlan[];
  aiSettings: AiSettings;
};

const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

export const dayHeaders = Array.from({ length: 31 }, (_, index) => ({
  day: index + 1,
  weekday: weekdays[index % weekdays.length],
}));

function pickByDay(values: number[], day: number) {
  return values[(day - 1) % values.length];
}

function expandAssignments(base: ShiftCode[]): ShiftCode[] {
  return Array.from({ length: dayHeaders.length }, (_, index) => base[index % base.length]);
}

export function createHotelState(): AppState {
  return {
    businessId: "hotel",
    currentMonth: "2026年3月",
    selectedStoreId: "shinagawa",
    published: false,
    stores: [
      { id: "shinagawa", name: "品川店" },
      { id: "yokohama", name: "横浜店" },
      { id: "haneda", name: "羽田店" },
    ],
    staff: [
      { id: "staff-1", name: "狩野", storeId: "shinagawa", employmentType: "正社員", role: "フロント責任者", shiftSkills: ["A", "B"], qualification: "責任者", nightAvailable: false, multiStoreAvailable: true, hourlyWage: 2300, active: true },
      { id: "staff-2", name: "大塚", storeId: "yokohama", employmentType: "正社員", role: "ナイト責任者", shiftSkills: ["A", "B", "N"], qualification: "責任者", nightAvailable: true, multiStoreAvailable: true, hourlyWage: 2400, active: true },
      { id: "staff-3", name: "田中 優子", storeId: "haneda", employmentType: "パート", role: "フロント", shiftSkills: ["A", "B", "N"], qualification: "英語対応", nightAvailable: true, multiStoreAvailable: false, hourlyWage: 1600, active: true },
      { id: "staff-4", name: "山本 健太", storeId: "shinagawa", employmentType: "正社員", role: "夜勤担当", shiftSkills: ["A", "B", "N"], qualification: "夜勤可", nightAvailable: true, multiStoreAvailable: true, hourlyWage: 2100, active: true },
      { id: "staff-5", name: "佐藤 美咲", storeId: "yokohama", employmentType: "正社員", role: "フロント", shiftSkills: ["A", "B", "N"], qualification: "リーダー", nightAvailable: true, multiStoreAvailable: false, hourlyWage: 2050, active: true },
      { id: "staff-6", name: "鈴木 大輔", storeId: "shinagawa", employmentType: "アルバイト", role: "フロント", shiftSkills: ["A", "B", "N"], qualification: "夜勤可", nightAvailable: true, multiStoreAvailable: false, hourlyWage: 1450, active: true },
      { id: "staff-7", name: "伊藤 さくら", storeId: "shinagawa", employmentType: "アルバイト", role: "フロント", shiftSkills: ["B", "N"], qualification: "夜勤可", nightAvailable: true, multiStoreAvailable: false, hourlyWage: 1500, active: true }
    ],
    leaveRequests: [
      { id: "req-1", staffId: "staff-6", type: "希望休", days: [7, 8], reason: "私用", status: "approved", createdAt: "2026-02-19" },
      { id: "req-2", staffId: "staff-3", type: "希望休", days: [12], reason: "通院", status: "pending", createdAt: "2026-02-21" },
      { id: "req-3", staffId: "staff-7", type: "有給", days: [20, 21], reason: "帰省", status: "approved", createdAt: "2026-02-17" },
      { id: "req-4", staffId: "staff-4", type: "希望休", days: [29], reason: "研修", status: "adjusting", createdAt: "2026-02-24" },
      { id: "req-5", staffId: "staff-2", type: "有給", days: [22, 23], reason: "家族都合", status: "pending", createdAt: "2026-02-25" }
    ],
    shiftRequirements: dayHeaders.flatMap(({ day }) => [
      { storeId: "shinagawa", day, code: "A", required: pickByDay([2, 5, 4, 3, 3, 3, 4, 4, 4, 5, 4, 2], day) },
      { storeId: "shinagawa", day, code: "B", required: pickByDay([3, 4, 4, 4, 2, 3, 4, 4, 4, 4, 3, 2], day) },
      { storeId: "shinagawa", day, code: "N", required: pickByDay([2, 2, 2, 2, 2, 2, 3, 2, 2, 3, 2, 2], day) },
      { storeId: "yokohama", day, code: "A", required: pickByDay([2, 3, 3, 3, 2, 2, 3, 3, 2, 3, 3, 2], day) },
      { storeId: "yokohama", day, code: "B", required: pickByDay([2, 2, 3, 2, 2, 2, 3, 2, 2, 2, 2, 2], day) },
      { storeId: "yokohama", day, code: "N", required: pickByDay([1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1], day) },
      { storeId: "haneda", day, code: "A", required: pickByDay([1, 2, 2, 2, 1, 1, 2, 2, 2, 2, 2, 1], day) },
      { storeId: "haneda", day, code: "B", required: pickByDay([1, 2, 2, 2, 1, 1, 2, 2, 1, 2, 2, 1], day) },
      { storeId: "haneda", day, code: "N", required: pickByDay([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], day) }
    ]),
    assignments: {
      "staff-1": expandAssignments(["-", "A", "A", "-", "-", "-", "-", "-", "A", "A", "-", "-"]),
      "staff-2": expandAssignments(["休", "休", "A", "B", "N", "A", "B", "休", "休", "N", "A", "B"]),
      "staff-3": expandAssignments(["B", "休", "休", "N", "A", "B", "N", "A", "休", "休", "B", "N"]),
      "staff-4": expandAssignments(["N", "A", "休", "休", "B", "N", "A", "B", "N", "休", "休", "A"]),
      "staff-5": expandAssignments(["A", "B", "N", "休", "休", "A", "B", "N", "A", "B", "休", "休"]),
      "staff-6": expandAssignments(["B", "N", "A", "B", "休", "休", "N", "A", "B", "N", "A", "休"]),
      "staff-7": expandAssignments(["N", "A", "B", "N", "A", "休", "休", "B", "N", "A", "B", "N"])
    },
    aiPlans: [
      { id: "plan-a", name: "案A: バランス重視", fillRate: 95, overtimeDelta: -11, violations: 1, notes: "不足を抑えつつ夜勤の偏りを分散", applied: true },
      { id: "plan-b", name: "案B: 充足率最優先", fillRate: 98, overtimeDelta: 6, violations: 3, notes: "不足解消を優先し、残業は増加", applied: false },
      { id: "plan-c", name: "案C: 希望休優先", fillRate: 90, overtimeDelta: -4, violations: 2, notes: "希望休の反映率が高い構成", applied: false }
    ],
    aiSettings: {
      templateName: "標準テンプレート",
      minManagerPerShift: 1,
      nightRestDays: 1,
      includePendingRequests: true,
      maxMonthlyOvertimeHours: 20,
      multiStoreWeight: 55,
      laborCostWeight: 50,
      requestPriorityWeight: 70,
    },
  };
}

export function createRestaurantState(): AppState {
  return {
    businessId: "restaurant",
    currentMonth: "2026年3月",
    selectedStoreId: "shibuya",
    published: false,
    stores: [
      { id: "shibuya", name: "渋谷店" },
      { id: "shinjuku", name: "新宿店" },
      { id: "ikebukuro", name: "池袋店" }
    ],
    staff: [
      { id: "crew-1", name: "斎藤", storeId: "shibuya", employmentType: "社員", role: "店長", shiftSkills: ["OP", "MD"], qualification: "店長候補", nightAvailable: false, multiStoreAvailable: true, hourlyWage: 2100, active: true },
      { id: "crew-2", name: "小林", storeId: "shibuya", employmentType: "アルバイト", role: "ホール", shiftSkills: ["OP", "MD", "CL"], qualification: "レジ可", nightAvailable: true, multiStoreAvailable: false, hourlyWage: 1350, active: true },
      { id: "crew-3", name: "中村", storeId: "shinjuku", employmentType: "社員", role: "キッチン", shiftSkills: ["OP", "MD", "CL"], qualification: "調理可", nightAvailable: true, multiStoreAvailable: true, hourlyWage: 1950, active: true },
      { id: "crew-4", name: "高橋", storeId: "ikebukuro", employmentType: "パート", role: "ホール", shiftSkills: ["OP", "MD"], qualification: "一般", nightAvailable: false, multiStoreAvailable: false, hourlyWage: 1280, active: true },
      { id: "crew-5", name: "吉田", storeId: "shibuya", employmentType: "アルバイト", role: "キッチン", shiftSkills: ["MD", "CL"], qualification: "調理可", nightAvailable: true, multiStoreAvailable: false, hourlyWage: 1400, active: true }
    ],
    leaveRequests: [
      { id: "rreq-1", staffId: "crew-2", type: "休み希望", days: [6, 7], reason: "帰省", status: "pending", createdAt: "2026-02-20" },
      { id: "rreq-2", staffId: "crew-3", type: "休暇申請", days: [14], reason: "私用", status: "approved", createdAt: "2026-02-18" },
      { id: "rreq-3", staffId: "crew-5", type: "休み希望", days: [21, 22], reason: "試験", status: "adjusting", createdAt: "2026-02-24" }
    ],
    shiftRequirements: dayHeaders.flatMap(({ day }) => [
      { storeId: "shibuya", day, code: "OP", required: pickByDay([3, 3, 2, 2, 2, 3, 4], day) },
      { storeId: "shibuya", day, code: "MD", required: pickByDay([4, 4, 3, 3, 3, 4, 5], day) },
      { storeId: "shibuya", day, code: "CL", required: pickByDay([3, 3, 2, 2, 2, 4, 4], day) },
      { storeId: "shinjuku", day, code: "OP", required: pickByDay([2, 2, 2, 2, 2, 3, 3], day) },
      { storeId: "shinjuku", day, code: "MD", required: pickByDay([3, 3, 3, 3, 3, 4, 4], day) },
      { storeId: "shinjuku", day, code: "CL", required: pickByDay([2, 2, 2, 2, 2, 3, 3], day) },
      { storeId: "ikebukuro", day, code: "OP", required: pickByDay([2, 1, 1, 1, 1, 2, 2], day) },
      { storeId: "ikebukuro", day, code: "MD", required: pickByDay([2, 2, 2, 2, 2, 3, 3], day) },
      { storeId: "ikebukuro", day, code: "CL", required: pickByDay([1, 1, 1, 1, 1, 2, 2], day) }
    ]),
    assignments: {
      "crew-1": expandAssignments(["OP", "MD", "MD", "-", "OP", "OFF", "OFF"]),
      "crew-2": expandAssignments(["MD", "CL", "OFF", "OP", "MD", "CL", "OFF"]),
      "crew-3": expandAssignments(["CL", "MD", "OP", "OFF", "MD", "CL", "OP"]),
      "crew-4": expandAssignments(["OP", "MD", "OFF", "OP", "MD", "OFF", "OFF"]),
      "crew-5": expandAssignments(["OFF", "CL", "MD", "CL", "OFF", "MD", "CL"])
    },
    aiPlans: [
      { id: "plan-a", name: "案A: 売上バランス重視", fillRate: 94, overtimeDelta: -6, violations: 1, notes: "週末ピーク帯を優先して人員を厚めに配置", applied: true },
      { id: "plan-b", name: "案B: 人件費圧縮", fillRate: 89, overtimeDelta: -12, violations: 2, notes: "平日の中番を薄くしてコスト最適化", applied: false },
      { id: "plan-c", name: "案C: 休み希望優先", fillRate: 91, overtimeDelta: -3, violations: 1, notes: "休み希望を優先して応援配置を増やす", applied: false }
    ],
    aiSettings: {
      templateName: "標準テンプレート",
      minManagerPerShift: 1,
      nightRestDays: 0,
      includePendingRequests: true,
      maxMonthlyOvertimeHours: 24,
      multiStoreWeight: 65,
      laborCostWeight: 60,
      requestPriorityWeight: 60,
    },
  };
}

export const initialState = createHotelState();

export function createBusinessState(businessId: BusinessId) {
  return businessId === "restaurant" ? createRestaurantState() : createHotelState();
}
