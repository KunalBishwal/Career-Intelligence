import { startOfWeek, format, subDays, subHours } from "date-fns";

export interface MockApplication {
  id: string;
  company: string;
  role: string;
  status: "APPLIED" | "IN_REVIEW" | "INTERVIEW" | "REJECTED" | "OFFER";
  source: string;
  appliedAt: string;
  lastUpdatedAt: string;
  rawSubject: string;
  accountEmail: string;
}

export interface MockNotification {
  id: string;
  source: string;
  subject: string;
  receivedAt: string;
  snippet: string;
  accountEmail: string;
}

export function generateMockDataset() {
  const now = new Date();

  const mockApplications: MockApplication[] = [
    {
      id: "demo-app-1",
      company: "Anthropic",
      role: "AI Systems Research Engineer",
      status: "OFFER",
      source: "Ashby",
      appliedAt: subDays(now, 26).toISOString(),
      lastUpdatedAt: subDays(now, 1).toISOString(),
      rawSubject: "Offer from Anthropic - AI Systems Research",
      accountEmail: "demo.candidate@gmail.com",
    },
    {
      id: "demo-app-2",
      company: "OpenAI",
      role: "Full-Stack Product Engineer",
      status: "INTERVIEW",
      source: "Greenhouse",
      appliedAt: subDays(now, 20).toISOString(),
      lastUpdatedAt: subDays(now, 2).toISOString(),
      rawSubject: "Next Steps: Technical Interview with OpenAI Engineering Team",
      accountEmail: "demo.candidate@gmail.com",
    },
    {
      id: "demo-app-3",
      company: "Stripe",
      role: "Staff Infrastructure Engineer",
      status: "INTERVIEW",
      source: "Lever",
      appliedAt: subDays(now, 18).toISOString(),
      lastUpdatedAt: subDays(now, 3).toISOString(),
      rawSubject: "Invitation: System Design Interview with Stripe",
      accountEmail: "demo.candidate@gmail.com",
    },
    {
      id: "demo-app-4",
      company: "Figma",
      role: "Frontend Design Technologist",
      status: "INTERVIEW",
      source: "Ashby",
      appliedAt: subDays(now, 15).toISOString(),
      lastUpdatedAt: subDays(now, 4).toISOString(),
      rawSubject: "Figma Team Match & Architecture Presentation",
      accountEmail: "demo.candidate@gmail.com",
    },
    {
      id: "demo-app-5",
      company: "Vercel",
      role: "Senior Framework Engineer (Next.js)",
      status: "IN_REVIEW",
      source: "Greenhouse",
      appliedAt: subDays(now, 12).toISOString(),
      lastUpdatedAt: subDays(now, 5).toISOString(),
      rawSubject: "Thank you for applying to Vercel - Application Received",
      accountEmail: "demo.candidate@gmail.com",
    },
    {
      id: "demo-app-6",
      company: "Linear",
      role: "Senior Product Engineer",
      status: "IN_REVIEW",
      source: "Workable",
      appliedAt: subDays(now, 9).toISOString(),
      lastUpdatedAt: subDays(now, 6).toISOString(),
      rawSubject: "Linear Application: Review in Progress",
      accountEmail: "demo.candidate@gmail.com",
    },
    {
      id: "demo-app-7",
      company: "Google",
      role: "Staff Software Engineer, Cloud Core",
      status: "IN_REVIEW",
      source: "Google Careers",
      appliedAt: subDays(now, 14).toISOString(),
      lastUpdatedAt: subDays(now, 7).toISOString(),
      rawSubject: "Your application to Google: Staff Software Engineer",
      accountEmail: "demo.candidate@gmail.com",
    },
    {
      id: "demo-app-8",
      company: "Datadog",
      role: "Distributed Systems Engineer",
      status: "APPLIED",
      source: "Greenhouse",
      appliedAt: subDays(now, 5).toISOString(),
      lastUpdatedAt: subDays(now, 5).toISOString(),
      rawSubject: "Application Confirmed: Distributed Systems Engineer at Datadog",
      accountEmail: "demo.candidate@gmail.com",
    },
    {
      id: "demo-app-9",
      company: "Ramp",
      role: "Lead Platform Engineer",
      status: "APPLIED",
      source: "Ashby",
      appliedAt: subDays(now, 4).toISOString(),
      lastUpdatedAt: subDays(now, 4).toISOString(),
      rawSubject: "Ramp - Application Confirmation for Lead Platform Engineer",
      accountEmail: "demo.candidate@gmail.com",
    },
    {
      id: "demo-app-10",
      company: "Supabase",
      role: "Database Kernel Developer",
      status: "APPLIED",
      source: "Lever",
      appliedAt: subDays(now, 3).toISOString(),
      lastUpdatedAt: subDays(now, 3).toISOString(),
      rawSubject: "Supabase: Thank you for applying!",
      accountEmail: "demo.candidate@gmail.com",
    },
    {
      id: "demo-app-11",
      company: "Cloudflare",
      role: "Edge Runtime Engineer",
      status: "APPLIED",
      source: "Workday",
      appliedAt: subDays(now, 2).toISOString(),
      lastUpdatedAt: subDays(now, 2).toISOString(),
      rawSubject: "Cloudflare Application Receipt - Edge Runtime",
      accountEmail: "demo.candidate@gmail.com",
    },
    {
      id: "demo-app-12",
      company: "Netflix",
      role: "Senior UI Architect",
      status: "REJECTED",
      source: "Workday",
      appliedAt: subDays(now, 32).toISOString(),
      lastUpdatedAt: subDays(now, 10).toISOString(),
      rawSubject: "Update regarding your application to Netflix",
      accountEmail: "demo.candidate@gmail.com",
    },
    {
      id: "demo-app-13",
      company: "Airbnb",
      role: "Staff Backend Engineer, Payments",
      status: "REJECTED",
      source: "Greenhouse",
      appliedAt: subDays(now, 28).toISOString(),
      lastUpdatedAt: subDays(now, 11).toISOString(),
      rawSubject: "Thank you for your interest in Airbnb",
      accountEmail: "demo.candidate@gmail.com",
    },
    {
      id: "demo-app-14",
      company: "Palantir",
      role: "Deployment Strategist / Forward Deployed Software Engineer",
      status: "REJECTED",
      source: "Lever",
      appliedAt: subDays(now, 35).toISOString(),
      lastUpdatedAt: subDays(now, 14).toISOString(),
      rawSubject: "Palantir Technologies Application Status",
      accountEmail: "demo.candidate@gmail.com",
    },
  ];

  const mockNotifications: MockNotification[] = [
    {
      id: "demo-notif-1",
      source: "Anthropic",
      subject: "Offer Letter & Comprehensive Equity Package",
      receivedAt: subHours(now, 4).toISOString(),
      snippet: "Congratulations! We are thrilled to extend an offer to join Anthropic as AI Systems Research Engineer...",
      accountEmail: "demo.candidate@gmail.com",
    },
    {
      id: "demo-notif-2",
      source: "OpenAI",
      subject: "Interview Prep Guide: Full-Stack Product Eng",
      receivedAt: subDays(now, 1).toISOString(),
      snippet: "Here is what to expect during your upcoming technical interview with our team. We look forward to meeting you...",
      accountEmail: "demo.candidate@gmail.com",
    },
    {
      id: "demo-notif-3",
      source: "Stripe",
      subject: "Stripe Technical Interview Scheduled",
      receivedAt: subDays(now, 2).toISOString(),
      snippet: "Your architecture interview has been confirmed with the Core Infrastructure team on Thursday at 2:00 PM PST...",
      accountEmail: "demo.candidate@gmail.com",
    },
    {
      id: "demo-notif-4",
      source: "Figma",
      subject: "Figma Portfolio & Architecture Round Details",
      receivedAt: subDays(now, 3).toISOString(),
      snippet: "We loved your previous round. Next step is an interactive presentation of a past project with our staff engineers...",
      accountEmail: "demo.candidate@gmail.com",
    },
    {
      id: "demo-notif-5",
      source: "Vercel",
      subject: "Application in Review: Senior Framework Engineer",
      receivedAt: subDays(now, 5).toISOString(),
      snippet: "Our hiring team has begun reviewing candidate portfolios for the Next.js team. We will be in touch soon...",
      accountEmail: "demo.candidate@gmail.com",
    },
  ];

  const total = mockApplications.length;
  const counts = {
    APPLIED: 0,
    IN_REVIEW: 0,
    INTERVIEW: 0,
    REJECTED: 0,
    OFFER: 0,
  };

  for (const app of mockApplications) {
    counts[app.status] = (counts[app.status] || 0) + 1;
  }

  const responsesReceived = counts.IN_REVIEW + counts.INTERVIEW + counts.REJECTED + counts.OFFER;
  const interviews = counts.INTERVIEW + counts.OFFER;
  const rejections = counts.REJECTED;
  const responseRate = total > 0 ? Math.round((responsesReceived / total) * 100) : 0;

  const funnelData = [
    { stage: "Applied", count: total, fill: "#CBB3E8" },
    { stage: "In Review", count: counts.IN_REVIEW + counts.INTERVIEW + counts.OFFER, fill: "#E0D2F4" },
    { stage: "Interview", count: counts.INTERVIEW + counts.OFFER, fill: "#D4FF3F" },
    { stage: "Offer", count: counts.OFFER, fill: "#D4FF3F" },
  ];

  const weeklyMap = new Map<string, number>();
  for (const app of mockApplications) {
    const weekStart = startOfWeek(new Date(app.appliedAt), { weekStartsOn: 1 });
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
    { name: "Applied", value: counts.APPLIED, color: "#CBB3E8" },
    { name: "In Review", value: counts.IN_REVIEW, color: "#A382CE" },
    { name: "Interview", value: counts.INTERVIEW, color: "#D4FF3F" },
    { name: "Offer", value: counts.OFFER, color: "#D4FF3F" },
    { name: "Rejected", value: counts.REJECTED, color: "#E34234" },
  ].filter((item) => item.value > 0);

  return {
    isDemo: true,
    connection: {
      hasCredentials: true,
      isConnected: false,
      authError: false,
      emailAddress: "demo.candidate@gmail.com",
      lastSyncedAt: subHours(now, 1).toISOString(),
    },
    accounts: [
      {
        id: "demo-acc-1",
        email: "demo.candidate@gmail.com",
        isDefault: true,
        lastSyncedAt: subHours(now, 1).toISOString(),
        authError: false,
        isConnected: true,
        applicationCount: mockApplications.length,
      },
    ],
    activeAccount: "demo.candidate@gmail.com",
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
    applications: mockApplications,
    notifications: mockNotifications,
  };
}
