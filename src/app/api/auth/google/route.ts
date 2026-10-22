import { NextResponse } from "next/server";
import { getOAuth2Client, GMAIL_SCOPES } from "@/lib/gmail";

export async function GET() {
  try {
    const oauth2Client = await getOAuth2Client();

    // Use 'select_account consent' so Google always provides an account switcher
    // allowing users to add/switch multiple Gmail accounts seamlessly.
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "select_account consent",
      scope: GMAIL_SCOPES,
    });

    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    return NextResponse.redirect(
      new URL(
        `/setup?error=${encodeURIComponent(error.message)}`,
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      )
    );
  }
}
