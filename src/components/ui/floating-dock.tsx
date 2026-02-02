import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

interface FloatingDockItem {
  title: string;
  icon: React.ReactNode;
  href: string;
}

interface FloatingDockProps {
  items: FloatingDockItem[];
  className?: string;
  mobileClassName?: string;
}

export function FloatingDock({ items, className, mobileClassName }: FloatingDockProps) {
  const location = useLocation();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-2 px-4 py-3",
        "rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl shadow-xl",
        className,
        mobileClassName
      )}
    >
      {items.map((item, idx) => {
        const isActive = location.pathname === item.href;
        const isHovered = hoveredIndex === idx;

        return (
          <Link
            key={item.href}
            to={item.href}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={cn(
              "relative flex flex-col items-center justify-center",
              "w-12 h-12 rounded-xl transition-all duration-300",
              isActive
                ? "bg-primary text-primary-foreground shadow-sakura"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
              isHovered && !isActive && "scale-110"
            )}
          >
            {/* Tooltip */}
            <span
              className={cn(
                "absolute -top-10 px-3 py-1.5 rounded-lg bg-card border border-border shadow-lg text-xs font-medium whitespace-nowrap",
                "opacity-0 scale-90 transition-all duration-200 pointer-events-none",
                isHovered && "opacity-100 scale-100"
              )}
            >
              {item.title}
            </span>

            {/* Icon */}
            <span
              className={cn(
                "transition-transform duration-300",
                isHovered && "scale-125"
              )}
            >
              {item.icon}
            </span>

            {/* Active indicator */}
            {isActive && (
              <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary-foreground animate-pulse" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
