# Career-Intelligence ✦ 3D Career Studio & Job Tracker

> An art-directed, autonomous career intelligence dashboard and multi-Gmail job application tracker. Powered by Google Gemini AI, Three.js WebGL, and GSAP.

---

## 🌟 Overview

**Career-Intelligence** transforms the chaos of searching and applying for roles across different platforms (LinkedIn, Greenhouse, Lever, Workday, Ashby, Indeed) into an art-directed intelligence dashboard.

Unlike standard job tracking spreadsheets or third-party web scrapers:
- **100% Local & Private**: All tokens and application histories stay strictly inside your local SQLite database (`prisma/dev.db`).
- **Multi-Gmail Inbox Isolation**: Connect multiple personal or university Gmail accounts. Data and analytics are partitioned per account with instant 1-click switching.
- **Strictly Read-Only (`gmail.readonly`)**: Cannot compose, send, modify, or delete your emails.
- **Autonomous Gemini AI Parsing**: Uses Google Gemini to parse job confirmations, technical assessments, recruiter interview invites, and formal decisions with high accuracy.
- **Interactive Three.js 3D Centerpiece**: A glossy interwoven kinetic sculpture inspired by an editorial palette of Lavender (`#CBB3E8`), Chartreuse (`#D4FF3F`), Tomato Red (`#E34234`), Deep Aubergine (`#21152B`), and Charcoal (`#151416`).

---

## ✨ Features

- 📥 **Autonomous Gmail Syncing**: Fetches unprocessed emails across major ATS providers and job boards with rate-limiting backoff to protect Google API quotas.
- 🤖 **Intelligent Extraction**: Distinguishes between actual job applications and background newsletter/job alerts.
- ⚡ **1-Click Multi-Account Switcher**: Instant switching between connected Gmail inboxes, with an optional aggregated "All Inboxes" overview.
- 📊 **Career Intelligence Analytics**:
  - Application conversion funnel (Applied → Review → Interview → Offer)
  - Weekly application submission velocity area chart
  - Status distribution breakdown
  - Interview conversion ratio & recruiter response rates
- 🎨 **Editorial Design System**:
  - Charcoal (`#151416`) base canvas
  - Deep Aubergine (`#21152B`) elevated surfaces
  - Lavender (`#CBB3E8`) highlights & timeline transitions
  - Chartreuse (`#D4FF3F`) primary interactive actions
  - Tomato Red (`#E34234`) alert accents
- 🎭 **Three.js WebGL Centerpiece**: Glossy, metallic interwoven forms with multi-point studio lighting and mouse parallax.
- 🎬 **GSAP Animations**: Refined, staggered entrance reveals respecting `prefers-reduced-motion`.
- 🛠️ **Full Application Control**: Inline status overrides, inline company/role editing modal, record deletion, search & source filters, and CSV export.

---

## 🔒 Architecture & Privacy Guarantees

| Security Feature | Implementation Details |
| :--- | :--- |
| **OAuth Scope** | Strictly restricted to `https://www.googleapis.com/auth/gmail.readonly`. Zero write or delete permissions. |
| **Local SQLite** | Credentials and refresh tokens never leave your local machine (`prisma/dev.db`). |
| **Zero Token Leakage** | Frontend APIs (`/api/applications`, `/api/accounts`) explicitly omit all OAuth tokens. |
| **Account Partitioning** | Multi-tenant isolation at the database level using `accountEmail` foreign key relations. |
| **Safe OAuth Callback** | Redirects strictly on `http://localhost:3000/api/auth/google/callback`. |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+
- **npm** or **pnpm**
- **Google Cloud Console account** (Free)
- **Google Gemini API Key** (Free from [Google AI Studio](https://aistudio.google.com/app/apikey))

---

### 2. Clone & Install Dependencies

```bash
git clone https://github.com/KunalBishwal/Career-Intelligence.git
cd Career-Intelligence
npm install
```

---

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Open `.env` and fill in your Gemini API Key:

```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
GEMINI_API_KEY="your-gemini-api-key-here"
```

---

### 4. Database Setup

Initialize the SQLite database with Prisma:

```bash
npx prisma generate
npx prisma db push
```

---

### 5. Google Cloud Console OAuth 2.0 Setup

To enable Gmail syncing, configure a free Google Cloud project:

1. **Create a Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/).
   - Click **Select a project** → **New Project**, name it `Career-Tracker`, and click **Create**.

2. **Enable Gmail API**:
   - Navigate to **APIs & Services → Library**.
   - Search for **Gmail API** and click **Enable**.

3. **Configure OAuth Consent Screen**:
   - Go to **APIs & Services → OAuth consent screen**.
   - Select **External** user type and click **Create**.
   - Enter an App name (e.g., `Career Intelligence`), user support email, and developer contact email.
   - Click **Save and Continue**.
   - Under **Scopes**, click **Add or Remove Scopes**, and add:
     ```
     https://www.googleapis.com/auth/gmail.readonly
     ```
   - Click **Save and Continue**.
   - Under **Test users**, click **+ Add Users** and enter the Gmail address(es) you plan to connect.
   - Click **Save and Continue**.

4. **Create OAuth Client ID**:
   - Go to **APIs & Services → Credentials**.
   - Click **+ Create Credentials → OAuth client ID**.
   - Select **Application type**: `Web application`.
   - Name: `Career Tracker Local`.
   - Under **Authorized redirect URIs**, click **+ Add URI** and enter:
     ```
     http://localhost:3000/api/auth/google/callback
     ```
   - Click **Create**.
   - Copy your **Client ID** and **Client Secret**.

---

### 6. Run the Application

Start the local development server:

```bash
npm run dev
```

1. Open [http://localhost:3000/setup](http://localhost:3000/setup) in your browser.
2. Paste your **Client ID** and **Client Secret**, select your lookback window (e.g., 12 months), and click **Save Credentials**.
3. Click **Connect Gmail Account** to authorize your Gmail.
4. Once redirected back to the dashboard, click **Sync Now** to automatically classify your applications!

---

## 📁 Project Architecture

```
Career-Intelligence/
├── prisma/
│   └── schema.prisma        # SQLite schema (GmailAccount, Application, ProcessedEmail, Notification)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── accounts/    # List and manage connected inboxes
│   │   │   ├── applications/# Query isolated applications, stats & metrics
│   │   │   ├── auth/google/ # OAuth initiation & callback handler
│   │   │   ├── setup/       # Save and inspect OAuth credentials
│   │   │   └── sync/        # Gmail rate-limited fetch & AI classifier runner
│   │   ├── globals.css      # Design tokens, scrollbars & editorial utility styles
│   │   ├── page.tsx         # Career Intelligence Studio Dashboard
│   │   └── setup/page.tsx   # OAuth and multi-inbox manager
│   ├── components/
│   │   ├── CareerCenterpiece.tsx # Three.js interactive 3D WebGL sculpture
│   │   └── ui/              # Art-directed UI primitives (Button, Card, Badge, Input, Alert)
│   └── lib/
│       ├── classifier.ts    # Gemini AI classification & status detection logic
│       ├── fetcher.ts       # Rate-limited Gmail API search & message parser
│       ├── gmail.ts         # OAuth2 client factory & token manager
│       └── prisma.ts        # Prisma client singleton
├── tailwind.config.ts       # Palette tokens (Charcoal, Aubergine, Lavender, Chartreuse, Tomato)
└── package.json
```

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React 18)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **3D Graphics**: [Three.js](https://threejs.org/) (WebGL Canvas)
- **Animation**: [GSAP](https://gsap.com/)
- **AI Classification**: [Google Generative AI](https://ai.google.dev/) (Gemini Flash)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Database & ORM**: [Prisma](https://www.prisma.io/) with SQLite
- **Google APIs**: [googleapis](https://github.com/googleapis/google-api-nodejs-client) (Gmail API v1)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 📄 License

MIT License. Designed and built for seamless local-first job tracking.
