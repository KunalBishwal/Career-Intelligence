import { gmail_v1 } from "googleapis";
import { getAuthorizedGmailClient } from "./gmail";
import { prisma } from "./prisma";
import { subMonths, format } from "date-fns";

export interface ParsedEmail {
  accountEmail?: string;
  gmailMessageId: string;
  subject: string;
  from: string;
  senderName: string;
  senderDomain: string;
  receivedAt: Date;
  snippet: string;
  bodyText: string;
}

const BASE_SEARCH_QUERIES = [
  // 1. Major ATS platforms & recruiting software
  'from:(greenhouse.io OR lever.co OR workday.com OR ashbyhq.com OR smartrecruiters.com OR icims.com OR taleo.net OR bamboohr.com OR myworkdayjobs.com OR jobvite.com OR breezy.hr OR workable.com OR ripplehire.com OR darwinbox.in OR hirevue.com OR hackerrankcareers.com OR lntedutech.com OR shl.com)',

  // 2. Application confirmations & submissions (broad and inclusive)
  '("thank you for applying" OR "thanks for applying" OR "thank you for your application" OR "thanks for your application" OR "application received" OR "application submitted" OR "submitted application" OR "received your application" OR "we received your" OR "your application to" OR "your application for" OR "applied to" OR "applied for" OR "application confirmation") -subject:("job alert" OR "jobs you" OR "recommended jobs" OR "top picks" OR "newsletter" OR "digest")',

  // 3. Interviews, assessments, and coding tests
  '("online assessment" OR "coding assessment" OR "test login credentials" OR "interview invitation" OR "schedule an interview" OR "schedule a call" OR "we\'d like to interview" OR "we\'d like to talk" OR "technical interview" OR "technical assessment" OR "pre-placement talk" OR "hiring process" OR "assessment reminder") -subject:("job alert" OR "newsletter" OR "digest")',

  // 4. Status updates and decisions
  '("status of your application" OR "update on your application" OR "update regarding your application" OR "update on your candidacy" OR "update from" OR "moving forward with" OR "not moving forward" OR "regret to inform" OR "other candidates" OR "job offer" OR "offer letter") -subject:("job alert" OR "newsletter")',

  // 5. Job platform direct applications (LinkedIn, Indeed, Wellfound, Instahyre)
  'from:(linkedin.com OR indeed.com OR wellfound.com OR instahyre.com) ("application was sent" OR "application sent" OR "your application to" OR "application received" OR "application submitted" OR "thanks for applying" OR "you applied to" OR "applied to")',
];

async function withRateLimitBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 2500
): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const status = err?.code || err?.response?.status;
    const isRateOrQuota =
      status === 429 ||
      status === 403 ||
      status === 503 ||
      err?.message?.includes("Quota exceeded") ||
      err?.message?.includes("rateLimitExceeded");

    if (retries > 0 && isRateOrQuota) {
      console.warn(
        `[Gmail RateLimit] Throttled (${err.message}). Waiting ${delayMs}ms before retry...`
      );
      await new Promise((r) => setTimeout(r, delayMs));
      return withRateLimitBackoff(fn, retries - 1, delayMs * 2);
    }
    throw err;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function extractBodyText(payload?: gmail_v1.Schema$MessagePart): string {
  if (!payload) return "";

  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts && payload.parts.length > 0) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        return stripHtml(decodeBase64Url(part.body.data));
      }
    }
    for (const part of payload.parts) {
      const nested = extractBodyText(part);
      if (nested) return nested;
    }
  }

  if (payload.mimeType === "text/html" && payload.body?.data) {
    return stripHtml(decodeBase64Url(payload.body.data));
  }

  return "";
}

function parseFromHeader(fromHeader: string): {
  senderName: string;
  senderDomain: string;
} {
  const emailMatch = fromHeader.match(/<([^>]+)>/) || [null, fromHeader];
  const email = (emailMatch[1] || "").trim().toLowerCase();
  const domain = email.split("@")[1] || "";

  let senderName = fromHeader
    .replace(/<[^>]+>/g, "")
    .replace(/["']/g, "")
    .trim();
  if (!senderName || senderName.includes("@")) {
    senderName = domain.split(".")[0] || "Unknown";
  }

  return { senderName, senderDomain: domain };
}

export async function fetchUnprocessedJobEmails(
  targetAccountEmail?: string
): Promise<ParsedEmail[]> {
  const { gmail, accountEmail } = await getAuthorizedGmailClient(
    targetAccountEmail
  );
  const config = await prisma.appConfig.findUnique({
    where: { id: "singleton" },
  });

  const syncMonths = config?.syncMonths ?? 12;
  const cutoffDate = subMonths(new Date(), syncMonths);
  const afterFilter = `after:${format(cutoffDate, "yyyy/MM/dd")}`;

  const queries = [...BASE_SEARCH_QUERIES];

  try {
    const labelsRes = await withRateLimitBackoff(() =>
      gmail.users.labels.list({ userId: "me" })
    );
    const hasJobsLabel = labelsRes.data.labels?.some(
      (l) => l.name?.toLowerCase() === "jobs"
    );
    if (hasJobsLabel) {
      queries.push("label:Jobs");
    }
  } catch {
    // Ignore label lookup error
  }

  const discoveredIds = new Set<string>();

  for (const rawQuery of queries) {
    const q = `(${rawQuery}) ${afterFilter}`;
    let pageToken: string | undefined = undefined;

    do {
      const listRes: any = await withRateLimitBackoff(() =>
        gmail.users.messages.list({
          userId: "me",
          q,
          maxResults: 100,
          pageToken,
        })
      );

      const messages = listRes.data.messages || [];
      for (const msg of messages) {
        if (msg.id) discoveredIds.add(msg.id);
      }

      pageToken = listRes.data.nextPageToken ?? undefined;
    } while (pageToken);
  }

  if (discoveredIds.size === 0) return [];

  const allIds = Array.from(discoveredIds);
  const existingRecords = await prisma.processedEmail.findMany({
    where: {
      gmailMessageId: { in: allIds },
      ...(accountEmail ? { accountEmail } : {}),
    },
    select: { gmailMessageId: true },
  });
  const processedSet = new Set(existingRecords.map((r) => r.gmailMessageId));
  const newIds = allIds.filter((id) => !processedSet.has(id));

  // Cap batch size per sync to stay comfortably within Gmail API per-minute quotas
  const MAX_PER_SYNC = 50;
  const targetIds = newIds.slice(0, MAX_PER_SYNC);

  const parsedEmails: ParsedEmail[] = [];

  for (const messageId of targetIds) {
    // 120ms pacing between individual message fetches prevents quota bursts
    await new Promise((resolve) => setTimeout(resolve, 120));

    try {
      const msgRes = await withRateLimitBackoff(() =>
        gmail.users.messages.get({
          userId: "me",
          id: messageId,
          format: "full",
        })
      );

      const msg = msgRes.data;
      const headers = msg.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
          ?.value || "";

      const subject = getHeader("Subject") || "(No Subject)";
      const from = getHeader("From");
      const internalDateMs = msg.internalDate
        ? Number(msg.internalDate)
        : Date.now();
      const receivedAt = new Date(internalDateMs);

      if (receivedAt < cutoffDate) continue;

      const { senderName, senderDomain } = parseFromHeader(from);
      const snippet = msg.snippet || "";
      const bodyText = extractBodyText(msg.payload) || snippet;

      parsedEmails.push({
        accountEmail,
        gmailMessageId: messageId,
        subject,
        from,
        senderName,
        senderDomain,
        receivedAt,
        snippet,
        bodyText: bodyText.slice(0, 8000),
      });
    } catch (msgErr: any) {
      console.warn(`[Gmail Sync] Skipped message ${messageId}:`, msgErr.message);
    }
  }

  parsedEmails.sort((a, b) => a.receivedAt.getTime() - b.receivedAt.getTime());
  return parsedEmails;
}

