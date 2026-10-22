"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  RefreshCw,
  ArrowLeft,
  Mail,
  Plus,
  Trash2,
} from "lucide-react";

interface AccountSummary {
  id: string;
  email: string;
  isDefault: boolean;
  lastSyncedAt: string | null;
  applicationCount: number;
  isConnected: boolean;
}

function SetupContent() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [syncMonths, setSyncMonths] = useState(12);
  const [status, setStatus] = useState<{
    hasCredentials: boolean;
    isConnected: boolean;
    authError: boolean;
    emailAddress: string | null;
  } | null>(null);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadData = () => {
    fetch("/api/setup")
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        if (data.clientId) setClientId(data.clientId);
        if (data.syncMonths) setSyncMonths(data.syncMonths);
      });

    fetch("/api/accounts")
      .then((res) => res.json())
      .then((data) => {
        if (data.accounts) setAccounts(data.accounts);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  async function handleSaveCredentials(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    const res = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret, syncMonths }),
    });

    setSaving(false);
    if (res.ok) {
      setSavedSuccess(true);
      setStatus((prev) => (prev ? { ...prev, hasCredentials: true } : prev));
      loadData();
    }
  }

  async function handleDisconnectAccount(email: string) {
    if (!confirm(`Are you sure you want to disconnect ${email}?`)) return;
    try {
      const res = await fetch(`/api/accounts?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadData();
      }
    } catch (e: any) {
      alert("Failed to disconnect: " + e.message);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-[#F5F0EA]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F5F0EA] font-editorial flex items-center gap-2">
            Multi-Gmail OAuth 2.0 Studio
            <span className="text-[#D4FF3F]">•</span>
          </h1>
          <p className="text-[#A8A29E] text-xs mt-1">
            Authorize local read-only synchronization across multiple Gmail inboxes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-[#3D2852] hover:border-[#CBB3E8]/40 hover:text-[#CBB3E8]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Studio
            </Button>
          </Link>
        </div>
      </div>

      <Alert className="border-[#CBB3E8]/30 bg-[#21152B] text-[#F5F0EA]">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-[#CBB3E8] mt-0.5 shrink-0" />
          <div>
            <AlertTitle className="font-semibold text-[#CBB3E8]">
              100% Local &amp; Read-Only (gmail.readonly)
            </AlertTitle>
            <AlertDescription className="text-[#D8D2CA] text-xs mt-1">
              This app never requests permission to send, modify, or delete
              emails. Your OAuth tokens and classified job history stay securely inside
              your local{" "}
              <code className="bg-[#1A1122] border border-[#3D2852] text-[#D4FF3F] px-1.5 py-0.5 rounded-md font-mono">
                prisma/dev.db
              </code>{" "}
              SQLite database.
            </AlertDescription>
          </div>
        </div>
      </Alert>

      {urlError && (
        <Alert variant="destructive">
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>{urlError}</AlertDescription>
        </Alert>
      )}

      {/* Connected Inboxes Manager */}
      <Card className="bg-[#21152B] border-[#3D2852]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-[#F5F0EA] flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#CBB3E8]" />
                Connected Gmail Inboxes
              </CardTitle>
              <CardDescription className="text-xs text-[#A8A29E]">
                All authorized Google accounts with active job classification
              </CardDescription>
            </div>
            <a href="/api/auth/google">
              <Button
                variant="chartreuse"
                size="sm"
                className="text-xs gap-1.5"
                disabled={!status?.hasCredentials}
              >
                <Plus className="h-3.5 w-3.5" />
                Connect Gmail Account
              </Button>
            </a>
          </div>
        </CardHeader>
        <CardContent>
          {accounts.length > 0 ? (
            <div className="divide-y divide-[#2C1D3A] border border-[#3D2852] rounded-2xl overflow-hidden bg-[#1A1122]">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3.5 flex items-center justify-between text-xs hover:bg-[#251831] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-[#CBB3E8]/15 border border-[#CBB3E8]/30 text-[#CBB3E8] flex items-center justify-center font-bold font-mono">
                      {acc.email.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-mono font-medium text-[#F5F0EA] flex items-center gap-2">
                        <span>{acc.email}</span>
                        {acc.isDefault && (
                          <span className="text-[10px] bg-[#D4FF3F]/15 text-[#D4FF3F] border border-[#D4FF3F]/30 px-1.5 py-0.2 rounded-full font-mono">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#A8A29E]">
                        {acc.applicationCount} applications tracked
                        {acc.lastSyncedAt && ` • synced ${new Date(acc.lastSyncedAt).toLocaleDateString()}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#D4FF3F]/15 text-[#D4FF3F] border-[#D4FF3F]/35">
                      Active
                    </Badge>
                    <button
                      onClick={() => handleDisconnectAccount(acc.email)}
                      className="p-1.5 text-[#A8A29E] hover:text-[#E34234] transition-colors"
                      title="Disconnect account"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-[#A8A29E] border border-dashed border-[#3D2852] rounded-2xl">
              No Gmail accounts connected yet. Save credentials below and connect an account.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 1: Google Cloud Setup Guide */}
      <Card className="bg-[#21152B] border-[#3D2852]">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#F5F0EA]">
            Step 1: Google Cloud Console Configuration
          </CardTitle>
          <CardDescription className="text-xs text-[#A8A29E]">
            Quick setup steps in the Google Cloud Console:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs text-[#D8D2CA]">
          <ol className="list-decimal list-inside space-y-3">
            <li>
              Go to{" "}
              <a
                href="https://console.cloud.google.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[#D4FF3F] underline inline-flex items-center gap-1 font-medium"
              >
                Google Cloud Console <ExternalLink className="h-3 w-3" />
              </a>{" "}
              and select your project.
            </li>
            <li>
              Navigate to <strong>APIs &amp; Services → Library</strong>, enable the <strong>Gmail API</strong>.
            </li>
            <li>
              Under <strong>OAuth consent screen</strong>:
              <ul className="list-disc list-inside ml-5 mt-1 space-y-1 text-[#A8A29E] text-xs">
                <li>Select <strong>External</strong> user type.</li>
                <li>
                  Add scope:{" "}
                  <code className="text-[#D4FF3F] font-mono">
                    https://www.googleapis.com/auth/gmail.readonly
                  </code>
                </li>
                <li>
                  Under <strong>Test users</strong>, add the Gmail address(es) you wish to track.
                </li>
              </ul>
            </li>
            <li>
              Under <strong>Credentials → Create Credentials → OAuth client ID</strong> (Web application), add this Authorized Redirect URI:
              <div className="mt-1.5 ml-5">
                <code className="bg-[#151416] border border-[#3D2852] text-[#CBB3E8] px-2.5 py-1 rounded-lg select-all block w-fit text-xs font-mono">
                  http://localhost:3000/api/auth/google/callback
                </code>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Step 2: Credentials Form */}
      <Card className="bg-[#21152B] border-[#3D2852]">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#F5F0EA] flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[#CBB3E8]" />
            Step 2: Client Credentials &amp; Lookback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveCredentials} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="clientId" className="text-xs text-[#D8D2CA]">
                Google Client ID
              </Label>
              <Input
                id="clientId"
                placeholder="1234567890-abcdefg.apps.googleusercontent.com"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="clientSecret" className="text-xs text-[#D8D2CA]">
                Google Client Secret
              </Label>
              <Input
                id="clientSecret"
                type="password"
                placeholder="GOCSPX-..."
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="syncMonths" className="text-xs text-[#D8D2CA]">
                Email Lookback Window (Months)
              </Label>
              <Input
                id="syncMonths"
                type="number"
                min={1}
                max={36}
                value={syncMonths}
                onChange={(e) => setSyncMonths(Number(e.target.value))}
                className="w-32"
              />
              <p className="text-xs text-[#A8A29E]">
                Defaults to tracking applications from the last 12 months.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="submit"
                variant="lavender"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Credentials"}
              </Button>
              {savedSuccess && (
                <span className="text-xs text-[#D4FF3F] flex items-center gap-1 font-medium font-mono">
                  <CheckCircle2 className="h-4 w-4" /> Saved to SQLite
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-[#151416] text-[#F5F0EA] py-10 px-4">
      <Suspense fallback={<div className="text-center py-20 text-[#A8A29E] font-mono text-xs">Loading...</div>}>
        <SetupContent />
      </Suspense>
    </div>
  );
}
