import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getUserById } from "@/lib/db";
import DashboardView from "./DashboardView";

export const instant = false;

export const metadata = {
  title: "Dashboard - Novel",
  description: "Manage your Novel Hub license key, loader scripts, and account.",
};

async function DashboardContent() {
  const session = await getSession();

  if (!session.user) {
    redirect("/");
  }

  // Load latest user record from database
  const dbUser = getUserById(session.user.id);
  const user = dbUser || session.user;
  const license = dbUser?.license || null;
  const getLicenseUrl = process.env.GET_LICENSE_URL || "https://discord.gg/your-server";

  return (
    <DashboardView
      initialUser={user}
      initialLicense={license}
      getLicenseUrl={getLicenseUrl}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0d0d0d]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span className="text-xs text-[#8e95a0]">Loading…</span>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
