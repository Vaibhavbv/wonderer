import * as React from "react";
import { cn } from "@/lib/utils";

// The single input idiom for the app: dark surface, subtle border, coral
// focus ring. Variants (transparent journal fields, pill comment boxes) pass
// overrides via className.
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary",
        "placeholder:text-text-tertiary transition-colors",
        "outline-none focus-visible:border-border-focus focus-visible:ring-2 focus-visible:ring-ring/30",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
