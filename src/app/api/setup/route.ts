import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const config = await prisma.appConfig.findUnique({
    where: { id: "singleton" },
  });

  return NextResponse.json({
    hasCredentials: Boolean(config?.clientId && config?.clientSecret),
    clientId: config?.clientId || "",
    isConnected: Boolean(config?.refreshToken && !config?.authError),
    authError: Boolean(config?.authError),
    emailAddress: config?.emailAddress || null,
    syncMonths: config?.syncMonths ?? 12,
    lastSyncedAt: config?.lastSyncedAt || null,
  });
}

export async function POST(req: Request) {
  try {
    const { clientId, clientSecret, syncMonths } = await req.json();

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Both Client ID and Client Secret are required." },
        { status: 400 }
      );
    }

    await prisma.appConfig.upsert({
      where: { id: "singleton" },
      update: {
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        syncMonths: Number(syncMonths) || 12,
      },
      create: {
        id: "singleton",
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        syncMonths: Number(syncMonths) || 12,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
