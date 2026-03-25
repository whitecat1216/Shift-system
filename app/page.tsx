import DashboardPage from "./(app)/dashboard/page";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppProviders } from "./(app)/providers";
import { mobilePreviewUser } from "./(app)/mobile-preview-user";

const isMobileBuild = process.env.MOBILE_BUILD === "true";

export default async function HomePage() {
  if (isMobileBuild) {
    return (
      <AppProviders user={mobilePreviewUser}>
        <DashboardPage />
      </AppProviders>
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  redirect(user.allowedPagePaths[0] ?? "/dashboard");
}
