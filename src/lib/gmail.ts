import fs from "fs";
import path from "path";
import { google } from "googleapis";
import { prisma } from "./prisma";

export const GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

export function getRedirectUri() {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const files = fs.readdirSync(process.cwd());
    const secretFile = files.find(
      (f) => f.startsWith("client_secret") && f.endsWith(".json")
    );
    if (secretFile) {
      const content = fs.readFileSync(path.join(process.cwd(), secretFile), "utf-8");
      const parsed = JSON.parse(content);
      const uris = parsed.web?.redirect_uris || parsed.installed?.redirect_uris;
      if (Array.isArray(uris) && uris.length > 0) {
        return uris[0];
      }
    }
  } catch {
    // fallback
  }
  return `${baseUrl}/api/auth/google/callback`;
}

export async function getOAuth2Client(accountEmail?: string) {
  const config = await prisma.appConfig.findUnique({
    where: { id: "singleton" },
  });

  const clientId = config?.clientId || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = config?.clientSecret || process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("MISSING_CREDENTIALS");
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    getRedirectUri()
  );

  // If specific account requested, load from GmailAccount
  let targetAccount = null;
  if (accountEmail) {
    targetAccount = await prisma.gmailAccount.findUnique({
      where: { email: accountEmail },
    });
  } else {
    // Default to the default account, or first connected account, or singleton
    targetAccount = await prisma.gmailAccount.findFirst({
      where: { isDefault: true, refreshToken: { not: null } },
    });
    if (!targetAccount) {
      targetAccount = await prisma.gmailAccount.findFirst({
        where: { refreshToken: { not: null } },
      });
    }
  }

  const accessToken = targetAccount?.accessToken || config.accessToken;
  const refreshToken = targetAccount?.refreshToken || config.refreshToken;
  const tokenExpiry = targetAccount?.tokenExpiry || config.tokenExpiry;
  const emailToTrack = targetAccount?.email || config.emailAddress;

  if (accessToken || refreshToken) {
    oauth2Client.setCredentials({
      access_token: accessToken ?? undefined,
      refresh_token: refreshToken ?? undefined,
      expiry_date: tokenExpiry ? Number(tokenExpiry) : undefined,
    });
  }

  oauth2Client.on("tokens", async (tokens) => {
    if (emailToTrack) {
      await prisma.gmailAccount.upsert({
        where: { email: emailToTrack },
        update: {
          accessToken: tokens.access_token ?? undefined,
          ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
          ...(tokens.expiry_date && { tokenExpiry: BigInt(tokens.expiry_date) }),
          authError: false,
        },
        create: {
          email: emailToTrack,
          accessToken: tokens.access_token ?? null,
          refreshToken: tokens.refresh_token ?? null,
          tokenExpiry: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
          authError: false,
          isDefault: true,
        },
      });
    }

    // Mirror to singleton for backwards compatibility
    await prisma.appConfig.update({
      where: { id: "singleton" },
      data: {
        accessToken: tokens.access_token ?? undefined,
        ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
        ...(tokens.expiry_date && { tokenExpiry: BigInt(tokens.expiry_date) }),
        authError: false,
      },
    });
  });

  return oauth2Client;
}

export async function getAuthorizedGmailClient(accountEmail?: string) {
  let targetEmail = accountEmail;

  if (!targetEmail) {
    const defaultAcc = await prisma.gmailAccount.findFirst({
      where: { isDefault: true, refreshToken: { not: null } },
    });
    if (defaultAcc) {
      targetEmail = defaultAcc.email;
    } else {
      const anyAcc = await prisma.gmailAccount.findFirst({
        where: { refreshToken: { not: null } },
      });
      if (anyAcc) targetEmail = anyAcc.email;
    }
  }

  const account = targetEmail
    ? await prisma.gmailAccount.findUnique({ where: { email: targetEmail } })
    : null;

  const config = await prisma.appConfig.findUnique({
    where: { id: "singleton" },
  });

  const refreshToken = account?.refreshToken || config?.refreshToken;
  if (!refreshToken) {
    throw new Error("NOT_AUTHENTICATED");
  }

  const resolvedEmail = account?.email || config?.emailAddress || "unknown@gmail.com";
  const oauth2Client = await getOAuth2Client(resolvedEmail);

  try {
    await oauth2Client.getAccessToken();
  } catch (err: any) {
    const isInvalidGrant =
      err?.response?.data?.error === "invalid_grant" ||
      err?.message?.includes("invalid_grant") ||
      err?.code === 401;

    if (isInvalidGrant) {
      if (account) {
        await prisma.gmailAccount.update({
          where: { email: account.email },
          data: { authError: true },
        });
      }
      await prisma.appConfig.update({
        where: { id: "singleton" },
        data: { authError: true },
      });
      throw new Error("TOKEN_EXPIRED_RECONNECT_REQUIRED");
    }
    throw err;
  }

  return {
    gmail: google.gmail({ version: "v1", auth: oauth2Client }),
    accountEmail: resolvedEmail,
  };
}
