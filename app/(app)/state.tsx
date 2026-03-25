"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BusinessConfig,
  BusinessId,
  fetchBusinessConfig,
  getBusinessConfig,
} from "./business-config";
import {
  AppState,
  createBusinessState,
  dayHeaders,
  LeaveRequest,
  RequestStatus,
  ShiftCode,
  StaffMember,
} from "./mock-data";

export type AccessScope = {
  allowedBusinessIds: BusinessId[];
  allowedStoreIds: string[];
  initialBusinessId: BusinessId;
};

function normalizeStoredState(value: unknown): AppState {
  if (!value || typeof value !== "object") {
    return createBusinessState("hotel");
  }

  const candidate = value as Partial<AppState>;
  const businessId = candidate.businessId === "restaurant" ? "restaurant" : "hotel";
  const fallback = createBusinessState(businessId);

  return {
    ...fallback,
    ...candidate,
    businessId,
    selectedStoreId: candidate.selectedStoreId ?? fallback.selectedStoreId,
    stores: candidate.stores ?? fallback.stores,
    staff: candidate.staff ?? fallback.staff,
    leaveRequests: candidate.leaveRequests ?? fallback.leaveRequests,
    shiftRequirements: candidate.shiftRequirements ?? fallback.shiftRequirements,
    assignments: candidate.assignments ?? fallback.assignments,
    aiPlans: candidate.aiPlans ?? fallback.aiPlans,
    aiSettings: candidate.aiSettings ?? fallback.aiSettings,
  };
}

function applyAccessScope(state: AppState, accessScope: AccessScope) {
  const fallbackState = createBusinessState(accessScope.initialBusinessId);
  const allowedStores = state.stores.filter((store) => accessScope.allowedStoreIds.includes(store.id));
  const storeIds = new Set(allowedStores.map((store) => store.id));
  const allowedStaff = state.staff.filter((member) => storeIds.has(member.storeId));
  const allowedStaffIds = new Set(allowedStaff.map((member) => member.id));
  const selectedStoreId = storeIds.has(state.selectedStoreId)
    ? state.selectedStoreId
    : allowedStores[0]?.id ?? fallbackState.selectedStoreId;

  return {
    ...state,
    businessId: accessScope.allowedBusinessIds.includes(state.businessId)
      ? state.businessId
      : accessScope.initialBusinessId,
    selectedStoreId,
    stores: allowedStores,
    staff: allowedStaff,
    leaveRequests: state.leaveRequests.filter((request) => allowedStaffIds.has(request.staffId)),
    shiftRequirements: state.shiftRequirements.filter((item) => storeIds.has(item.storeId)),
    assignments: Object.fromEntries(
      Object.entries(state.assignments).filter(([staffId]) => allowedStaffIds.has(staffId)),
    ),
  };
}

type AppContextValue = {
  state: AppState;
  businessConfig: BusinessConfig;
  selectedStoreName: string;
  refreshFromServer: () => Promise<void>;
  setBusiness: (businessId: BusinessId) => void;
  setSelectedStore: (storeId: string) => void;
  togglePublished: () => void;
  changeMonth: (direction: "prev" | "next") => void;
  updateAssignment: (staffId: string, day: number, code: ShiftCode) => void;
  updateRequestStatus: (requestId: string, status: RequestStatus) => void;
  addLeaveRequest: (request: Omit<LeaveRequest, "id" | "status" | "createdAt">) => void;
  addStaff: (staff: Omit<StaffMember, "id" | "active">) => void;
  applyAiPlan: (planId: string) => void;
  generateAiPlans: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function AppStateProvider({
  children,
  accessScope,
}: {
  children: ReactNode;
  accessScope: AccessScope;
}) {
  const [state, setState] = useState<AppState>(() =>
    applyAccessScope(createBusinessState(accessScope.initialBusinessId), accessScope),
  );
  const [remoteBusinessConfig, setRemoteBusinessConfig] = useState<BusinessConfig | null>(null);

  const businessConfig =
    remoteBusinessConfig?.id === state.businessId
      ? remoteBusinessConfig
      : getBusinessConfig(state.businessId ?? "hotel");

  const selectedStoreName =
    state.stores.find((store) => store.id === state.selectedStoreId)?.name ?? "拠点未設定";

  useEffect(() => {
    let ignore = false;

    void fetchBusinessConfig(state.businessId ?? "hotel").then((config) => {
      if (!ignore) {
        setRemoteBusinessConfig(config);
      }
    });

    return () => {
      ignore = true;
    };
  }, [state.businessId]);

  async function refreshFromServer(nextBusinessId?: BusinessId, nextMonth?: string) {
    const businessId = nextBusinessId ?? state.businessId;
    const month = nextMonth ?? state.currentMonth;

    try {
      const response = await fetch(
        `/api/app-state?business=${businessId}&month=${encodeURIComponent(month)}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error(`Failed to load app state: ${response.status}`);
      }

      const payload = (await response.json()) as AppState;
      setState((current) => {
        const scoped = applyAccessScope(payload, accessScope);
        return {
          ...scoped,
          currentMonth: month,
          selectedStoreId: scoped.stores.some((store) => store.id === current.selectedStoreId)
            ? current.selectedStoreId
            : scoped.selectedStoreId,
        };
      });
    } catch {
      setState((current) => applyAccessScope(current, accessScope));
    }
  }

  useEffect(() => {
    void refreshFromServer(state.businessId, state.currentMonth);
  }, [accessScope, state.businessId, state.currentMonth]);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      businessConfig,
      selectedStoreName,
      refreshFromServer: () => refreshFromServer(),
      setBusiness: (businessId) => {
        if (!accessScope.allowedBusinessIds.includes(businessId)) {
          return;
        }
        setRemoteBusinessConfig(null);
        setState((current) => ({
          ...applyAccessScope(createBusinessState(businessId), accessScope),
          currentMonth: current.currentMonth,
        }));
      },
      setSelectedStore: (storeId) =>
        setState((current) => ({
          ...current,
          selectedStoreId: accessScope.allowedStoreIds.includes(storeId)
            ? storeId
            : current.selectedStoreId,
        })),
      togglePublished: () =>
        setState((current) => {
          const nextPublished = !current.published;
          void fetch("/api/publish", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              businessId: current.businessId,
              storeId: current.selectedStoreId,
              monthLabel: current.currentMonth,
              published: nextPublished,
            }),
          });

          return {
            ...current,
            published: nextPublished,
          };
        }),
      changeMonth: (direction) =>
        setState((current) => {
          const months = ["2026年2月", "2026年3月", "2026年4月"];
          const index = months.indexOf(current.currentMonth);
          const nextIndex =
            direction === "next"
              ? Math.min(months.length - 1, index + 1)
              : Math.max(0, index - 1);
          return {
            ...current,
            currentMonth: months[nextIndex],
          };
        }),
      updateAssignment: (staffId, day, code) =>
        setState((current) => {
          void fetch("/api/shift-assignments", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              businessId: current.businessId,
              staffId,
              day,
              code,
              monthLabel: current.currentMonth,
            }),
          });

          return {
            ...current,
            assignments: {
              ...current.assignments,
              [staffId]: current.assignments[staffId].map((currentCode, index) =>
                index === day - 1 ? code : currentCode,
              ),
            },
          };
        }),
      updateRequestStatus: (requestId, status) =>
        setState((current) => {
          void fetch(`/api/leave-requests/${requestId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              businessId: current.businessId,
              status,
            }),
          });

          return {
            ...current,
            leaveRequests: current.leaveRequests.map((request) =>
              request.id === requestId ? { ...request, status } : request,
            ),
          };
        }),
      addLeaveRequest: (request) =>
        setState((current) => {
          const id =
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
              ? `req-${crypto.randomUUID()}`
              : `req-${Date.now()}`;

          void fetch("/api/leave-requests", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              businessId: current.businessId,
              staffId: request.staffId,
              requestType: request.type,
              days: request.days,
              reason: request.reason,
              monthLabel: current.currentMonth,
            }),
          });

          return {
            ...current,
            leaveRequests: [
              {
                id,
                status: "pending",
                createdAt: new Date().toISOString().slice(0, 10),
                ...request,
              },
              ...current.leaveRequests,
            ],
          };
        }),
      addStaff: (staff) =>
        setState((current) => {
          const id =
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
              ? `staff-${crypto.randomUUID()}`
              : `staff-${Date.now()}`;

          void fetch("/api/staff", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              businessId: current.businessId,
              name: staff.name,
              storeId: staff.storeId,
              employmentType: staff.employmentType,
              qualification: staff.qualification,
              role: staff.role,
              hourlyWage: staff.hourlyWage,
              nightAvailable: staff.nightAvailable,
              multiStoreAvailable: staff.multiStoreAvailable,
            }),
          }).then(() => {
            void refreshFromServer(current.businessId, current.currentMonth);
          });

          return {
            ...current,
            staff: [
              ...current.staff,
              {
                id,
                active: true,
                ...staff,
              },
            ],
            assignments: {
              ...current.assignments,
              [id]: dayHeaders.map(() => businessConfig.specialShifts.unassigned.code),
            },
          };
        }),
      applyAiPlan: (planId) =>
        setState((current) => {
          void fetch("/api/ai-plans/apply", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              businessId: current.businessId,
              planId,
              monthLabel: current.currentMonth,
              storeId: current.selectedStoreId,
            }),
          }).then(() => {
            void refreshFromServer(current.businessId, current.currentMonth);
          });

          const nextAssignments = deepClone(current.assignments);
          const targetPlan = current.aiPlans.find((plan) => plan.id === planId);
          if (!targetPlan) {
            return current;
          }

          const shiftCodes = businessConfig.shiftTypes.map((shiftType) => shiftType.code);
          const offCode = businessConfig.specialShifts.off.code;
          const emptyCode = businessConfig.specialShifts.unassigned.code;

          const primary = shiftCodes[0] ?? emptyCode;
          const secondary = shiftCodes[1] ?? primary;
          const tertiary = shiftCodes[2] ?? secondary;

          const ids = Object.keys(nextAssignments);
          if (ids.length >= 3) {
            if (planId === "plan-b") {
              nextAssignments[ids[0]][0] = primary;
              nextAssignments[ids[1]][4] = secondary;
              nextAssignments[ids[2]][6] = tertiary;
            } else if (planId === "plan-c") {
              nextAssignments[ids[0]][2] = offCode;
              nextAssignments[ids[1]][3] = offCode;
              nextAssignments[ids[2]][4] = secondary;
            } else {
              nextAssignments[ids[0]][0] = emptyCode;
              nextAssignments[ids[1]][4] = offCode;
              nextAssignments[ids[2]][6] = offCode;
            }
          }

          return {
            ...current,
            assignments: nextAssignments,
            aiPlans: current.aiPlans.map((plan) => ({
              ...plan,
              applied: plan.id === planId,
            })),
          };
        }),
      generateAiPlans: () =>
        void refreshFromServer(),
    }),
    [accessScope, businessConfig, selectedStoreName, state],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}

export function getStaffName(staff: StaffMember[], staffId: string) {
  return staff.find((member) => member.id === staffId)?.name ?? "不明";
}

export function countRequestStatus(requests: LeaveRequest[], status: RequestStatus) {
  return requests.filter((request) => request.status === status).length;
}

export function calculateCoverage(
  state: AppState,
  businessConfig: ReturnType<typeof getBusinessConfig>,
) {
  const currentStaff = state.staff.filter(
    (member) => member.active && member.storeId === state.selectedStoreId,
  );

  const rows = Object.fromEntries(
    businessConfig.shiftTypes.map((shiftType) => [shiftType.code, dayHeaders.map(() => 0)]),
  ) as Record<string, number[]>;

  currentStaff.forEach((member) => {
    state.assignments[member.id]?.forEach((code, index) => {
      if (rows[code]) {
        rows[code][index] += 1;
      }
    });
  });

  return rows;
}

export function calculateFillRate(
  state: AppState,
  businessConfig: ReturnType<typeof getBusinessConfig>,
) {
  const coverage = calculateCoverage(state, businessConfig);
  const requirements = state.shiftRequirements.filter(
    (item) => item.storeId === state.selectedStoreId,
  );

  const totals = requirements.reduce(
    (acc, item) => {
      acc.required += item.required;
      acc.filled += Math.min(coverage[item.code]?.[item.day - 1] ?? 0, item.required);
      return acc;
    },
    { required: 0, filled: 0 },
  );

  return totals.required === 0 ? 0 : Math.round((totals.filled / totals.required) * 100);
}

export function calculateLaborCost(
  state: AppState,
  businessConfig: ReturnType<typeof getBusinessConfig>,
) {
  const shiftHours = Object.fromEntries(
    businessConfig.shiftTypes.map((shiftType) => [shiftType.code, shiftType.hours]),
  ) as Record<string, number>;

  return state.staff.reduce((sum, member) => {
    const assigned = state.assignments[member.id] ?? [];
    const hours = assigned.reduce((total, code) => {
      if (shiftHours[code]) return total + shiftHours[code];
      return total;
    }, 0);
    return sum + hours * member.hourlyWage;
  }, 0);
}
