import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
