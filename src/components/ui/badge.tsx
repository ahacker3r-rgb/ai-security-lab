import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-slate-700 bg-slate-800 text-slate-200",
        beginner: "border-green-700/50 bg-green-500/10 text-green-400",
        intermediate: "border-amber-700/50 bg-amber-500/10 text-amber-400",
        advanced: "border-red-700/50 bg-red-500/10 text-red-400",
        success: "border-orange-700/50 bg-orange-500/10 text-orange-400",
        locked: "border-slate-700 bg-slate-800/50 text-slate-500",
        progress: "border-sky-700/50 bg-sky-500/10 text-sky-400",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
