import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface NumberTickerProps {
  value: number;
  direction?: "up" | "down";
  delay?: number;
  className?: string;
  decimalPlaces?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

export function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
  duration = 2000,
  prefix = "",
  suffix = "",
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState(direction === "up" ? 0 : value);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              const startTime = Date.now();
              const startValue = direction === "up" ? 0 : value;
              const endValue = direction === "up" ? value : 0;

              const animate = () => {
                const now = Date.now();
                const progress = Math.min((now - startTime) / duration, 1);
                
                // Easing function for smooth animation
                const easeOutExpo = 1 - Math.pow(2, -10 * progress);
                
                const currentValue = startValue + (endValue - startValue) * easeOutExpo;
                setDisplayValue(currentValue);

                if (progress < 1) {
                  requestAnimationFrame(animate);
                } else {
                  setDisplayValue(endValue);
                  setHasAnimated(true);
                }
              };

              requestAnimationFrame(animate);
            }, delay);
            
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, direction, delay, duration, hasAnimated]);

  const formattedValue = displayValue.toFixed(decimalPlaces);
  const parts = formattedValue.split(".");
  const integerPart = parseInt(parts[0]).toLocaleString();
  const decimalPart = parts[1];

  return (
    <span ref={ref} className={cn("tabular-nums tracking-tight", className)}>
      {prefix}
      {integerPart}
      {decimalPart && `.${decimalPart}`}
      {suffix}
    </span>
  );
}
