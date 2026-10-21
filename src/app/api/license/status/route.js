import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDatabase } from "@/lib/db";

const JNKIE_API = "https://api.jnkie.com/api/v2";

export const instant = false;

export async function GET(request) {
  try {
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from DB
    const db = getDatabase();
    const user = db.users.find((u) => u.id === session.user.id);

    if (!user || !user.license || !user.license.licenseId) {
      return NextResponse.json({ hasLicense: false });
    }

    // Re-check license validity from Jnkie v2 API
    const res = await fetch(`${JNKIE_API}/keys/${user.license.licenseId}`, {
      headers: {
        Authorization: `Bearer ${process.env.JNKIE_API_KEY}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ hasLicense: false });
    }

    const data = await res.json();
    const keyData = data.key || data;

    // Check if expired or invalidated
    const isExpired =
      keyData.expires_at && new Date(keyData.expires_at) < new Date();
    const isActive = !keyData.is_invalidated && !isExpired;

    return NextResponse.json({
      hasLicense: isActive,
      license: {
        licenseId: keyData.id,
        licenseKey: keyData.key_value,
        status: isActive ? "Active" : "Expired",
        expiresAt: keyData.expires_at,
        hwids: keyData.keys_hwid || keyData.hwids || [],
        hwidLimit: keyData.hwid_limit,
        providerId: keyData.provider_id,
        providerName: keyData.provider_name,
      },
    });
  } catch (error) {
    if (
      error?.digest === "HANGING_PROMISE_REJECTION" ||
      error?.digest?.startsWith("NEXT_")
    ) {
      throw error;
    }
    console.error("License status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch license status" },
      { status: 500 }
    );
  }
}
