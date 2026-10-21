import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { connection } from "next/server";

export const sessionOptions = {
  password: process.env.SESSION_SECRET,
  cookieName: "novel_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession() {
  try {
    await connection();
  } catch (_) {}
  const cookieStore = await cookies();
  return getIronSession(cookieStore, sessionOptions);
}
