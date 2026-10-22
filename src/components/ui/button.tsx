import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "chartreuse"
    | "lavender"
    | "tomato"
    | "outline"
    | "secondary"
    | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants: Record<string, string> = {
      default:
        "bg-[#D4FF3F] text-[#151416] font-bold hover:bg-[#c3f224] shadow-[0_2px_12px_rgba(212,255,63,0.25)] active:scale-[0.98]",
      chartreuse:
        "bg-[#D4FF3F] text-[#151416] font-bold hover:bg-[#c3f224] shadow-[0_2px_12px_rgba(212,255,63,0.25)] active:scale-[0.98]",
      lavender:
        "bg-[#CBB3E8] text-[#151416] font-semibold hover:bg-[#d9c6f2] shadow-[0_2px_12px_rgba(203,179,232,0.25)] active:scale-[0.98]",
      tomato:
        "bg-[#E34234] text-white font-semibold hover:bg-[#cf3527] shadow-[0_2px_12px_rgba(227,66,52,0.25)] active:scale-[0.98]",
      outline:
        "border border-[#3D2852] bg-[#21152B]/60 hover:bg-[#2C1D3A] hover:border-[#CBB3E8]/40 text-[#F5F0EA] shadow-sm",
      secondary:
        "bg-[#2C1D3A] text-[#F5F0EA] hover:bg-[#3A264D] border border-[#3D2852]",
      ghost:
        "text-[#A8A29E] hover:text-[#F5F0EA] hover:bg-[#2C1D3A]/60",
    };
    const sizes: Record<string, string> = {
      default: "h-9 px-4 py-2 text-xs",
      sm: "h-8 px-3 text-xs",
      lg: "h-11 px-6 text-sm",
      icon: "h-8 w-8 p-0",
    };
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#CBB3E8]/40",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
