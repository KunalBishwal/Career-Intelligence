import { NextResponse } from "next/server";
import { fetchUnprocessedJobEmails } from "@/lib/fetcher";
import { classifyEmail, persistClassification } from "@/lib/classifier";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    let targetEmail: string | undefined;
    try {
      const body = await req.json();
      if (body?.accountEmail && body.accountEmail !== "ALL") {
        targetEmail = body.accountEmail;
      }
    } catch {
      // Body may be empty if called without payload
    }

    // Determine which accounts to sync
    const accountsToSync: (string | undefined)[] = [];
    if (targetEmail) {
      accountsToSync.push(targetEmail);
    } else {
      const dbAccounts = await prisma.gmailAccount.findMany({
        where: { refreshToken: { not: null } },
        select: { email: true },
      });
      if (dbAccounts.length > 0) {
        accountsToSync.push(...dbAccounts.map((a) => a.email));
      } else {
        // Fallback to default/singleton
        accountsToSync.push(undefined);
      }
    }

    let totalProcessed = 0;
    let applicationsUpdated = 0;
    let notificationsAdded = 0;

    for (const emailAccount of accountsToSync) {
      try {
        const emails = await fetchUnprocessedJobEmails(emailAccount);
        totalProcessed += emails.length;

        for (const email of emails) {
          try {
            const classification = await classifyEmail(email);
            await persistClassification(email, classification, emailAccount);

            if (classification.kind === "APPLICATION") applicationsUpdated++;
            if (classification.kind === "NOTIFICATION") notificationsAdded++;
          } catch (classifyErr: any) {
            console.error(
              `Failed to process/classify email ${email.gmailMessageId}:`,
              classifyErr.message
            );
          }
        }

        const now = new Date();
        if (emailAccount) {
          await prisma.gmailAccount
            .update({
              where: { email: emailAccount },
              data: { lastSyncedAt: now, authError: false },
            })
            .catch(() => {});
        }
      } catch (syncErr: any) {
        console.error(`Sync error for account ${emailAccount}:`, syncErr.message);
        if (
          syncErr.message === "TOKEN_EXPIRED_RECONNECT_REQUIRED" &&
          emailAccount
        ) {
          await prisma.gmailAccount
            .update({
              where: { email: emailAccount },
              data: { authError: true },
            })
            .catch(() => {});
        }
      }
    }

    const updatedConfig = await prisma.appConfig.upsert({
      where: { id: "singleton" },
      update: { lastSyncedAt: new Date(), authError: false },
      create: { id: "singleton", lastSyncedAt: new Date(), authError: false },
    });

    return NextResponse.json({
      success: true,
      processedCount: totalProcessed,
      applicationsUpdated,
      notificationsAdded,
      lastSyncedAt: updatedConfig.lastSyncedAt,
    });
  } catch (err: any) {
    const isAuthError =
      err.message === "TOKEN_EXPIRED_RECONNECT_REQUIRED" ||
      err.message === "NOT_AUTHENTICATED" ||
      err.message === "MISSING_CREDENTIALS";

    return NextResponse.json(
      {
        error: err.message || "Failed to sync Gmail",
        reconnectRequired: isAuthError,
      },
      { status: isAuthError ? 401 : 500 }
    );
  }
}
