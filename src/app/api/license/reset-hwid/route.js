import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDatabase, saveDatabase } from "@/lib/db";

const JNKIE_API = "https://api.jnkie.com/api/v2";

export async function POST() {
  try {
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDatabase();
    const userIndex = db.users.findIndex((u) => u.id === session.user.id);
    const user = userIndex >= 0 ? db.users[userIndex] : null;

    if (!user || !user.license || !user.license.licenseId) {
      return NextResponse.json(
        { error: "No active license found to reset HWID" },
        { status: 400 }
      );
    }

    const licenseId = user.license.licenseId;

    // Call Jnkie API v2 to reset HWID
    const res = await fetch(`${JNKIE_API}/keys/${licenseId}/reset-hwid`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.JNKIE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.message || errData.error || "Failed to reset HWID" },
        { status: res.status }
      );
    }

    const result = await res.json();

    // Update locally stored user license
    if (userIndex >= 0) {
      db.users[userIndex].license = {
        ...db.users[userIndex].license,
        hwids: [],
        updatedAt: new Date().toISOString(),
      };
      saveDatabase(db);
    }

    return NextResponse.json({
      success: true,
      message: result.message || "HWID reset successfully",
    });
  } catch (error) {
    if (
      error?.digest === "HANGING_PROMISE_REJECTION" ||
      error?.digest?.startsWith("NEXT_")
    ) {
      throw error;
    }
    console.error("Reset HWID error:", error);
    return NextResponse.json(
      { error: "Internal server error resetting HWID" },
      { status: 500 }
    );
  }
}
