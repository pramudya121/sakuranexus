import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "relative w-9 h-9 overflow-hidden",
        "before:absolute before:inset-0 before:rounded-md",
        "before:transition-all before:duration-500",
        theme === "dark" 
          ? "before:bg-gradient-to-br before:from-indigo-500/20 before:to-purple-500/20" 
          : "before:bg-gradient-to-br before:from-amber-500/20 before:to-orange-500/20"
      )}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Sun Icon */}
        <Sun 
          className={cn(
            "absolute h-[1.2rem] w-[1.2rem] transition-all duration-500",
            theme === "dark" 
              ? "rotate-90 scale-0 opacity-0" 
              : "rotate-0 scale-100 opacity-100 text-amber-500"
          )} 
        />
        
        {/* Moon Icon */}
        <Moon 
          className={cn(
            "absolute h-[1.2rem] w-[1.2rem] transition-all duration-500",
            theme === "dark"
              ? "rotate-0 scale-100 opacity-100 text-indigo-400"
              : "-rotate-90 scale-0 opacity-0"
          )} 
        />
        
        {/* Glow effect */}
        <div 
          className={cn(
            "absolute inset-0 rounded-md transition-opacity duration-500",
            theme === "dark"
              ? "bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-100"
              : "bg-gradient-to-br from-amber-500/10 to-orange-500/10 opacity-100"
          )}
        />
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
