import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDatabase, saveDatabase } from "@/lib/db";

const JNKIE_API = "https://api.jnkie.com/api/v2";

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key } = await request.json();
    if (!key || typeof key !== "string" || key.trim().length === 0) {
      return NextResponse.json(
        { error: "License key is required" },
        { status: 400 }
      );
    }

    // Search for the key in Jnkie API v2
    const res = await fetch(
      `${JNKIE_API}/keys?key=${encodeURIComponent(key.trim())}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.JNKIE_API_KEY}`,
        },
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Jnkie API error:", res.status, errText);
      return NextResponse.json(
        { error: "Failed to validate license with provider", valid: false },
        { status: 400 }
      );
    }

    const data = await res.json();

    // Check if key was found
    if (!data.keys || data.keys.length === 0) {
      return NextResponse.json(
        { error: "Invalid license key", valid: false },
        { status: 400 }
      );
    }

    const keyData = data.keys[0];

    // Check if key is invalidated
    if (keyData.is_invalidated) {
      return NextResponse.json(
        { error: "This license key has been invalidated", valid: false },
        { status: 400 }
      );
    }

    // Check if key is expired
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This license key has expired", valid: false },
        { status: 400 }
      );
    }

    // License is valid — save to user's database record
    const db = getDatabase();
    const userIndex = db.users.findIndex((u) => u.id === session.user.id);

    const licenseData = {
      licenseId: keyData.id,
      licenseKey: keyData.key_value,
      status: "Active",
      expiresAt: keyData.expires_at,
      hwids: keyData.keys_hwid || keyData.hwids || [],
      hwidLimit: keyData.hwid_limit,
      providerId: keyData.provider_id,
      providerName: keyData.provider_name,
      activatedAt: new Date().toISOString(),
    };

    if (userIndex >= 0) {
      db.users[userIndex].license = licenseData;
      db.users[userIndex].updatedAt = new Date().toISOString();
    }

    saveDatabase(db);

    return NextResponse.json({
      valid: true,
      license: licenseData,
    });
  } catch (error) {
    if (
      error?.digest === "HANGING_PROMISE_REJECTION" ||
      error?.digest?.startsWith("NEXT_")
    ) {
      throw error;
    }
    console.error("License validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate license" },
      { status: 500 }
    );
  }
}
