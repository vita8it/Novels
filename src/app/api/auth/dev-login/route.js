import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDatabase } from "@/lib/db";

export async function GET(request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Dev login only available in development" }, { status: 403 });
  }

  try {
    const db = getDatabase();
    if (!db.users || db.users.length === 0) {
      return NextResponse.json({ error: "No user found in database.json" }, { status: 404 });
    }

    const user = db.users[0];
    const session = await getSession();
    session.user = {
      id: user.id,
      username: user.username,
      globalName: user.globalName,
      email: user.email,
      avatar: user.avatar,
      provider: user.provider || "discord",
    };
    await session.save();

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (err) {
    console.error("Dev login error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
