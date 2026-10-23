import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfWeek, format } from "date-fns";
import { generateMockDataset } from "@/lib/mockData";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const requestedAccount = searchParams.get("account");
  const forceDemo = searchParams.get("demo") === "true" || requestedAccount === "demo";

  if (forceDemo) {
    return NextResponse.json(generateMockDataset());
  }

  // Load config & connected accounts
  const [config, dbAccounts] = await Promise.all([
    prisma.appConfig.findUnique({ where: { id: "singleton" } }),
    prisma.gmailAccount.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        isDefault: true,
        lastSyncedAt: true,
        authError: true,
        _count: {
          select: { applications: true },
        },
      },
    }),
  ]);

  // Format accounts list safely (zero tokens exposed)
  const accounts = dbAccounts.map((acc) => ({
    id: acc.id,
    email: acc.email,
    isDefault: acc.isDefault,
    lastSyncedAt: acc.lastSyncedAt,
    authError: acc.authError,
    isConnected: !acc.authError,
    applicationCount: acc._count.applications,
  }));

  // Determine active account selection
  let activeAccount: string;
  if (requestedAccount && requestedAccount !== "demo") {
    activeAccount = requestedAccount;
  } else if (accounts.length > 0) {
    const defaultAcc = accounts.find((a) => a.isDefault) || accounts[0];
    activeAccount = defaultAcc.email;
  } else if (config?.emailAddress) {
    activeAccount = config.emailAddress;
  } else {
    activeAccount = "ALL";
  }

  // Account filter
  const accountFilter =
    activeAccount !== "ALL" && activeAccount ? { accountEmail: activeAccount } : {};

  const [applications, notifications] = await Promise.all([
    prisma.application.findMany({
      where: accountFilter,
      orderBy: { lastUpdatedAt: "desc" },
    }),
    prisma.notification.findMany({
      where: accountFilter,
      orderBy: { receivedAt: "desc" },
      take: 30,
    }),
  ]);

  // If no personal accounts exist and no applications exist, automatically populate demo mode
  // This keeps personal data safe and provides an immediate showcase experience
  if (accounts.length === 0 && applications.length === 0) {
    return NextResponse.json(generateMockDataset());
  }

  const total = applications.length;
  const counts: Record<string, number> = {
    APPLIED: 0,
    IN_REVIEW: 0,
    INTERVIEW: 0,
    REJECTED: 0,
    OFFER: 0,
  };

  for (const app of applications) {
    counts[app.status] = (counts[app.status] || 0) + 1;
  }

  const responsesReceived =
    counts.IN_REVIEW + counts.INTERVIEW + counts.REJECTED + counts.OFFER;
  const interviews = counts.INTERVIEW + counts.OFFER;
  const rejections = counts.REJECTED;
  const responseRate =
    total > 0 ? Math.round((responsesReceived / total) * 100) : 0;

  // Chartreuse (#D4FF3F) & Hot Pink (#FF2DAB) themed funnel & charts
  const funnelData = [
    { stage: "Applied", count: total, fill: "#38bdf8" },
    {
      stage: "In Review",
      count: counts.IN_REVIEW + counts.INTERVIEW + counts.OFFER,
      fill: "#a855f7",
    },
    {
      stage: "Interview",
      count: counts.INTERVIEW + counts.OFFER,
      fill: "#FF2DAB", // Hot Pink
    },
    {
      stage: "Offer",
      count: counts.OFFER,
      fill: "#D4FF3F", // Chartreuse
    },
  ];

  const weeklyMap = new Map<string, number>();
  for (const app of applications) {
    const weekStart = startOfWeek(new Date(app.appliedAt), {
      weekStartsOn: 1,
    });
    const key = format(weekStart, "yyyy-MM-dd");
    weeklyMap.set(key, (weeklyMap.get(key) || 0) + 1);
  }

  const timelineData = Array.from(weeklyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekKey, count]) => ({
      week: format(new Date(weekKey), "MMM d"),
      applications: count,
    }));

  const statusDistribution = [
    { name: "Applied", value: counts.APPLIED, color: "#38bdf8" },
    { name: "In Review", value: counts.IN_REVIEW, color: "#a855f7" },
    { name: "Interview", value: counts.INTERVIEW, color: "#FF2DAB" }, // Hot Pink
    { name: "Offer", value: counts.OFFER, color: "#D4FF3F" }, // Chartreuse
    { name: "Rejected", value: counts.REJECTED, color: "#f43f5e" },
  ].filter((item) => item.value > 0);

  // Active account metadata
  const currentAccountObj = accounts.find((a) => a.email === activeAccount);

  return NextResponse.json({
    connection: {
      hasCredentials: Boolean(config?.clientId && config?.clientSecret),
      isConnected:
        accounts.length > 0
          ? accounts.some((a) => a.isConnected)
          : Boolean(config?.refreshToken && !config?.authError),
      authError: Boolean(currentAccountObj?.authError || config?.authError),
      emailAddress:
        activeAccount !== "ALL"
          ? activeAccount
          : config?.emailAddress || accounts[0]?.email || null,
      lastSyncedAt:
        currentAccountObj?.lastSyncedAt || config?.lastSyncedAt || null,
    },
    accounts,
    activeAccount,
    stats: {
      total,
      responsesReceived,
      interviews,
      rejections,
      responseRate,
    },
    charts: {
      funnelData,
      timelineData,
      statusDistribution,
    },
    applications,
    notifications,
  });
}
