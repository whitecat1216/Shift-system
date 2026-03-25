"use client";

import { ReactNode } from "react";
import { AuthProvider, SessionUser } from "./auth-context";
import { AppStateProvider } from "./state";

export function AppProviders({
  user,
  children,
}: {
  user: SessionUser;
  children: ReactNode;
}) {
  const initialBusinessId =
    user.allowedBusinessIds[0] === "restaurant" ? "restaurant" : "hotel";

  return (
    <AuthProvider user={user}>
      <AppStateProvider
        accessScope={{
          allowedBusinessIds: user.allowedBusinessIds.filter(
            (businessId): businessId is "hotel" | "restaurant" =>
              businessId === "hotel" || businessId === "restaurant",
          ),
          allowedStoreIds: user.allowedStoreIds,
          initialBusinessId,
        }}
      >
        {children}
      </AppStateProvider>
    </AuthProvider>
  );
}
