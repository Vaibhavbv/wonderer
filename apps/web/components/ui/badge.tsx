import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Status/label pills. Fills follow the dark-theme alpha pattern
// (bg-<status>/15 + text-<status>) so they sit on any surface.
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-primary-500/15 text-primary-400",
        success: "bg-success/15 text-success",
        warning: "bg-warning/15 text-warning",
        neutral: "bg-surface-pressed text-text-secondary border border-border",
        outline: "border border-border text-text-secondary",
        solid: "bg-primary-500 text-white",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
