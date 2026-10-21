import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDatabase, saveDatabase } from "@/lib/db";

export async function POST() {
  try {
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDatabase();
    const userIndex = db.users.findIndex((u) => u.id === session.user.id);

    if (userIndex >= 0 && db.users[userIndex].license) {
      delete db.users[userIndex].license;
      db.users[userIndex].updatedAt = new Date().toISOString();
      saveDatabase(db);
    }

    return NextResponse.json({
      success: true,
      message: "Logged out from license key successfully",
    });
  } catch (error) {
    if (
      error?.digest === "HANGING_PROMISE_REJECTION" ||
      error?.digest?.startsWith("NEXT_")
    ) {
      throw error;
    }
    console.error("License logout error:", error);
    return NextResponse.json(
      { error: "Internal server error logging out from license" },
      { status: 500 }
    );
  }
}
