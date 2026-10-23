"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { format, formatDistanceToNow } from "date-fns";
import gsap from "gsap";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Briefcase,
  RefreshCw,
  Settings,
  Search,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Bell,
  AlertTriangle,
  Inbox,
  Download,
  Trash2,
  Pencil,
  X,
  ChevronDown,
  Award,
  Building2,
  Filter,
  ShieldCheck,
  Plus,
  Mail,
  UserCheck,
  Lock,
  Database,
  Eye,
  Check,
  Zap,
  Sparkles,
} from "lucide-react";
import SyncWaitingModal from "@/components/SyncWaitingModal";

// Lazy-load the Three.js 3D visual centerpiece with zero SSR hydration mismatch
const CareerCenterpiece = dynamic(
  () => import("@/components/CareerCenterpiece"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[220px] flex items-center justify-center bg-[#21152B]/40 rounded-2xl border border-[#3D2852]/40 animate-pulse">
        <div className="h-8 w-8 rounded-full border-2 border-[#CBB3E8] border-t-transparent animate-spin" />
      </div>
    ),
  }
);

interface ApplicationItem {
  id: string;
  company: string;
  role: string;
  status: "APPLIED" | "IN_REVIEW" | "INTERVIEW" | "REJECTED" | "OFFER";
  source: string;
  appliedAt: string;
  lastUpdatedAt: string;
  rawSubject: string;
  accountEmail?: string | null;
}

interface NotificationItem {
  id: string;
  source: string;
  subject: string;
  receivedAt: string;
  snippet: string;
  accountEmail?: string | null;
}

interface ConnectedAccount {
  id: string;
  email: string;
  isDefault: boolean;
  lastSyncedAt: string | null;
  authError: boolean;
  isConnected: boolean;
  applicationCount: number;
}

const ALL_STATUSES = [
  "APPLIED",
  "IN_REVIEW",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
] as const;

// Curated Editorial Palette: Lavender (#CBB3E8), Chartreuse (#D4FF3F), Tomato Red (#E34234), Deep Aubergine (#21152B)
const STATUS_CONFIG: Record<
  ApplicationItem["status"],
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
    pillBg: string;
  }
> = {
  APPLIED: {
    label: "Applied",
    bg: "bg-[#2A1D36]",
    text: "text-[#D8D2CA]",
    border: "border-[#3D2852]",
    dot: "bg-[#A8A29E]",
    pillBg: "bg-[#251930]",
  },
  IN_REVIEW: {
    label: "In Review",
    bg: "bg-[#CBB3E8]/15",
    text: "text-[#CBB3E8]",
    border: "border-[#CBB3E8]/35",
    dot: "bg-[#CBB3E8]",
    pillBg: "bg-[#CBB3E8]/10",
  },
  INTERVIEW: {
    label: "Interview",
    bg: "bg-[#D4FF3F]/15",
    text: "text-[#D4FF3F]",
    border: "border-[#D4FF3F]/40",
    dot: "bg-[#D4FF3F]",
    pillBg: "bg-[#D4FF3F]/10",
  },
  OFFER: {
    label: "Offer",
    bg: "bg-[#D4FF3F]",
    text: "text-[#151416]",
    border: "border-[#D4FF3F]",
    dot: "bg-[#151416]",
    pillBg: "bg-[#D4FF3F]",
  },
  REJECTED: {
    label: "Rejected",
    bg: "bg-[#E34234]/15",
    text: "text-[#E34234]",
    border: "border-[#E34234]/35",
    dot: "bg-[#E34234]",
    pillBg: "bg-[#E34234]/10",
  },
};

const STATUS_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  IN_REVIEW: "In Review",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

function getCompanyInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string): { bg: string; text: string; border: string } {
  const colors = [
    { bg: "bg-[#CBB3E8]/20", text: "text-[#CBB3E8]", border: "border-[#CBB3E8]/40" },
    { bg: "bg-[#D4FF3F]/20", text: "text-[#D4FF3F]", border: "border-[#D4FF3F]/40" },
    { bg: "bg-[#2E1E3C]", text: "text-[#F5F0EA]", border: "border-[#3D2852]" },
    { bg: "bg-[#E34234]/15", text: "text-[#E34234]", border: "border-[#E34234]/35" },
    { bg: "bg-[#3A264D]", text: "text-[#CBB3E8]", border: "border-[#4C3364]" },
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Custom High-Contrast Tooltip (fixes unreadable dark tooltips in Recharts)
function CustomChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const item = payload[0];
    const name = item.name || item.payload?.stage || label || "Metric";
    const val = item.value;
    const color = item.payload?.fill || item.payload?.color || item.color || "#CBB3E8";

    return (
      <div className="rounded-xl border border-[#3D2852] bg-[#1B1224]/95 backdrop-blur-md px-3.5 py-2.5 shadow-2xl text-xs space-y-1 min-w-[130px] animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full shrink-0 shadow-[0_0_8px_currentColor]"
            style={{ backgroundColor: color, color }}
          />
          <span className="font-semibold text-[#F5F0EA]">{name}</span>
        </div>
        <div className="font-mono text-sm font-bold text-[#F5F0EA] pl-4">
          {val} {val === 1 ? "application" : "applications"}
        </div>
      </div>
    );
  }
  return null;
}

export default function DashboardPage() {
  const [data, setData] = useState<{
    isDemo?: boolean;
    connection: {
      hasCredentials: boolean;
      isConnected: boolean;
      authError: boolean;
      emailAddress: string | null;
      lastSyncedAt: string | null;
    };
    accounts: ConnectedAccount[];
    activeAccount: string;
    stats: {
      total: number;
      responsesReceived: number;
      interviews: number;
      rejections: number;
      responseRate: number;
    };
    charts: {
      funnelData: { stage: string; count: number; fill: string }[];
      timelineData: { week: string; applications: number }[];
      statusDistribution: { name: string; value: number; color: string }[];
    };
    applications: ApplicationItem[];
    notifications: NotificationItem[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [accountBeingDeleted, setAccountBeingDeleted] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedSource, setSelectedSource] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "company">("newest");
  const [activeTab, setActiveTab] = useState<"applications" | "notifications">("applications");

  // Account selector state
  const [activeAccount, setActiveAccount] = useState<string>("ALL");
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Security info modal
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  // Edit Modal State
  const [editingApp, setEditingApp] = useState<ApplicationItem | null>(null);
  const [editCompany, setEditCompany] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Inline status update tracking
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // GSAP animation container ref
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadDashboard = useCallback(async (accountToLoad?: string) => {
    setLoading(true);
    try {
      const target = accountToLoad !== undefined ? accountToLoad : activeAccount;
      const url =
        target && target !== "ALL"
          ? `/api/applications?account=${encodeURIComponent(target)}`
          : "/api/applications?account=ALL";

      const res = await fetch(url);
      const json = await res.json();
      setData(json);

      if (json.activeAccount) {
        setActiveAccount(json.activeAccount);
      }
    } finally {
      setLoading(false);
    }
  }, [activeAccount]);

  useEffect(() => {
    const saved = localStorage.getItem("preferred_account");
    loadDashboard(saved || undefined);
  }, [loadDashboard]);

  // GSAP Entrance Animations
  useEffect(() => {
    if (!loading && data && dashboardRef.current) {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (prefersReducedMotion) return;

      const ctx = gsap.context(() => {
        gsap.fromTo(
          ".gsap-hero",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.65, ease: "power2.out" }
        );

        gsap.fromTo(
          ".gsap-kpi",
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.06,
            ease: "power2.out",
            delay: 0.1,
          }
        );

        gsap.fromTo(
          ".gsap-chart",
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.08,
            ease: "power2.out",
            delay: 0.25,
          }
        );

        gsap.fromTo(
          ".gsap-workspace",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", delay: 0.4 }
        );
      }, dashboardRef);

      return () => ctx.revert();
    }
  }, [loading, data?.activeAccount]);

  // Fast account switcher
  function handleSelectAccount(email: string) {
    setActiveAccount(email);
    localStorage.setItem("preferred_account", email);
    setAccountDropdownOpen(false);
    loadDashboard(email);
  }

  async function handleSyncNow() {
    setShowSyncModal(true);
    setSyncing(true);
    setSyncMessage(null);
    try {
      // If currently looking at demo mode without real accounts, simulate fresh sync with demo data
      if (data?.isDemo && (!data?.accounts || data.accounts.length === 0)) {
        await new Promise((resolve) => setTimeout(resolve, 4000));
        setSyncMessage("Demo sync simulated: Neural extraction verified across 14 benchmark companies.");
        await loadDashboard("demo");
        return;
      }

      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountEmail: activeAccount !== "ALL" && !activeAccount.includes("demo") ? activeAccount : undefined,
        }),
      });
      const result = await res.json();

      if (res.ok) {
        setSyncMessage(
          `Sync complete: ${result.applicationsUpdated} applications updated from ${result.processedCount} messages.`
        );
        await loadDashboard(activeAccount);
      } else {
        setSyncMessage(`Sync failed: ${result.error || "Unknown error"}`);
      }
    } catch (err: any) {
      setSyncMessage(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
      setTimeout(() => setShowSyncModal(false), 800);
    }
  }

  // --- Quick Account Disconnect & Wipe ---
  async function handleDeleteAccount(email: string) {
    if (
      !confirm(
        `Are you sure you want to disconnect ${email}? All applications and stored data for this inbox will be securely wiped.`
      )
    ) {
      return;
    }
    setAccountBeingDeleted(email);
    try {
      const res = await fetch(`/api/accounts?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSyncMessage(`Inbox ${email} disconnected and private data wiped.`);
        if (activeAccount === email) {
          setActiveAccount("ALL");
        }
        await loadDashboard("ALL");
      } else {
        const err = await res.json();
        alert(`Failed to remove account: ${err.error || "Unknown error"}`);
      }
    } catch (err: any) {
      alert(`Failed to remove account: ${err.message}`);
    } finally {
      setAccountBeingDeleted(null);
      setAccountDropdownOpen(false);
    }
  }

  // --- Nuclear Privacy Wipe: Wipes all real data and loads demo showcase ---
  async function handleWipeAllData() {
    if (
      !confirm(
        "⚠️ Nuclear Privacy Wipe: This will permanently delete ALL connected Gmail accounts, tokens, and applications from your database and replace the dashboard with randomized demo data. Proceed?"
      )
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/accounts?all=true", { method: "DELETE" });
      if (res.ok) {
        localStorage.removeItem("preferred_account");
        setActiveAccount("ALL");
        setSyncMessage(
          "Privacy wipe complete: All real inboxes and stored data have been permanently wiped. Demo mode active."
        );
        await loadDashboard("demo");
      } else {
        const err = await res.json();
        alert(`Failed to wipe data: ${err.error || "Unknown error"}`);
      }
    } catch (err: any) {
      alert(`Failed to wipe data: ${err.message}`);
    } finally {
      setLoading(false);
      setAccountDropdownOpen(false);
    }
  }

  // --- Toggle Demo Showcase Mode ---
  async function handleToggleDemo() {
    setLoading(true);
    try {
      if (data?.isDemo) {
        await loadDashboard("ALL");
      } else {
        const res = await fetch("/api/applications?demo=true");
        const json = await res.json();
        setData(json);
        if (json.activeAccount) setActiveAccount(json.activeAccount);
      }
    } finally {
      setLoading(false);
      setAccountDropdownOpen(false);
    }
  }

  // --- Inline Status Change ---
  async function handleStatusChange(appId: string, newStatus: string) {
    setUpdatingStatusId(appId);
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            applications: prev.applications.map((a) =>
              a.id === appId
                ? { ...a, status: newStatus as ApplicationItem["status"] }
                : a
            ),
          };
        });
        await loadDashboard(activeAccount);
      }
    } finally {
      setUpdatingStatusId(null);
    }
  }

  // --- Edit modal ---
  function openEditModal(app: ApplicationItem) {
    setEditingApp(app);
    setEditCompany(app.company);
    setEditRole(app.role);
  }

  async function handleSaveEdit() {
    if (!editingApp) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/applications/${editingApp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: editCompany, role: editRole }),
      });
      if (res.ok) {
        setEditingApp(null);
        await loadDashboard(activeAccount);
      }
    } finally {
      setEditSaving(false);
    }
  }

  // --- Delete ---
  async function handleDelete(appId: string) {
    setDeletingId(appId);
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            applications: prev.applications.filter((a) => a.id !== appId),
          };
        });
        await loadDashboard(activeAccount);
      }
    } finally {
      setDeletingId(null);
    }
  }

  // --- Export CSV ---
  function handleExportCSV() {
    if (!filteredApplications.length) return;

    const headers = [
      "Company",
      "Role",
      "Status",
      "Source",
      "Gmail Account",
      "Applied Date",
      "Last Updated",
      "Subject",
    ];

    const escapeCsv = (str: string) => `"${(str || "").replace(/"/g, '""')}"`;

    const rows = filteredApplications.map((app) => [
      escapeCsv(app.company),
      escapeCsv(app.role),
      escapeCsv(STATUS_LABELS[app.status] || app.status),
      escapeCsv(app.source),
      escapeCsv(app.accountEmail || activeAccount || "Default"),
      escapeCsv(format(new Date(app.appliedAt), "yyyy-MM-dd HH:mm")),
      escapeCsv(format(new Date(app.lastUpdatedAt), "yyyy-MM-dd HH:mm")),
      escapeCsv(app.rawSubject || ""),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `career_intelligence_${activeAccount}_${format(new Date(), "yyyy_MM_dd")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Unique sources
  const uniqueSources = useMemo(() => {
    if (!data?.applications) return [];
    const set = new Set(data.applications.map((a) => a.source));
    return Array.from(set).sort();
  }, [data?.applications]);

  // Filtered and sorted applications
  const filteredApplications = useMemo(() => {
    if (!data?.applications) return [];
    return data.applications
      .filter((app) => {
        const matchesStatus =
          selectedStatus === "ALL" || app.status === selectedStatus;
        const matchesSource =
          selectedSource === "ALL" || app.source === selectedSource;
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          !q ||
          app.company.toLowerCase().includes(q) ||
          app.role.toLowerCase().includes(q) ||
          app.source.toLowerCase().includes(q) ||
          app.rawSubject.toLowerCase().includes(q);
        return matchesStatus && matchesSource && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
        }
        return a.company.localeCompare(b.company);
      });
  }, [data?.applications, selectedStatus, selectedSource, searchQuery, sortBy]);

  const conn = data?.connection;
  const stats = data?.stats;
  const accounts = data?.accounts || [];

  // Career Intelligence Computed Metrics
  const intelligence = useMemo(() => {
    const total = stats?.total || 0;
    const interviews = stats?.interviews || 0;
    const rejections = stats?.rejections || 0;
    const inFlight = Math.max(0, total - rejections - (stats?.responsesReceived || 0));
    const interviewRate = total > 0 ? Math.round((interviews / total) * 100) : 0;
    const rejectionRate = total > 0 ? Math.round((rejections / total) * 100) : 0;

    return {
      total,
      interviews,
      rejections,
      inFlight,
      interviewRate,
      rejectionRate,
    };
  }, [stats]);

  // Palette Chart Colors: Lavender (#CBB3E8), Chartreuse (#D4FF3F), Tomato Red (#E34234)
  const funnelData = useMemo(() => {
    if (!data?.charts?.funnelData) return [];
    return data.charts.funnelData.map((item) => {
      let color = "#CBB3E8"; // default lavender
      if (item.stage.toLowerCase().includes("applied")) color = "#CBB3E8";
      if (item.stage.toLowerCase().includes("review")) color = "#E0D2F4";
      if (item.stage.toLowerCase().includes("interview")) color = "#D4FF3F";
      if (item.stage.toLowerCase().includes("offer")) color = "#D4FF3F";
      return { ...item, fill: color };
    });
  }, [data?.charts?.funnelData]);

  const statusDistribution = useMemo(() => {
    if (!data?.charts?.statusDistribution) return [];
    return data.charts.statusDistribution.map((item) => {
      let color = "#CBB3E8";
      if (item.name === "Applied") color = "#CBB3E8";
      if (item.name === "In Review") color = "#A382CE";
      if (item.name === "Interview") color = "#D4FF3F";
      if (item.name === "Offer") color = "#D4FF3F";
      if (item.name === "Rejected") color = "#E34234"; // Tomato Red accent
      return { ...item, color };
    });
  }, [data?.charts?.statusDistribution]);

  // Total status counts for filter badges
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: data?.applications?.length || 0 };
    ALL_STATUSES.forEach((s) => (counts[s] = 0));
    data?.applications?.forEach((a) => {
      if (counts[a.status] !== undefined) counts[a.status]++;
    });
    return counts;
  }, [data?.applications]);

  const chartTheme = useMemo(() => {
    return {
      grid: "#2D1D3D",
      text: "#A8A29E",
    };
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#151416] text-[#F5F0EA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <RefreshCw className="h-8 w-8 animate-spin text-[#CBB3E8]" />
            <div className="absolute inset-0 blur-lg bg-[#CBB3E8]/30 -z-10 rounded-full" />
          </div>
          <p className="text-xs font-mono text-[#A8A29E] tracking-wider uppercase">
            Loading Career Intelligence Studio...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dashboardRef}
      className="min-h-screen bg-[#151416] text-[#F5F0EA] selection:bg-[#CBB3E8] selection:text-[#151416]"
    >
      {/* Editorial Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-[#2C1D3A] bg-[#151416]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Art-Directed Badge */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#CBB3E8] to-[#9F85C2] flex items-center justify-center text-[#151416] font-bold shadow-[0_2px_12px_rgba(203,179,232,0.3)]">
              <Briefcase className="h-4 w-4 text-[#151416]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-editorial text-lg tracking-tight font-medium text-[#F5F0EA] flex items-center gap-1.5">
                  Career Intelligence
                  <span className="text-[#D4FF3F] text-xs font-mono font-bold">•</span>
                </h1>
                <span className="text-[10px] font-bold tracking-wider uppercase bg-[#CBB3E8]/15 text-[#CBB3E8] border border-[#CBB3E8]/30 px-2 py-0.5 rounded-full font-mono">
                  Multi-Inbox
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#A8A29E]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D4FF3F] pulse-glow" />
                <span className="truncate max-w-[170px] sm:max-w-xs font-mono text-[11px] text-[#D8D2CA]">
                  {activeAccount === "ALL" ? "All Inboxes Aggregated" : activeAccount}
                </span>
                {conn?.lastSyncedAt && (
                  <span className="hidden md:inline text-[10px] text-[#8C8294]">
                    • synced {formatDistanceToNow(new Date(conn.lastSyncedAt), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions & Account Switcher Dropdown */}
          <div className="flex items-center gap-2.5">
            {/* Account Switcher Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                className="flex items-center gap-2 h-8 px-3 rounded-xl bg-[#21152B] hover:bg-[#2C1D3A] border border-[#3D2852] hover:border-[#CBB3E8]/40 text-xs font-mono text-[#F5F0EA] transition-all"
              >
                <Mail className="h-3.5 w-3.5 text-[#CBB3E8]" />
                <span className="max-w-[120px] sm:max-w-[160px] truncate text-[11px]">
                  {activeAccount === "ALL" ? "All Inboxes" : activeAccount}
                </span>
                <ChevronDown
                  className={`h-3 w-3 text-[#A8A29E] transition-transform ${
                    accountDropdownOpen ? "rotate-180 text-[#CBB3E8]" : ""
                  }`}
                />
              </button>

              {accountDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#1B1224] border border-[#3D2852] p-2.5 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#A8A29E] flex items-center justify-between border-b border-[#2C1D3A] pb-2 mb-1 font-mono">
                    <span>Connected Gmail Accounts</span>
                    <span className="text-[#D4FF3F]">{accounts.length} active</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1.5 py-1">
                    {accounts.length === 0 ? (
                      <div className="p-3 text-center text-xs text-[#A8A29E] bg-[#21152B]/60 rounded-xl border border-[#2C1D3A]">
                        No personal inboxes connected.
                      </div>
                    ) : (
                      accounts.map((acc) => {
                        const isSelected = activeAccount === acc.email;
                        const isDeleting = accountBeingDeleted === acc.email;
                        return (
                          <div
                            key={acc.id}
                            className={`w-full flex items-center justify-between p-1.5 rounded-xl transition-all ${
                              isSelected
                                ? "bg-[#CBB3E8]/15 border border-[#CBB3E8]/40 text-[#F5F0EA]"
                                : "hover:bg-[#261932] text-[#D8D2CA] hover:text-[#F5F0EA] border border-transparent"
                            }`}
                          >
                            <button
                              onClick={() => handleSelectAccount(acc.email)}
                              className="flex items-center gap-2.5 min-w-0 flex-1 text-left px-1 py-0.5"
                            >
                              <div
                                className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isSelected
                                    ? "bg-[#CBB3E8] text-[#151416]"
                                    : "bg-[#2A1D36] text-[#CBB3E8]"
                                }`}
                              >
                                {acc.email.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-mono font-medium truncate max-w-[140px]">
                                  {acc.email}
                                </div>
                                <div className="text-[10px] text-[#A8A29E]">
                                  {acc.applicationCount} applications
                                </div>
                              </div>
                            </button>

                            <div className="flex items-center gap-1 shrink-0">
                              {isSelected && (
                                <Check className="h-4 w-4 text-[#D4FF3F] mr-0.5" />
                              )}
                              <button
                                title={`Disconnect and wipe data for ${acc.email}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAccount(acc.email);
                                }}
                                disabled={isDeleting}
                                className="p-1.5 rounded-lg text-[#A8A29E] hover:text-[#E34234] hover:bg-[#E34234]/15 transition-colors"
                              >
                                <Trash2
                                  className={`h-3.5 w-3.5 ${isDeleting ? "animate-spin text-[#E34234]" : ""}`}
                                />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* All Accounts Option */}
                    {accounts.length > 1 && (
                      <button
                        onClick={() => handleSelectAccount("ALL")}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                          activeAccount === "ALL"
                            ? "bg-[#CBB3E8]/15 border border-[#CBB3E8]/40 text-[#F5F0EA]"
                            : "hover:bg-[#261932] text-[#D8D2CA] hover:text-[#F5F0EA] border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-lg bg-[#2A1D36] flex items-center justify-center text-xs font-mono font-bold text-[#D8D2CA]">
                            ALL
                          </div>
                          <div>
                            <div className="text-xs font-medium">All Inboxes View</div>
                            <div className="text-[10px] text-[#A8A29E]">
                              Aggregated multi-inbox analytics
                            </div>
                          </div>
                        </div>
                        {activeAccount === "ALL" && (
                          <Check className="h-4 w-4 text-[#D4FF3F]" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Actions & Privacy Strip */}
                  <div className="pt-2 border-t border-[#2C1D3A] mt-1 space-y-1.5">
                    <a
                      href="/api/auth/google"
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#261932] hover:bg-[#322143] border border-[#3D2852] hover:border-[#D4FF3F]/40 text-xs font-medium text-[#D4FF3F] transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Connect Another Gmail</span>
                    </a>

                    <button
                      onClick={handleToggleDemo}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#21152B] hover:bg-[#2C1D3A] border border-[#3D2852] hover:border-[#CBB3E8]/40 text-xs text-[#CBB3E8] transition-all font-mono"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[#CBB3E8]" />
                      <span>{data?.isDemo ? "Switch to Real Data" : "Preview Demo Showcase"}</span>
                    </button>

                    {accounts.length > 0 && (
                      <button
                        onClick={handleWipeAllData}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#E34234]/10 hover:bg-[#E34234]/20 border border-[#E34234]/30 hover:border-[#E34234]/60 text-xs text-[#E34234] transition-all font-mono"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Nuclear Privacy Wipe</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Safe Architecture Modal Trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSecurityModal(true)}
              className="gap-1.5 text-xs border-[#3D2852] hover:border-[#CBB3E8]/40 text-[#D8D2CA] hover:text-[#CBB3E8]"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#CBB3E8]" />
              <span className="hidden sm:inline">Architecture</span>
            </Button>

            {/* Sync Now Button (Primary Chartreuse CTA) */}
            <Button
              variant="chartreuse"
              size="sm"
              onClick={handleSyncNow}
              disabled={syncing}
              className="gap-2 shadow-[0_2px_14px_rgba(212,255,63,0.25)] hover:shadow-[0_2px_20px_rgba(212,255,63,0.4)]"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${syncing ? "animate-spin text-[#151416]" : ""}`}
              />
              <span>{syncing ? "Syncing..." : "Sync Now"}</span>
            </Button>

            {/* Settings */}
            <Link href="/setup">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs border-[#3D2852] hover:border-[#CBB3E8]/40 text-[#D8D2CA]"
              >
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Settings</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 1-Click Fast Account Pills Bar */}
        {accounts.length > 0 && (
          <div className="border-t border-[#23172E] bg-[#1A1022]/95 px-4 sm:px-6 py-2 overflow-x-auto flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A8A29E] flex items-center gap-1 shrink-0 mr-1">
              <Mail className="h-3 w-3 text-[#CBB3E8]" /> Switch Inbox:
            </span>

            {/* Individual Account Pills */}
            {accounts.map((acc) => {
              const isSelected = activeAccount === acc.email;
              return (
                <button
                  key={acc.id}
                  onClick={() => handleSelectAccount(acc.email)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono transition-all shrink-0 ${
                    isSelected
                      ? "bg-[#CBB3E8] text-[#151416] font-bold shadow-[0_2px_10px_rgba(203,179,232,0.3)]"
                      : "bg-[#24172F] hover:bg-[#2E1E3C] text-[#D8D2CA] border border-[#3D2852]"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isSelected ? "bg-[#151416]" : "bg-[#D4FF3F]"
                    }`}
                  />
                  <span>{acc.email}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected
                        ? "bg-[#151416]/20 text-[#151416]"
                        : "bg-[#1A1022] text-[#A8A29E]"
                    }`}
                  >
                    {acc.applicationCount}
                  </span>
                </button>
              );
            })}

            {/* All Inboxes Pill */}
            <button
              onClick={() => handleSelectAccount("ALL")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all shrink-0 font-mono ${
                activeAccount === "ALL"
                  ? "bg-[#CBB3E8] text-[#151416] font-bold shadow-[0_2px_10px_rgba(203,179,232,0.3)]"
                  : "bg-[#24172F] hover:bg-[#2E1E3C] text-[#D8D2CA] border border-[#3D2852]"
              }`}
            >
              <span>All Inboxes</span>
            </button>

            {/* Add Gmail Button */}
            <a
              href="/api/auth/google"
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-[#D4FF3F] bg-[#D4FF3F]/10 hover:bg-[#D4FF3F]/20 border border-[#D4FF3F]/30 transition-all shrink-0 ml-auto"
            >
              <Plus className="h-3 w-3" />
              <span>Add Gmail</span>
            </a>
          </div>
        )}
      </header>

      {/* Interactive Neural Sync Waiting Modal */}
      <SyncWaitingModal
        isOpen={showSyncModal && syncing}
        onDismiss={() => setShowSyncModal(false)}
        targetAccount={activeAccount}
      />

      {/* Demo Showcase Notice Banner */}
      {data?.isDemo && (
        <div className="bg-gradient-to-r from-[#21152B] via-[#2D163A] to-[#21152B] border-b border-[#D4FF3F]/30 px-4 sm:px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#D8D2CA]">
              <span className="flex h-2 w-2 rounded-full bg-[#D4FF3F] animate-pulse" />
              <span className="font-mono text-[#D4FF3F] font-bold uppercase tracking-wider text-[11px]">
                Privacy Showcase Active
              </span>
              <span className="text-[#A8A29E] hidden md:inline">
                — No personal emails or real job data are exposed. Populated with randomized mock career intelligence.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/api/auth/google"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4FF3F] text-[#151416] font-mono font-bold text-[11px] hover:bg-[#c2ed2c] transition-all shadow-[0_0_12px_rgba(212,255,63,0.3)]"
              >
                <Plus className="h-3 w-3" /> Connect Your Gmail
              </a>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Sync Success Feedback */}
        {syncMessage && (
          <div className="rounded-2xl border border-[#D4FF3F]/40 bg-[#D4FF3F]/10 px-4 py-3 text-xs text-[#D4FF3F] flex items-center justify-between shadow-lg shadow-[#D4FF3F]/5 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#D4FF3F] shrink-0" />
              <span>{syncMessage}</span>
            </div>
            <button
              onClick={() => setSyncMessage(null)}
              className="text-[#D4FF3F] hover:text-[#F5F0EA]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Auth Error Notification */}
        {conn?.authError && (
          <Alert className="border-[#E34234]/40 bg-[#E34234]/10 text-[#F5F0EA] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-[#E34234] shrink-0" />
              <div>
                <AlertTitle className="text-sm font-semibold text-[#E34234]">
                  Gmail Authorization Needed
                </AlertTitle>
                <AlertDescription className="text-xs text-[#D8D2CA] mt-0.5">
                  Your Google OAuth token has expired. Re-authenticate to keep synchronizing.
                </AlertDescription>
              </div>
            </div>
            <a href="/api/auth/google">
              <Button size="sm" variant="tomato" className="shrink-0">
                Reconnect Gmail
              </Button>
            </a>
          </Alert>
        )}

        {/* HERO SECTION: Asymmetric Editorial Header + 3D Visual Centerpiece */}
        <section className="gsap-hero relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#21152B] via-[#1B1224] to-[#151416] border border-[#3D2852] p-6 lg:p-8 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Expressive Editorial Copy & Career Metrics */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CBB3E8]/10 border border-[#CBB3E8]/25 text-xs text-[#CBB3E8] font-mono">
                <Zap className="h-3 w-3 text-[#D4FF3F]" />
                <span>Autonomous Candidate Intelligence</span>
              </div>

              <div className="space-y-2">
                <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[#F5F0EA] leading-[1.1]">
                  Precision tracking for your{" "}
                  <span className="italic text-[#CBB3E8] underline decoration-[#D4FF3F] decoration-2 underline-offset-8">
                    highest ambitions.
                  </span>
                </h2>
                <p className="text-sm text-[#A8A29E] max-w-xl leading-relaxed pt-2">
                  Unified parsing across ATS platforms, interview pipelines, and direct
                  offers. Isolated per inbox with zero data exposure.
                </p>
              </div>

              {/* Quick Intelligence Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#2A1D36] border border-[#3D2852] text-xs card-hover">
                  <span className="text-[#A8A29E]">Response Rate</span>
                  <span className="font-mono font-bold text-[#D4FF3F]">
                    {stats?.responseRate ?? 0}%
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#2A1D36] border border-[#3D2852] text-xs card-hover">
                  <span className="text-[#A8A29E]">Interview Ratio</span>
                  <span className="font-mono font-bold text-[#CBB3E8]">
                    {intelligence.interviewRate}%
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#2A1D36] border border-[#3D2852] text-xs card-hover">
                  <span className="text-[#A8A29E]">Active In-Flight</span>
                  <span className="font-mono font-bold text-[#F5F0EA]">
                    {intelligence.inFlight} roles
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Three.js 3D Visual Centerpiece */}
            <div className="lg:col-span-5 h-[240px] sm:h-[280px] lg:h-[300px] w-full relative flex items-center justify-center">
              <CareerCenterpiece className="w-full h-full" />
              <div className="absolute bottom-2 right-2 text-[10px] font-mono text-[#A8A29E]/60 pointer-events-none">
                Interactive Mesh
              </div>
            </div>
          </div>
        </section>

        {/* KPI INTELLIGENCE METRIC CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Total Applications (Lavender Surface Accent) */}
          <Card className="gsap-kpi card-hover bg-[#21152B] border-[#3D2852] hover:border-[#CBB3E8]/40">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="flex items-center justify-between text-xs font-mono text-[#A8A29E]">
                <span>Total Applications</span>
                <Briefcase className="h-4 w-4 text-[#CBB3E8]" />
              </CardDescription>
              <CardTitle className="text-3xl font-extrabold tracking-tight text-[#F5F0EA] mt-1 font-mono">
                {stats?.total ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-[11px] text-[#A8A29E] flex items-center gap-1">
                <Building2 className="h-3 w-3 text-[#CBB3E8]" />
                Tracked companies
              </p>
            </CardContent>
          </Card>

          {/* Responses Received (Lavender Highlight) */}
          <Card className="gsap-kpi card-hover bg-[#21152B] border-[#3D2852] hover:border-[#CBB3E8]/40">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="flex items-center justify-between text-xs font-mono text-[#A8A29E]">
                <span>Responses Received</span>
                <CheckCircle2 className="h-4 w-4 text-[#CBB3E8]" />
              </CardDescription>
              <CardTitle className="text-3xl font-extrabold tracking-tight text-[#CBB3E8] mt-1 font-mono">
                {stats?.responsesReceived ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-[11px] text-[#A8A29E]">Review or recruiter contact</p>
            </CardContent>
          </Card>

          {/* Interviews & Tests (Chartreuse Accent) */}
          <Card className="gsap-kpi card-hover bg-[#21152B] border-[#3D2852] hover:border-[#D4FF3F]/50">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="flex items-center justify-between text-xs font-mono text-[#A8A29E]">
                <span>Interviews &amp; Tests</span>
                <Award className="h-4 w-4 text-[#D4FF3F]" />
              </CardDescription>
              <CardTitle className="text-3xl font-extrabold tracking-tight text-[#D4FF3F] mt-1 font-mono">
                {stats?.interviews ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-[11px] text-[#A8A29E]">Assessments &amp; calls</p>
            </CardContent>
          </Card>

          {/* Confirmed Rejections (Tomato Red Accent - Used Sparingly) */}
          <Card className="gsap-kpi card-hover bg-[#21152B] border-[#3D2852] hover:border-[#E34234]/50">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="flex items-center justify-between text-xs font-mono text-[#A8A29E]">
                <span>Confirmed Rejections</span>
                <XCircle className="h-4 w-4 text-[#E34234]" />
              </CardDescription>
              <CardTitle className="text-3xl font-extrabold tracking-tight text-[#E34234] mt-1 font-mono">
                {stats?.rejections ?? 0}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-[11px] text-[#A8A29E]">
                {intelligence.rejectionRate}% closure rate
              </p>
            </CardContent>
          </Card>

          {/* Response Rate (Chartreuse Highlight) */}
          <Card className="gsap-kpi card-hover col-span-2 md:col-span-1 bg-[#21152B] border-[#3D2852] hover:border-[#D4FF3F]/50">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="flex items-center justify-between text-xs font-mono text-[#A8A29E]">
                <span>Response Rate</span>
                <TrendingUp className="h-4 w-4 text-[#D4FF3F]" />
              </CardDescription>
              <CardTitle className="text-3xl font-extrabold tracking-tight text-[#D4FF3F] mt-1 font-mono">
                {stats?.responseRate ?? 0}%
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-[11px] text-[#A8A29E]">Engagement coefficient</p>
            </CardContent>
          </Card>
        </div>

        {/* SOPHISTICATED DATA VISUALIZATION SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Funnel Chart: Clean Editorial Aesthetic */}
          <Card className="gsap-chart card-hover bg-[#21152B] border-[#3D2852]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#F5F0EA] flex items-center justify-between">
                <span>Application Funnel</span>
                <span className="text-[10px] text-[#CBB3E8] font-mono">CONVERSION</span>
              </CardTitle>
              <CardDescription className="text-xs text-[#A8A29E]">
                Candidate flow across hiring stages
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[230px] w-full">
                {funnelData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={funnelData}
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={chartTheme.grid}
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        stroke={chartTheme.text}
                        fontSize={11}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="stage"
                        stroke={chartTheme.text}
                        fontSize={11}
                        width={70}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Bar
                        dataKey="count"
                        radius={[0, 6, 6, 0]}
                        animationDuration={700}
                      >
                        {funnelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-[#A8A29E]">
                    No funnel data yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submission Activity Timeline (Lavender Area Gradient) */}
          <Card className="gsap-chart card-hover bg-[#21152B] border-[#3D2852]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#F5F0EA] flex items-center justify-between">
                <span>Activity Timeline</span>
                <span className="text-[10px] text-[#D4FF3F] font-mono">WEEKLY</span>
              </CardTitle>
              <CardDescription className="text-xs text-[#A8A29E]">
                Application volume trend over time
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[230px] w-full">
                {data?.charts?.timelineData && data.charts.timelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data.charts.timelineData}
                      margin={{ top: 5, right: 15, left: -20, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="lavenderGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#CBB3E8" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#CBB3E8" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={chartTheme.grid}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="week"
                        stroke={chartTheme.text}
                        fontSize={10}
                      />
                      <YAxis
                        stroke={chartTheme.text}
                        fontSize={11}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="applications"
                        stroke="#CBB3E8"
                        strokeWidth={2}
                        fill="url(#lavenderGrad)"
                        animationDuration={700}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-[#A8A29E]">
                    No timeline activity recorded yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution Donut with Centered Metric & Legend (FIXED Tooltip & Clarity) */}
          <Card className="gsap-chart card-hover bg-[#21152B] border-[#3D2852]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#F5F0EA] flex items-center justify-between">
                <span>Status Breakdown</span>
                <span className="text-[10px] text-[#CBB3E8] font-mono">DISTRIBUTION</span>
              </CardTitle>
              <CardDescription className="text-xs text-[#A8A29E]">
                Current status share in this account
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {statusDistribution.length > 0 ? (
                <div className="space-y-3">
                  {/* Donut Container with Centered Metric Counter */}
                  <div className="relative h-[160px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={74}
                          paddingAngle={3}
                          dataKey="value"
                          animationDuration={700}
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              stroke="#21152B"
                              strokeWidth={2}
                              className="hover:opacity-85 transition-opacity cursor-pointer"
                            />
                          ))}
                        </Pie>
                        {/* High-Contrast Custom Tooltip (Eliminates unreadable dark box) */}
                        <Tooltip content={<CustomChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Centered Total Metric Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="font-mono text-2xl font-black text-[#F5F0EA] tracking-tight">
                        {stats?.total ?? 0}
                      </span>
                      <span className="text-[10px] font-mono tracking-wider uppercase text-[#A8A29E]">
                        Total
                      </span>
                    </div>
                  </div>

                  {/* Interactive Status Legend with Color Swatches */}
                  <div className="pt-2 border-t border-[#2C1D3A] flex flex-wrap items-center justify-center gap-1.5 text-xs">
                    {statusDistribution.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2A1D36]/80 border border-[#3D2852] text-[11px] transition-all hover:border-[#CBB3E8]/40"
                      >
                        <span
                          className="h-2 w-2 rounded-full shrink-0 shadow-[0_0_6px_currentColor]"
                          style={{ backgroundColor: item.color, color: item.color }}
                        />
                        <span className="text-[#A8A29E]">{item.name}</span>
                        <span className="font-mono font-bold text-[#F5F0EA] ml-0.5">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-xs text-[#A8A29E]">
                  No status data to display.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* WORKSPACE: APPLICATIONS & RECRUITER NOTIFICATIONS */}
        <div className="gsap-workspace space-y-4">
          {/* Tabs + Actions Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* View Tabs */}
            <div className="flex items-center gap-1 bg-[#21152B] p-1 rounded-2xl border border-[#3D2852] w-fit">
              <button
                onClick={() => setActiveTab("applications")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "applications"
                    ? "bg-[#CBB3E8] text-[#151416] shadow-sm font-bold"
                    : "text-[#A8A29E] hover:text-[#F5F0EA]"
                }`}
              >
                <Briefcase className="h-3.5 w-3.5" />
                <span>Applications ({data?.applications?.length || 0})</span>
              </button>
              <button
                onClick={() => setActiveTab("notifications")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "notifications"
                    ? "bg-[#CBB3E8] text-[#151416] shadow-sm font-bold"
                    : "text-[#A8A29E] hover:text-[#F5F0EA]"
                }`}
              >
                <Bell className="h-3.5 w-3.5" />
                <span>Notifications ({data?.notifications?.length || 0})</span>
              </button>
            </div>

            {/* Quick Actions (Export CSV) */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={filteredApplications.length === 0}
                className="gap-2 text-xs border-[#3D2852] hover:border-[#D4FF3F]/50 hover:text-[#D4FF3F]"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV ({filteredApplications.length})
              </Button>
            </div>
          </div>

          {activeTab === "applications" ? (
            <Card className="overflow-hidden bg-[#21152B] border-[#3D2852]">
              {/* Filter and Search Bar */}
              <div className="p-4 border-b border-[#2C1D3A] bg-[#1B1224] space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8C8294]" />
                    <Input
                      placeholder="Search company, role, source, subject..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-8 text-xs bg-[#24172F] border-[#3D2852] text-[#F5F0EA] focus:border-[#CBB3E8]"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C8294] hover:text-[#F5F0EA]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Source Dropdown */}
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedSource}
                      onChange={(e) => setSelectedSource(e.target.value)}
                      className="h-9 rounded-xl border border-[#3D2852] bg-[#24172F] px-3 py-1.5 text-xs text-[#F5F0EA] focus:outline-none focus:ring-2 focus:ring-[#CBB3E8]/40"
                    >
                      <option value="ALL">All Sources ({data?.applications?.length || 0})</option>
                      {uniqueSources.map((src) => (
                        <option key={src} value={src} className="bg-[#1B1224] text-[#F5F0EA]">
                          {src}
                        </option>
                      ))}
                    </select>

                    {/* Sort Dropdown */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="h-9 rounded-xl border border-[#3D2852] bg-[#24172F] px-3 py-1.5 text-xs text-[#F5F0EA] focus:outline-none focus:ring-2 focus:ring-[#CBB3E8]/40"
                    >
                      <option value="newest" className="bg-[#1B1224]">Newest First</option>
                      <option value="oldest" className="bg-[#1B1224]">Oldest First</option>
                      <option value="company" className="bg-[#1B1224]">Company (A-Z)</option>
                    </select>
                  </div>
                </div>

                {/* Status Pill Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <span className="text-[#A8A29E] text-[11px] font-mono mr-1 flex items-center gap-1 shrink-0">
                    <Filter className="h-3 w-3 text-[#CBB3E8]" /> Status:
                  </span>
                  <button
                    onClick={() => setSelectedStatus("ALL")}
                    className={`px-3 py-1 rounded-full font-medium transition-all ${
                      selectedStatus === "ALL"
                        ? "bg-[#CBB3E8] text-[#151416] font-bold shadow-sm"
                        : "bg-[#291B35] text-[#A8A29E] hover:text-[#F5F0EA] hover:bg-[#342244]"
                    }`}
                  >
                    All ({statusCounts.ALL || 0})
                  </button>
                  {ALL_STATUSES.map((st) => (
                    <button
                      key={st}
                      onClick={() => setSelectedStatus(st)}
                      className={`px-3 py-1 rounded-full font-medium transition-all ${
                        selectedStatus === st
                          ? "bg-[#CBB3E8] text-[#151416] font-bold shadow-sm"
                          : "bg-[#291B35] text-[#A8A29E] hover:text-[#F5F0EA] hover:bg-[#342244]"
                      }`}
                    >
                      {STATUS_LABELS[st]} ({statusCounts[st] || 0})
                    </button>
                  ))}
                </div>
              </div>

              {/* Table Body */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#1B1224] text-[#A8A29E] border-b border-[#2C1D3A] text-[11px] uppercase tracking-wider font-mono font-medium">
                    <tr>
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-4">Role / Title</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Source</th>
                      {activeAccount === "ALL" && (
                        <th className="py-3 px-4">Inbox</th>
                      )}
                      <th className="py-3 px-4">Applied Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2A1D36] font-normal">
                    {filteredApplications.length > 0 ? (
                      filteredApplications.map((app) => {
                        const avatar = getAvatarColor(app.company);
                        const statusStyle = STATUS_CONFIG[app.status] || STATUS_CONFIG.APPLIED;
                        const isUpdating = updatingStatusId === app.id;
                        const isDeleting = deletingId === app.id;

                        return (
                          <tr
                            key={app.id}
                            className="row-hover transition-colors group"
                          >
                            {/* Company */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`h-9 w-9 rounded-xl ${avatar.bg} ${avatar.text} border ${avatar.border} flex items-center justify-center font-bold text-xs shrink-0 font-mono`}
                                >
                                  {getCompanyInitials(app.company)}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-[#F5F0EA] text-sm truncate">
                                    {app.company}
                                  </div>
                                  <div
                                    className="text-[11px] text-[#A8A29E] truncate max-w-xs"
                                    title={app.rawSubject}
                                  >
                                    {app.rawSubject}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Role */}
                            <td className="py-3.5 px-4 font-medium text-[#D8D2CA] text-xs">
                              {app.role}
                            </td>

                            {/* Status with Inline Select */}
                            <td className="py-3.5 px-4">
                              <div className="relative inline-flex items-center">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} transition-all`}
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot} ${
                                      isUpdating ? "animate-ping" : ""
                                    }`}
                                  />
                                  <span>{statusStyle.label}</span>
                                  <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
                                </span>
                                <select
                                  aria-label={`Update status for ${app.company}`}
                                  value={app.status}
                                  disabled={isUpdating}
                                  onChange={(e) =>
                                    handleStatusChange(app.id, e.target.value)
                                  }
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                >
                                  {ALL_STATUSES.map((st) => (
                                    <option key={st} value={st} className="bg-[#1B1224] text-[#F5F0EA]">
                                      {STATUS_LABELS[st]}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </td>

                            {/* Source */}
                            <td className="py-3.5 px-4">
                              <Badge variant="secondary" className="text-[11px]">
                                {app.source}
                              </Badge>
                            </td>

                            {/* Account column if viewing ALL */}
                            {activeAccount === "ALL" && (
                              <td className="py-3.5 px-4 text-xs font-mono text-[#A8A29E]">
                                <span className="bg-[#1B1224] px-2 py-0.5 rounded-lg border border-[#3D2852]">
                                  {app.accountEmail || "Default"}
                                </span>
                              </td>
                            )}

                            {/* Applied Date */}
                            <td className="py-3.5 px-4 text-xs text-[#A8A29E] whitespace-nowrap">
                              <div>{format(new Date(app.appliedAt), "MMM d, yyyy")}</div>
                              <div className="text-[10px] text-[#8C8294]">
                                {formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true })}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditModal(app)}
                                  aria-label={`Edit ${app.company}`}
                                  className="h-8 w-8 p-0 text-[#A8A29E] hover:text-[#CBB3E8] hover:bg-[#2C1D3A]"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isDeleting}
                                  onClick={() => handleDelete(app.id)}
                                  aria-label={`Delete ${app.company}`}
                                  className="h-8 w-8 p-0 text-[#A8A29E] hover:text-[#E34234] hover:bg-[#E34234]/15"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={activeAccount === "ALL" ? 7 : 6}
                          className="py-12 text-center"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Inbox className="h-10 w-10 text-[#5C4570]" />
                            <p className="text-sm font-medium text-[#D8D2CA]">
                              No job applications found matching your criteria.
                            </p>
                            <p className="text-xs text-[#A8A29E]">
                              Try adjusting your filters or click &quot;Sync Now&quot; to fetch latest Gmail updates.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            /* Notifications Tab */
            <Card className="bg-[#21152B] border-[#3D2852]">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-[#F5F0EA]">
                  Job Alerts &amp; Recruiter Notifications
                </CardTitle>
                <CardDescription className="text-xs text-[#A8A29E]">
                  Background alerts and platforms filtered from your main application pipeline
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data?.notifications && data.notifications.length > 0 ? (
                  <div className="divide-y divide-[#2A1D36]">
                    {data.notifications.map((n) => (
                      <div key={n.id} className="py-3 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#F5F0EA]">
                            {n.subject}
                          </span>
                          <span className="text-[#A8A29E] text-[11px] font-mono">
                            {format(new Date(n.receivedAt), "MMM d, yyyy")}
                          </span>
                        </div>
                        <p className="text-xs text-[#D8D2CA] line-clamp-2">
                          {n.snippet}
                        </p>
                        <div className="pt-1 flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">
                            {n.source}
                          </Badge>
                          {n.accountEmail && (
                            <span className="text-[10px] font-mono text-[#A8A29E]">
                              {n.accountEmail}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-[#A8A29E]">
                    No recruiter notifications or newsletters logged.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Edit Application Modal */}
      {editingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-[#3D2852] bg-[#1B1224] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2C1D3A] pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-[#CBB3E8]" />
                <h3 className="font-semibold text-[#F5F0EA] text-sm font-editorial">
                  Edit Application Details
                </h3>
              </div>
              <button
                onClick={() => setEditingApp(null)}
                className="text-[#A8A29E] hover:text-[#F5F0EA]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <Label htmlFor="edit-company" className="text-xs text-[#D8D2CA]">
                  Company Name
                </Label>
                <Input
                  id="edit-company"
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-role" className="text-xs text-[#D8D2CA]">
                  Role Title
                </Label>
                <Input
                  id="edit-role"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="rounded-xl bg-[#24172F] border border-[#3D2852] p-2.5 text-[11px] text-[#A8A29E] space-y-0.5">
                <div>Original Email Subject:</div>
                <div className="italic text-[#F5F0EA] truncate">
                  {editingApp.rawSubject}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2C1D3A]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingApp(null)}
              >
                Cancel
              </Button>
              <Button
                variant="lavender"
                size="sm"
                onClick={handleSaveEdit}
                disabled={editSaving}
              >
                {editSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Architecture & Security Guarantee Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-[#3D2852] bg-[#1B1224] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#2C1D3A] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-[#CBB3E8]/15 border border-[#CBB3E8]/30 flex items-center justify-center text-[#CBB3E8]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#F5F0EA] text-sm font-editorial">
                    Architecture &amp; Privacy Guarantees
                  </h3>
                  <p className="text-[11px] text-[#A8A29E]">
                    Why your credentials and email contents remain 100% secure
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSecurityModal(false)}
                className="text-[#A8A29E] hover:text-[#F5F0EA]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#24172F] border border-[#3D2852]">
                <Eye className="h-4 w-4 text-[#D4FF3F] mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-[#F5F0EA]">Read-Only Gmail Scope</div>
                  <p className="text-[#A8A29E] text-[11px] mt-0.5">
                    We only request <code className="text-[#CBB3E8] font-mono">gmail.readonly</code>. The app possesses zero privileges to send, delete, or alter any emails in your Gmail inbox.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#24172F] border border-[#3D2852]">
                <Database className="h-4 w-4 text-[#CBB3E8] mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-[#F5F0EA]">Local-Only Database Storage</div>
                  <p className="text-[#A8A29E] text-[11px] mt-0.5">
                    All tokens and emails stay inside your local SQLite database on your machine (<code className="text-[#D8D2CA] font-mono">prisma/dev.db</code>). Nothing is ever transmitted to any external third-party server or cloud data broker.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#24172F] border border-[#3D2852]">
                <Lock className="h-4 w-4 text-[#D4FF3F] mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-[#F5F0EA]">Zero Token Leakage in Frontend APIs</div>
                  <p className="text-[#A8A29E] text-[11px] mt-0.5">
                    Backend API responses explicitly omit <code className="text-[#D8D2CA] font-mono">accessToken</code> and <code className="text-[#D8D2CA] font-mono">refreshToken</code>. The browser client only ever receives parsed application and status metrics.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#24172F] border border-[#3D2852]">
                <UserCheck className="h-4 w-4 text-[#CBB3E8] mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-[#F5F0EA]">Multi-Tenant Account Isolation</div>
                  <p className="text-[#A8A29E] text-[11px] mt-0.5">
                    Each Gmail account is strictly partitioned at the database schema level by its foreign key <code className="text-[#D8D2CA] font-mono">accountEmail</code>. Accounts never cross-pollinate unless you explicitly choose the aggregated &quot;All Inboxes&quot; view.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#2C1D3A]">
              <Button
                variant="chartreuse"
                size="sm"
                onClick={() => setShowSecurityModal(false)}
              >
                Understood &amp; Safe
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
