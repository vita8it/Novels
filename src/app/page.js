import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import LandingView from "./LandingView";

export const metadata = {
  title: "Novel",
  description: "Novel is a simple Roblox automation hub built for faster, stability, and ease of use.",
};

async function AuthGate() {
  const session = await getSession();
  if (session.user) {
    redirect("/dashboard");
  }
  return null;
}

export default function Home() {
  return (
    <>
      <Suspense fallback={null}>
        <AuthGate />
      </Suspense>
      <LandingView />
    </>
  );
}
