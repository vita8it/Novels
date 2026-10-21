import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const instant = false;

export async function GET(request) {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ authenticated: false, user: null });
  }
  return NextResponse.json({ authenticated: true, user: session.user });
}
