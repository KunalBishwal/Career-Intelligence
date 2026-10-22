import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "lavender" | "chartreuse" | "tomato" | "secondary" | "outline";
}) {
  const variants: Record<string, string> = {
    default: "bg-[#CBB3E8]/15 text-[#CBB3E8] border-[#CBB3E8]/35",
    lavender: "bg-[#CBB3E8]/15 text-[#CBB3E8] border-[#CBB3E8]/35",
    chartreuse: "bg-[#D4FF3F]/15 text-[#D4FF3F] border-[#D4FF3F]/35",
    tomato: "bg-[#E34234]/15 text-[#E34234] border-[#E34234]/35",
    secondary: "bg-[#2A1B36] text-[#D8D2CA] border-[#3D2852]",
    outline: "text-[#A8A29E] border-[#3D2852] bg-transparent",
  };
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-tight transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
