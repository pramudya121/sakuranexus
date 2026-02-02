import { cn } from "@/lib/utils";

interface RotatingLogoProps {
  src: string;
  alt?: string;
  size?: string;
  className?: string;
}

export function RotatingLogo({ src, alt = "Logo", size = "w-24 h-24", className }: RotatingLogoProps) {
  return (
    <div className={cn("relative perspective-[1000px]", className)}>
      {/* Outer glow */}
      <div className="absolute inset-0 bg-gradient-sakura rounded-full blur-2xl opacity-50 animate-pulse-soft" />
      
      {/* 3D rotating container */}
      <div 
        className={cn(
          "relative transform-gpu",
          size
        )}
        style={{
          transformStyle: "preserve-3d",
          animation: "rotate3d 20s linear infinite",
        }}
      >
        {/* Main logo */}
        <img
          src={src}
          alt={alt}
          className={cn(
            "w-full h-full object-contain rounded-2xl shadow-2xl",
            "drop-shadow-[0_0_30px_hsl(var(--primary)/0.5)]"
          )}
          style={{
            backfaceVisibility: "hidden",
          }}
        />
        
        {/* Reflection effect */}
        <div 
          className="absolute inset-0 rounded-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)",
            animation: "shimmer 3s ease-in-out infinite",
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: 0.6,
              animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes rotate3d {
          0% {
            transform: rotateY(0deg) rotateX(5deg);
          }
          50% {
            transform: rotateY(180deg) rotateX(-5deg);
          }
          100% {
            transform: rotateY(360deg) rotateX(5deg);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-10px) scale(1.2);
            opacity: 1;
          }
        }
        
        @keyframes shimmer {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}
