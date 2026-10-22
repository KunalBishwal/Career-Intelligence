import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getOAuth2Client } from "@/lib/gmail";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code) {
    return NextResponse.redirect(
      `${baseUrl}/setup?error=${encodeURIComponent(error || "No authorization code returned")}`
    );
  }

  try {
    const oauth2Client = await getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: "me" });
    const userEmail = profile.data.emailAddress;

    if (!userEmail) {
      throw new Error("Unable to retrieve user email profile from Gmail API");
    }

    // Save tokens in isolated GmailAccount model
    await prisma.gmailAccount.upsert({
      where: { email: userEmail },
      update: {
        accessToken: tokens.access_token ?? undefined,
        ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
        tokenExpiry: tokens.expiry_date ? BigInt(tokens.expiry_date) : undefined,
        authError: false,
      },
      create: {
        email: userEmail,
        accessToken: tokens.access_token ?? null,
        refreshToken: tokens.refresh_token ?? null,
        tokenExpiry: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
        authError: false,
        isDefault: true,
      },
    });

    // Mirror to singleton for backwards compatibility
    await prisma.appConfig.update({
      where: { id: "singleton" },
      data: {
        accessToken: tokens.access_token ?? null,
        ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
        tokenExpiry: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
        emailAddress: userEmail,
        authError: false,
      },
    });

    return NextResponse.redirect(`${baseUrl}/?connected=true&account=${encodeURIComponent(userEmail)}`);
  } catch (err: any) {
    return NextResponse.redirect(
      `${baseUrl}/setup?error=${encodeURIComponent(err.message || "OAuth exchange failed")}`
    );
  }
}
