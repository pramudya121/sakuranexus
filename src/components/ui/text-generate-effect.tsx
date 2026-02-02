import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TextGenerateEffectProps {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
}

export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.5,
}: TextGenerateEffectProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const wordsArray = words.split(" ");

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={cn("font-bold", className)}>
      <div className="mt-4">
        <div className="leading-snug tracking-wide">
          {wordsArray.map((word, idx) => {
            return (
              <span
                key={word + idx}
                className="inline-block opacity-0"
                style={{
                  animation: isVisible
                    ? `textReveal ${duration}s ease ${idx * 0.1}s forwards`
                    : "none",
                  filter: filter ? "blur(10px)" : "none",
                }}
              >
                {word}{" "}
              </span>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes textReveal {
          0% {
            opacity: 0;
            filter: blur(10px);
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            filter: blur(0px);
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
