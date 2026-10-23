import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParsedEmail } from "./fetcher";
import { prisma } from "./prisma";

export type ApplicationStatus =
  | "APPLIED"
  | "IN_REVIEW"
  | "INTERVIEW"
  | "REJECTED"
  | "OFFER";

export type ClassificationResult =
  | {
      kind: "NOTIFICATION";
      source: string;
      subject: string;
      receivedAt: Date;
      snippet: string;
    }
  | {
      kind: "APPLICATION";
      company: string;
      role: string;
      status: ApplicationStatus;
      source: string;
      receivedAt: Date;
      subject: string;
      gmailMessageId: string;
    }
  | {
      kind: "IGNORE";
    };

const ATS_SOURCES: Record<string, string> = {
  "greenhouse.io": "Greenhouse",
  "lever.co": "Lever",
  "workday.com": "Workday",
  "myworkdayjobs.com": "Workday",
  "myworkday.com": "Workday",
  "ashbyhq.com": "Ashby",
  "smartrecruiters.com": "SmartRecruiters",
  "icims.com": "iCIMS",
  "taleo.net": "Taleo",
  "bamboohr.com": "BambooHR",
  "jobvite.com": "Jobvite",
  "breezy.hr": "Breezy HR",
  "workable.com": "Workable",
  "ripplehire.com": "RippleHire",
  "darwinbox.in": "Darwinbox",
  "hirevue.com": "HireVue",
  "hackerrankcareers.com": "HackerRank",
  "lntedutech.com": "L&T EduTech",
  "shl.com": "SHL",
  "linkedin.com": "LinkedIn",
  "indeed.com": "Indeed",
  "glassdoor.com": "Glassdoor",
  "wellfound.com": "Wellfound",
  "naukri.com": "Naukri",
  "instahyre.com": "Instahyre",
};

const JOB_BOARD_DOMAINS = [
  "linkedin.com",
  "indeed.com",
  "glassdoor.com",
  "wellfound.com",
  "naukri.com",
  "instahyre.com",
];

export function detectSource(senderDomain: string, fullText: string): string {
  for (const [domain, label] of Object.entries(ATS_SOURCES)) {
    if (senderDomain.includes(domain)) return label;
  }
  const lower = fullText.toLowerCase();
  for (const [domain, label] of Object.entries(ATS_SOURCES)) {
    if (lower.includes(domain)) return label;
  }
  return "Direct / Company";
}

function isJobAlertNotification(email: ParsedEmail): boolean {
  const isJobBoard = JOB_BOARD_DOMAINS.some((d) =>
    email.senderDomain.includes(d)
  );
  const text = `${email.subject} ${email.snippet}`.toLowerCase();

  const alertPatterns = [
    "job alert",
    "new jobs for",
    "jobs matching your",
    "recommended jobs",
    "jobs you might like",
    "is hiring for",
    "new job opportunities",
    "top job picks",
    "jobs in ",
    "apply now to",
  ];

  const applicationConfirmPatterns = [
    "application was sent",
    "your application to",
    "applied to",
    "application received",
    "thanks for applying",
    "application was viewed",
    "successfully submitted",
  ];

  if (applicationConfirmPatterns.some((p) => text.includes(p))) {
    return false;
  }

  return isJobBoard && alertPatterns.some((p) => text.includes(p));
}

export function matchStatusByRules(
  subject: string,
  body: string
): ApplicationStatus | null {
  const s = subject.toLowerCase();
  const b = body.toLowerCase();
  const combined = `${s}\n${b}`;

  // 1. OFFER (Includes LOI / Letter of Intent / Intent to Hire)
  if (
    s.includes("letter of intent") ||
    s.includes("offer letter") ||
    s.includes("job offer") ||
    s.includes("offer of employment") ||
    s.includes("employment offer") ||
    s.includes("intent to offer") ||
    s.includes("intent to hire") ||
    s.includes("internship offer") ||
    s.includes("appointment letter") ||
    /\b(loi|letter of intent)\b/i.test(s) ||
    combined.includes("letter of intent") ||
    combined.includes("pleased to extend") ||
    combined.includes("pleased to offer") ||
    combined.includes("we are pleased to offer you") ||
    combined.includes("delighted to offer") ||
    combined.includes("excited to offer you") ||
    combined.includes("offer of employment") ||
    combined.includes("formal offer") ||
    combined.includes("job offer") ||
    combined.includes("offer letter") ||
    combined.includes("intent to hire") ||
    combined.includes("intent to offer") ||
    combined.includes("appointment letter") ||
    combined.includes("congratulations! we are pleased to offer") ||
    combined.includes("congratulations on your offer") ||
    combined.includes("selected for the role") ||
    combined.includes("selected for the position") ||
    /\b(loi|letter of intent)\b/i.test(combined)
  ) {
    return "OFFER";
  }

  // 2. REJECTED (decision updates)
  if (
    s.includes("status of your application") ||
    s.includes("update on your application") ||
    s.includes("update regarding your application") ||
    s.includes("update on your candidacy") ||
    combined.includes("regret to inform") ||
    combined.includes("moving forward with other candidates") ||
    combined.includes("will not be moving forward") ||
    combined.includes("not moving forward with") ||
    combined.includes("decided not to move forward") ||
    combined.includes("pursuing other candidates") ||
    combined.includes("unfortunately, at this time") ||
    combined.includes("will keep your resume on file")
  ) {
    return "REJECTED";
  }

  // 3. APPLIED (confirmations take priority over future-tense interview mentions)
  if (
    s.includes("application received") ||
    s.includes("thanks for applying") ||
    s.includes("thank you for your application") ||
    s.includes("thank you for applying") ||
    s.includes("thanks for your application") ||
    s.includes("successfully submitted") ||
    s.includes("your application to") ||
    s.includes("we received your") ||
    s.includes("application confirmation") ||
    combined.includes("application has been received") ||
    combined.includes("thank you for submitting your application") ||
    combined.includes("we have received your application")
  ) {
    return "APPLIED";
  }

  // 4. INTERVIEW / ASSESSMENT
  if (
    s.includes("online assessment") ||
    s.includes("coding assessment") ||
    s.includes("test login credentials") ||
    s.includes("interview invitation") ||
    s.includes("interview scheduled") ||
    s.includes("schedule an interview") ||
    s.includes("invitation to interview") ||
    s.includes("technical screen") ||
    combined.includes("invite you to interview") ||
    combined.includes("schedule a time for an interview") ||
    combined.includes("we would like to interview you") ||
    combined.includes("invitation to online assessment") ||
    combined.includes("invited to appear for online assessment") ||
    combined.includes("next step is an interview")
  ) {
    return "INTERVIEW";
  }

  // 5. IN_REVIEW
  if (
    combined.includes("application was viewed") ||
    combined.includes("recruiter viewed") ||
    combined.includes("currently reviewing your application") ||
    combined.includes("under review")
  ) {
    return "IN_REVIEW";
  }

  if (
    combined.includes("thanks for applying") ||
    combined.includes("thank you for applying") ||
    combined.includes("application was sent")
  ) {
    return "APPLIED";
  }

  return null;
}

export function extractCompany(email: ParsedEmail): string {
  const { subject, bodyText, senderName, senderDomain } = email;

  // Check sender email username for workday senders (e.g. salesforce@myworkday.com)
  const fromMatch = email.from.match(/([a-zA-Z0-9._-]+)@(?:[a-zA-Z0-9._-]+\.)?myworkday(?:jobs)?\.com/i);
  if (fromMatch?.[1]) {
    const slug = fromMatch[1].replace(/[-_.]/g, " ").trim();
    if (slug.length > 2 && !["no reply", "noreply", "notifications", "notify"].includes(slug.toLowerCase())) {
      return cleanCompanyName(slug.charAt(0).toUpperCase() + slug.slice(1));
    }
  }

  const subjectPatterns = [
    /(?:thank you for applying to|thanks for applying to|applying to)\s+.+?\s+at\s+([A-Z0-9][A-Za-z0-9\s&.,'-]{1,40}?)(?:[!.,\s-]|$)/i,
    /your application to\s+([A-Z0-9][A-Za-z0-9\s&.,'-]{1,40}?)(?:\s+for|\s+was|\s*[-–|]|$)/i,
    /application was sent to\s+([A-Z0-9][A-Za-z0-9\s&.,'-]{1,40}?)(?:\s*[-–|.]|$)/i,
    /thanks for applying at\s+([A-Z0-9][A-Za-z0-9\s&.,'-]{1,40}?)(?:[!.,\s-]|$)/i,
    /thank you for applying at\s+([A-Z0-9][A-Za-z0-9\s&.,'-]{1,40}?)(?:[!.,\s-]|$)/i,
    /thank you for applying to\s+([A-Z0-9][A-Za-z0-9\s&.,'-]{1,40}?)(?:[!.,\s-]|$)/i,
    /thanks for applying to\s+([A-Z0-9][A-Za-z0-9\s&.,'-]{1,40}?)(?:[!.,\s-]|$)/i,
    /application with\s+([A-Z0-9][A-Za-z0-9\s&.,'-]{1,40}?)(?:[!.,\s-]|$)/i,
    /step with\s+([A-Z0-9][A-Za-z0-9\s&.,'-]{1,40}?)(?:[!.,\s-]|$)/i,
    /^([A-Z0-9][A-Za-z0-9\s&.'-]{1,35}?)\s*[-–—:]\s*(?:we received your application|application received|thank you for applying)/i,
    /interview with\s+([A-Z0-9][A-Za-z0-9\s&.'-]{1,35}?)(?:\s+for|\s*[-–|]|$)/i,
    /update from\s+([A-Z0-9][A-Za-z0-9\s&.'-]{1,35}?)(?:\s*[-–|]|$)/i,
  ];

  for (const regex of subjectPatterns) {
    const match = subject.match(regex);
    if (match?.[1]) {
      const cleaned = cleanCompanyName(match[1]);
      if (cleaned.length > 1) return cleaned;
    }
  }

  const bodyPatterns = [
    /thank you for applying to\s+([A-Z0-9][A-Za-z0-9\s&.'-]{1,35}?)(?:[.,!]|for the)/i,
    /interest in joining\s+([A-Z0-9][A-Za-z0-9\s&.'-]{1,35}?)(?:[.,!]|as)/i,
  ];

  for (const regex of bodyPatterns) {
    const match = bodyText.match(regex);
    if (match?.[1]) {
      const cleaned = cleanCompanyName(match[1]);
      if (cleaned.length > 1) return cleaned;
    }
  }

  const genericSenders = [
    "linkedin",
    "indeed",
    "glassdoor",
    "wellfound",
    "naukri",
    "instahyre",
    "workday",
    "no-reply",
    "noreply",
    "careers",
    "recruiting",
    "talent",
  ];

  const cleanSender = cleanCompanyName(senderName);
  if (
    cleanSender &&
    !genericSenders.includes(cleanSender.toLowerCase()) &&
    cleanSender.length > 1
  ) {
    return cleanSender;
  }

  const domainPart = senderDomain.split(".")[0] || "Unknown Company";
  return (
    domainPart.charAt(0).toUpperCase() + domainPart.slice(1).toLowerCase()
  );
}

function cleanCompanyName(raw: string): string {
  return raw
    .replace(
      /\b(Careers|Recruiting|Talent Attraction and Acquisition|Talent Acquisition Team|Talent Acquisition|Hiring Team|Jobs|Team|Workday|Notify|Do Not Reply|Pvt\.?|LLP|Inc\.?|LLC|Ltd\.?)\b/gi,
      ""
    )
    .replace(/[-–—|,:]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractRole(subject: string, bodyText: string): string {
  const combined = `${subject}\n${bodyText.slice(0, 1500)}`;

  const rolePatterns = [
    /for the\s+([A-Za-z0-9\s/,+&().-]{3,60}?)\s+(?:position|role|opening|opportunity)/i,
    /for the\s+(?:position|role) of\s+([A-Za-z0-9\s/,+&().-]{3,60}?)(?:[.,!\n]|at\s|with\s|$)/i,
    /application for\s+([A-Za-z0-9\s/,+&().-]{3,55}?)\s+at\s+[A-Z]/i,
    /applied for\s+(?:the\s+)?([A-Za-z0-9\s/,+&().-]{3,55}?)\s+(?:position|role)/i,
    /application:\s*([A-Za-z0-9\s/,+&().-]{3,55}?)(?:\r?\n|$)/i,
    /role:\s*([A-Za-z0-9\s/,+&().-]{3,55}?)(?:\r?\n|$)/i,
  ];

  for (const regex of rolePatterns) {
    const match = combined.match(regex);
    if (match?.[1]) {
      return match[1].replace(/\s+/g, " ").trim();
    }
  }

  return "Software Engineer";
}

async function classifyWithGemini(email: ParsedEmail): Promise<{
  kind: "APPLICATION" | "NOTIFICATION" | "IGNORE";
  company?: string;
  role?: string;
  status?: ApplicationStatus;
} | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const models = ["gemini-3.5-flash-lite", "gemini-2.5-flash"];
  const prompt = `You are an expert AI parser for job application tracking.
Analyze this candidate email and determine if it is related to a specific job application, online assessment, interview, rejection, or offer.

From: ${email.from}
Subject: ${email.subject}
Body snippet: ${email.bodyText.slice(0, 1500)}

Rules:
1. If this is a promotional digest, marketing newsletter, talent community opt-in, security/2FA/verification code, or generic job alert, return:
{"kind": "IGNORE"}

2. If this is an actual job application confirmation, online assessment, interview, status update, rejection, or offer:
- "kind": "APPLICATION"
- "company": Clean hiring company name (remove 'Inc', 'LLP', 'Workday', 'Talent Acquisition', 'Do Not Reply', etc. Examples: "CloudSEK", "Qualcomm", "Salesforce", "L&T", "HSBC", "Jane Street", "Stripe", "WEX", "Avantor", "Rubrik", "EY", "Hitachi Energy", "Enterpret", "Graviton").
- "role": Specific job title (e.g. "SDE Intern - Backend", "Associate Engineer", "Software Engineering AMTS", "AI Intern"). If not mentioned, return "Software Engineer" or "Intern" based on context.
- "status": EXACTLY ONE OF:
  * "APPLIED" (confirmation of application submission or receipt)
  * "IN_REVIEW" (reviewing your application)
  * "INTERVIEW" (interview invite, online assessment, coding challenge, technical test)
  * "REJECTED" (not moving forward, other candidates, regret to inform)
  * "OFFER" (job offer extended, Letter of Intent / LOI, intent to hire, offer of employment, appointment letter, internship offer, selected for role). CRITICAL: If the email mentions "Letter of Intent", "LOI", "Intent to Offer", "Offer Letter", or "offer of employment", you MUST set status to "OFFER".

Return ONLY valid JSON matching:
{"kind": "APPLICATION"|"IGNORE", "company": "...", "role": "...", "status": "..."}`;

  const genAI = new GoogleGenerativeAI(apiKey);
  for (const m of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: m,
        generationConfig: { responseMimeType: "application/json" },
      });
      const res = await model.generateContent(prompt);
      const data = JSON.parse(res.response.text());
      return data;
    } catch {
      // try next model
    }
  }

  return null;
}

export async function classifyEmail(
  email: ParsedEmail
): Promise<ClassificationResult> {
  const source = detectSource(
    email.senderDomain,
    `${email.subject} ${email.bodyText}`
  );

  // Immediate discard for verification / 2FA / talent opt-in
  const subjectLower = email.subject.toLowerCase();
  if (
    subjectLower.includes("security code") ||
    subjectLower.includes("verification code") ||
    subjectLower.includes("talent community opt in")
  ) {
    return { kind: "IGNORE" };
  }

  if (isJobAlertNotification(email)) {
    return {
      kind: "NOTIFICATION",
      source,
      subject: email.subject,
      receivedAt: email.receivedAt,
      snippet: email.snippet,
    };
  }

  // 1. Try Gemini first if API key is present
  const geminiResult = await classifyWithGemini(email);
  if (geminiResult) {
    if (geminiResult.kind === "IGNORE") {
      return { kind: "IGNORE" };
    }
    if (geminiResult.kind === "APPLICATION" && geminiResult.company) {
      return {
        kind: "APPLICATION",
        company: geminiResult.company,
        role: geminiResult.role || "Software Engineer",
        status: (geminiResult.status as ApplicationStatus) || "APPLIED",
        source,
        receivedAt: email.receivedAt,
        subject: email.subject,
        gmailMessageId: email.gmailMessageId,
      };
    }
  }

  // 2. Rule-based fallback if Gemini is offline
  const matchedStatus = matchStatusByRules(email.subject, email.bodyText);
  if (matchedStatus) {
    return {
      kind: "APPLICATION",
      company: extractCompany(email),
      role: extractRole(email.subject, email.bodyText),
      status: matchedStatus,
      source,
      receivedAt: email.receivedAt,
      subject: email.subject,
      gmailMessageId: email.gmailMessageId,
    };
  }

  return { kind: "IGNORE" };
}

function normalizeCompanyKey(company: string): string {
  return company
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export async function persistClassification(
  email: ParsedEmail,
  result: ClassificationResult,
  targetAccountEmail?: string
) {
  const accountEmail = targetAccountEmail || email.accountEmail;

  await prisma.$transaction(async (tx) => {
    if (result.kind === "NOTIFICATION") {
      await tx.notification.create({
        data: {
          source: result.source,
          subject: result.subject,
          receivedAt: result.receivedAt,
          snippet: result.snippet,
          accountEmail: accountEmail || undefined,
        },
      });
    }

    if (result.kind === "APPLICATION") {
      const companyNorm = normalizeCompanyKey(result.company);

      // Check if an existing application thread exists for this company within this account
      const existingApp = await tx.application.findFirst({
        where: {
          companyNorm,
          ...(accountEmail ? { accountEmail } : {}),
        },
        orderBy: { appliedAt: "desc" },
      });

      if (existingApp) {
        // Upgrade status if newer
        const statusPriority: Record<ApplicationStatus, number> = {
          APPLIED: 1,
          IN_REVIEW: 2,
          INTERVIEW: 3,
          REJECTED: 4,
          OFFER: 5, // Top priority: An offer or LOI always takes precedence
        };

        const existingPrio = statusPriority[existingApp.status as ApplicationStatus] ?? 0;
        const newPrio = statusPriority[result.status] ?? 0;

        await tx.application.update({
          where: { id: existingApp.id },
          data: {
            company: result.company,
            role: result.role !== "Software Engineer" ? result.role : existingApp.role,
            status: newPrio >= existingPrio ? result.status : existingApp.status,
            lastUpdatedAt: result.receivedAt,
            lastMessageId: result.gmailMessageId,
            rawSubject: result.subject,
            ...(accountEmail ? { accountEmail } : {}),
          },
        });
      } else {
        await tx.application.create({
          data: {
            company: result.company,
            companyNorm,
            role: result.role,
            status: result.status,
            source: result.source,
            appliedAt: result.receivedAt,
            lastUpdatedAt: result.receivedAt,
            lastMessageId: result.gmailMessageId,
            rawSubject: result.subject,
            accountEmail: accountEmail || undefined,
          },
        });
      }
    }

    // Always record that this message was processed for this account
    const existingProcessed = await tx.processedEmail.findFirst({
      where: {
        gmailMessageId: email.gmailMessageId,
        ...(accountEmail ? { accountEmail } : {}),
      },
    });
    if (!existingProcessed) {
      await tx.processedEmail.create({
        data: {
          gmailMessageId: email.gmailMessageId,
          accountEmail: accountEmail || null,
        },
      });
    }
  });
}

