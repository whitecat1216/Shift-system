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
  AppState,
  dayHeaders,
  initialState,
  LeaveRequest,
  RequestStatus,
  ShiftCode,
  StaffMember,
  StoreId,
} from "./mock-data";

const STORAGE_KEY = "hotel-shift-state";

type AppContextValue = {
  state: AppState;
  selectedStoreName: string;
  setSelectedStore: (storeId: StoreId) => void;
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

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    if (typeof window === "undefined") {
      return initialState;
    }

    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as AppState) : initialState;
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const selectedStoreName =
    state.stores.find((store) => store.id === state.selectedStoreId)?.name ?? "店舗未設定";

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      selectedStoreName,
      setSelectedStore: (storeId) =>
        setState((current) => ({
          ...current,
          selectedStoreId: storeId,
        })),
      togglePublished: () =>
        setState((current) => ({
          ...current,
          published: !current.published,
        })),
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
        setState((current) => ({
          ...current,
          assignments: {
            ...current.assignments,
            [staffId]: current.assignments[staffId].map((currentCode, index) =>
              index === day - 1 ? code : currentCode,
            ),
          },
        })),
      updateRequestStatus: (requestId, status) =>
        setState((current) => ({
          ...current,
          leaveRequests: current.leaveRequests.map((request) =>
            request.id === requestId ? { ...request, status } : request,
          ),
        })),
      addLeaveRequest: (request) =>
        setState((current) => {
          const id =
            typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
              ? `req-${crypto.randomUUID()}`
              : `req-${Date.now()}`;

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
              [id]: dayHeaders.map(() => "-"),
            },
          };
        }),
      applyAiPlan: (planId) =>
        setState((current) => {
          const nextAssignments = deepClone(current.assignments);
          const targetPlan = current.aiPlans.find((plan) => plan.id === planId);
          if (!targetPlan) {
            return current;
          }

          if (planId === "plan-b") {
            nextAssignments["staff-1"][0] = "A";
            nextAssignments["staff-6"][4] = "B";
            nextAssignments["staff-7"][6] = "N";
          } else if (planId === "plan-c") {
            nextAssignments["staff-2"][9] = "休";
            nextAssignments["staff-3"][10] = "休";
            nextAssignments["staff-4"][8] = "B";
          } else {
            nextAssignments["staff-1"][0] = "-";
            nextAssignments["staff-6"][4] = "休";
            nextAssignments["staff-7"][6] = "休";
            nextAssignments["staff-2"][9] = "N";
            nextAssignments["staff-3"][10] = "B";
            nextAssignments["staff-4"][8] = "N";
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
        setState((current) => ({
          ...current,
          aiPlans: current.aiPlans.map((plan, index) => ({
            ...plan,
            fillRate: Math.min(99, plan.fillRate + (index === 1 ? 1 : 0)),
            overtimeDelta: plan.overtimeDelta + (index === 0 ? -1 : index === 1 ? 1 : 0),
            violations: Math.max(0, plan.violations - (index === 0 ? 1 : 0)),
          })),
        })),
    }),
    [selectedStoreName, state],
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

export function calculateCoverage(state: AppState) {
  const currentStaff = state.staff.filter(
    (member) => member.active && member.storeId === state.selectedStoreId,
  );

  const rows: Record<"A" | "B" | "N", number[]> = {
    A: dayHeaders.map(() => 0),
    B: dayHeaders.map(() => 0),
    N: dayHeaders.map(() => 0),
  };

  currentStaff.forEach((member) => {
    state.assignments[member.id]?.forEach((code, index) => {
      if (code === "A" || code === "B" || code === "N") {
        rows[code][index] += 1;
      }
    });
  });

  return rows;
}

export function calculateFillRate(state: AppState) {
  const coverage = calculateCoverage(state);
  const requirements = state.shiftRequirements.filter(
    (item) => item.storeId === state.selectedStoreId,
  );

  const totals = requirements.reduce(
    (acc, item) => {
      acc.required += item.required;
      acc.filled += Math.min(coverage[item.code][item.day - 1], item.required);
      return acc;
    },
    { required: 0, filled: 0 },
  );

  return totals.required === 0 ? 0 : Math.round((totals.filled / totals.required) * 100);
}

export function calculateLaborCost(state: AppState) {
  return state.staff.reduce((sum, member) => {
    const assigned = state.assignments[member.id] ?? [];
    const hours = assigned.reduce((total, code) => {
      if (code === "A" || code === "B") return total + 8;
      if (code === "N") return total + 9;
      return total;
    }, 0);
    return sum + hours * member.hourlyWage;
  }, 0);
}
