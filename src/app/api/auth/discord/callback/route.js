import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { upsertUser } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/?error=auth_denied", request.url));
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Discord token error:", tokenData);
      return NextResponse.redirect(new URL("/?error=token_failed", request.url));
    }

    // Fetch user profile from Discord
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const discordUser = await userResponse.json();

    if (!userResponse.ok || !discordUser.id) {
      console.error("Discord user fetch error:", discordUser);
      return NextResponse.redirect(new URL("/?error=user_fetch_failed", request.url));
    }

    // Build avatar URL
    const avatarUrl = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(discordUser.discriminator || "0") % 5}.png`;

    const userData = {
      id: discordUser.id,
      username: discordUser.username,
      globalName: discordUser.global_name || discordUser.username,
      email: discordUser.email || null,
      avatar: avatarUrl,
      provider: "discord",
    };

    // Save/update user in database.json
    upsertUser(userData);

    // Save session cookie with iron-session
    const session = await getSession();
    session.user = userData;
    await session.save();

    // Redirect to home or dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (err) {
    console.error("Callback error:", err);
    return NextResponse.redirect(new URL("/?error=server_error", request.url));
  }
}
