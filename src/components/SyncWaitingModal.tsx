"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Bot,
  BrainCircuit,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SyncWaitingModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  targetAccount?: string;
}

const CAREER_TIPS = [
  {
    tag: "INTERVIEW PRO-TIP",
    tip: "When asked 'What is your greatest weakness?', frame it around an engineering trade-off you previously made and how you calibrated tests to prevent regressions.",
  },
  {
    tag: "TIMING INSIGHT",
    tip: "Emails sent to recruiters between 9:00 AM - 10:30 AM local time on Tuesday & Wednesday have a 38% higher response rate than Friday afternoon outreach.",
  },
  {
    tag: "AI NORMALIZATION",
    tip: "Gemini actively normalizes company names (e.g., 'Google LLC', 'Google Cloud', 'Alphabet' all unify into 'Google') so your metrics stay crystal clear.",
  },
  {
    tag: "NEGOTIATION LEVERAGE",
    tip: "Never give a single number when asked for salary expectations. Ask for the budgeted salary band for the leveling bracket first.",
  },
  {
    tag: "PORTFOLIO SIGNAL",
    tip: "Recruiters and hiring managers spend an average of 6-8 seconds on initial resume triage. Put high-impact metrics in bold directly in your bullet points.",
  },
  {
    tag: "ATS OPTIMIZATION",
    tip: "Modern ATS platforms like Greenhouse & Ashby parse plain single-column layouts 40% more accurately than multi-column graphic resumes.",
  },
];

const SYNC_STAGES = [
  {
    title: "Secure Gmail Handshake",
    desc: "Validating read-only OAuth tokens & establishing encrypted SSL session",
    icon: Shield,
    thresholdSeconds: 0,
  },
  {
    title: "Scanning Recruiting Threads",
    desc: "Filtering Greenhouse, Lever, Ashby, Workday, and recruiter subject lines",
    icon: Clock,
    thresholdSeconds: 4,
  },
  {
    title: "Gemini AI Neural Synthesis",
    desc: "Classifying job stages, extracting company names, and isolating interviews",
    icon: BrainCircuit,
    thresholdSeconds: 10,
  },
  {
    title: "Consolidating Analytics",
    desc: "Calibrating response rates, interview conversion, and status timeline",
    icon: Zap,
    thresholdSeconds: 18,
  },
];

export default function SyncWaitingModal({
  isOpen,
  onDismiss,
  targetAccount,
}: SyncWaitingModalProps) {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [activeTipIdx, setActiveTipIdx] = useState(0);
  const [energyTaps, setEnergyTaps] = useState(0);
  const [tapEffect, setTapEffect] = useState(false);

  // Timer loop
  useEffect(() => {
    if (!isOpen) {
      setSecondsElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Tip auto-rotation
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setActiveTipIdx((prev) => (prev + 1) % CAREER_TIPS.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  // Determine active stage
  const currentStageIndex =
    secondsElapsed >= 18
      ? 3
      : secondsElapsed >= 10
      ? 2
      : secondsElapsed >= 4
      ? 1
      : 0;

  const currentTip = CAREER_TIPS[activeTipIdx];
  const progressPercent = Math.min(95, Math.round(15 + secondsElapsed * 3.8));

  const handleEnergyTap = () => {
    setEnergyTaps((prev) => prev + 1);
    setTapEffect(true);
    setTimeout(() => setTapEffect(false), 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F0B14]/85 backdrop-blur-xl animate-in fade-in duration-300">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 w-96 h-96 bg-[#CBB3E8]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 w-96 h-96 bg-[#D4FF3F]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Glass Card */}
      <div className="relative w-full max-w-xl rounded-3xl bg-[#1B1224]/95 border border-[#3D2852] p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Top Decorative Header */}
        <div className="flex items-center justify-between mb-6 border-b border-[#2C1D3A] pb-4">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-2xl bg-gradient-to-br from-[#D4FF3F] to-[#8CBE00] flex items-center justify-center text-[#151416] font-bold shadow-[0_0_20px_rgba(212,255,63,0.3)]">
              <Bot className="h-5 w-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#D4FF3F] animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-editorial text-lg text-[#F5F0EA] font-medium tracking-tight">
                  Neural Inbox Sync
                </h3>
                <span className="text-[10px] font-mono uppercase tracking-wider bg-[#D4FF3F]/15 text-[#D4FF3F] border border-[#D4FF3F]/30 px-2 py-0.5 rounded-full font-bold">
                  Gemini Active
                </span>
              </div>
              <p className="text-xs text-[#A8A29E] font-mono">
                {targetAccount && targetAccount !== "ALL"
                  ? `Syncing ${targetAccount}`
                  : "Synthesizing all connected inboxes"}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="font-mono text-xs font-bold text-[#CBB3E8] bg-[#2E1E3C] px-2.5 py-1 rounded-xl border border-[#4C3364]">
              {String(Math.floor(secondsElapsed / 60)).padStart(2, "0")}:
              {String(secondsElapsed % 60).padStart(2, "0")}s
            </div>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#D8D2CA] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#D4FF3F] animate-spin" />
              {SYNC_STAGES[currentStageIndex].title}
            </span>
            <span className="text-[#D4FF3F] font-bold">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#261932] overflow-hidden p-0.5 border border-[#3D2852]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#CBB3E8] via-[#D4FF3F] to-[#D4FF3F] transition-all duration-500 shadow-[0_0_12px_rgba(212,255,63,0.4)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-[#A8A29E] italic">
            {SYNC_STAGES[currentStageIndex].desc}
          </p>
        </div>

        {/* 4-Stage Stepper View */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {SYNC_STAGES.map((stg, i) => {
            const isCompleted = currentStageIndex > i;
            const isCurrent = currentStageIndex === i;
            const Icon = stg.icon;
            return (
              <div
                key={stg.title}
                className={`p-2.5 rounded-2xl border text-center transition-all ${
                  isCurrent
                    ? "bg-[#D4FF3F]/10 border-[#D4FF3F]/50 shadow-[0_0_15px_rgba(212,255,63,0.15)]"
                    : isCompleted
                    ? "bg-[#CBB3E8]/10 border-[#CBB3E8]/30"
                    : "bg-[#21152B]/50 border-[#2C1D3A] opacity-40"
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-[#D4FF3F]" />
                  ) : (
                    <Icon
                      className={`h-4 w-4 ${
                        isCurrent ? "text-[#D4FF3F] animate-bounce" : "text-[#A8A29E]"
                      }`}
                    />
                  )}
                </div>
                <div
                  className={`text-[10px] font-mono uppercase tracking-wider font-bold truncate ${
                    isCurrent ? "text-[#D4FF3F]" : isCompleted ? "text-[#CBB3E8]" : "text-[#A8A29E]"
                  }`}
                >
                  Step {i + 1}
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Tip Carousel Card */}
        <div className="rounded-2xl bg-[#21152B] border border-[#3D2852] p-4 mb-6 relative group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-mono uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-[#CBB3E8]/15 text-[#CBB3E8] border border-[#CBB3E8]/30">
              {currentTip.tag}
            </span>
            <button
              onClick={() => setActiveTipIdx((prev) => (prev + 1) % CAREER_TIPS.length)}
              className="text-[10px] font-mono text-[#D4FF3F] hover:underline flex items-center gap-1 transition-colors"
            >
              Next Tip <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <p className="text-xs text-[#F5F0EA] leading-relaxed transition-all min-h-[44px]">
            &ldquo;{currentTip.tip}&rdquo;
          </p>
        </div>

        {/* Interactive Energy Clicker (Engaging Waiting Element) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#2C1D3A]">
          <div className="flex items-center gap-2">
            <button
              onClick={handleEnergyTap}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2C1D3A] hover:bg-[#3D2852] border border-[#4C3364] hover:border-[#D4FF3F]/50 text-xs text-[#D8D2CA] transition-all transform active:scale-95 ${
                tapEffect ? "scale-105 border-[#D4FF3F] bg-[#D4FF3F]/20 text-[#D4FF3F]" : ""
              }`}
            >
              <Zap className="h-3.5 w-3.5 text-[#D4FF3F]" />
              <span className="font-mono text-[11px]">Tap to Boost:</span>
              <span className="font-mono font-bold text-[#D4FF3F]">{energyTaps}</span>
            </button>
            <span className="text-[10px] text-[#A8A29E] font-mono hidden sm:inline">
              (Interactive stress relief)
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-xs text-[#A8A29E] hover:text-[#F5F0EA] hover:bg-[#2C1D3A] gap-1.5"
          >
            <EyeOff className="h-3.5 w-3.5" />
            <span>Run in Background</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
