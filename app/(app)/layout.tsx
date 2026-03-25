import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { canAccessPath, requireCurrentUser } from "@/lib/auth";
import { AppProviders } from "./providers";
import { mobilePreviewUser } from "./mobile-preview-user";

const dashboardPath = "/dashboard";
const isMobileBuild = process.env.MOBILE_BUILD === "true";

export default async function ProtectedAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (isMobileBuild) {
    return <AppProviders user={mobilePreviewUser}>{children}</AppProviders>;
  }

  const user = await requireCurrentUser();

  if (!canAccessPath(user, dashboardPath)) {
    redirect(user.allowedPagePaths[0] ?? "/login");
  }

  return <AppProviders user={user}>{children}</AppProviders>;
}
