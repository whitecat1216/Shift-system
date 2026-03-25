"use client";

import { createContext, ReactNode, useContext } from "react";

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  roleCodes: string[];
  allowedPagePaths: string[];
  allowedBusinessIds: string[];
  allowedStoreIds: string[];
};

const AuthContext = createContext<SessionUser | null>(null);

export function AuthProvider({
  user,
  children,
}: {
  user: SessionUser;
  children: ReactNode;
}) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
