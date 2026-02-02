import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface GlowingStarsBackgroundCardProps {
  className?: string;
  children?: React.ReactNode;
}

export const GlowingStarsBackgroundCard = ({
  className,
  children,
}: GlowingStarsBackgroundCardProps) => {
  const [mouseEnter, setMouseEnter] = useState(false);

  return (
    <div
      onMouseEnter={() => setMouseEnter(true)}
      onMouseLeave={() => setMouseEnter(false)}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6",
        className
      )}
    >
      <div className="flex justify-center items-center">
        <Illustration mouseEnter={mouseEnter} />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};

interface IllustrationProps {
  mouseEnter: boolean;
}

const Illustration = ({ mouseEnter }: IllustrationProps) => {
  const stars = 20;
  const columns = 10;

  const [glowingStars, setGlowingStars] = useState<number[]>([]);

  const highlightedStars = useRef<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      highlightedStars.current = Array.from({ length: 5 }, () =>
        Math.floor(Math.random() * stars)
      );
      setGlowingStars([...highlightedStars.current]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: "1px",
      }}
    >
      {[...Array(stars)].map((_, starIdx) => {
        const isGlowing = glowingStars.includes(starIdx);
        const delay = (starIdx % 10) * 0.1;
        const staticDelay = starIdx * 0.01;
        return (
          <div
            key={`matrix-col-${starIdx}`}
            className="relative flex items-center justify-center"
          >
            <Star
              isGlowing={mouseEnter ? true : isGlowing}
              delay={mouseEnter ? staticDelay : delay}
            />
            {mouseEnter && <Glow delay={staticDelay} />}
          </div>
        );
      })}
    </div>
  );
};

interface StarProps {
  isGlowing: boolean;
  delay: number;
}

const Star = ({ isGlowing, delay }: StarProps) => {
  return (
    <div
      className={cn(
        "relative z-10 h-[3px] w-[3px] rounded-full bg-muted-foreground/20 transition-all duration-1000",
        isGlowing && "bg-primary scale-150"
      )}
      style={{
        transitionDelay: `${delay}s`,
      }}
    />
  );
};

interface GlowProps {
  delay: number;
}

const Glow = ({ delay }: GlowProps) => {
  return (
    <div
      className="absolute h-[8px] w-[8px] rounded-full bg-primary/50 blur-[2px] z-0 animate-pulse"
      style={{
        animationDelay: `${delay}s`,
      }}
    />
  );
};

export const GlowingStarsTitle = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <h2 className={cn("font-bold text-2xl text-foreground", className)}>
      {children}
    </h2>
  );
};

export const GlowingStarsDescription = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <p className={cn("text-base text-muted-foreground max-w-[16rem]", className)}>
      {children}
    </p>
  );
};
