// src/components/ui/activity-indicator.tsx
import * as React from "react";
import { cn } from "@/lib/utils"; // Make sure '@/lib/utils' path is correct

interface ActivityIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "small" | "medium" | "large";
  color?: string; // Tailwind color class or hex value
}

const ActivityIndicator = React.forwardRef<HTMLDivElement, ActivityIndicatorProps>(
  ({ className, size = "medium", color = "text-primary", ...props }, ref) => {
    const sizeClass =
      size === "small"
        ? "h-4 w-4"
        : size === "medium"
        ? "h-6 w-6"
        : "h-8 w-8";

    return (
      <div
        ref={ref}
        className={cn(
          "animate-spin rounded-full border-2 border-current border-t-transparent",
          sizeClass,
          color.startsWith('text-') ? color : `text-[${color}]`, // Allows custom hex colors like #ff0000
          className
        )}
        role="status"
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);
ActivityIndicator.displayName = "ActivityIndicator";

export { ActivityIndicator };
