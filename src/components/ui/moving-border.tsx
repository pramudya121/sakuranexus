import { cn } from "@/lib/utils";
import React from "react";

interface MovingBorderProps {
  children: React.ReactNode;
  duration?: number;
  rx?: string;
  ry?: string;
  className?: string;
  containerClassName?: string;
  borderClassName?: string;
  as?: React.ElementType;
}

export function MovingBorder({
  children,
  duration = 4000,
  rx = "30%",
  ry = "30%",
  className,
  containerClassName,
  borderClassName,
  as: Component = "div",
}: MovingBorderProps) {
  return (
    <Component
      className={cn(
        "relative h-full w-full overflow-hidden rounded-2xl bg-transparent p-[2px]",
        containerClassName
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `conic-gradient(from 0deg, transparent, hsl(var(--primary)), transparent 30%)`,
          animation: `spin ${duration}ms linear infinite`,
        }}
      />
      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center rounded-[inherit] bg-card",
          className
        )}
      >
        {children}
      </div>
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Component>
  );
}

export function MovingBorderCard({
  children,
  className,
  containerClassName,
  ...props
}: MovingBorderProps) {
  return (
    <MovingBorder
      containerClassName={cn("rounded-2xl", containerClassName)}
      className={cn("rounded-[calc(1rem-2px)] p-6", className)}
      {...props}
    >
      {children}
    </MovingBorder>
  );
}
