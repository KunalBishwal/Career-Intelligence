import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-9 w-full rounded-xl border border-[#3D2852] bg-[#1A1122] px-3 py-2 text-xs text-[#F5F0EA] placeholder:text-[#8C8294] focus:outline-none focus:ring-2 focus:ring-[#CBB3E8]/40 focus:border-[#CBB3E8] transition-all",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
