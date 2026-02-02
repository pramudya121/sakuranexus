import { Marquee, MarqueeItem } from "./marquee";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TokenPrice {
  symbol: string;
  price: number;
  change24h: number;
  logo?: string;
}

interface PriceTickerProps {
  tokens?: TokenPrice[];
  className?: string;
}

const defaultTokens: TokenPrice[] = [
  { symbol: "NEX", price: 1.0, change24h: 2.5 },
  { symbol: "NXSA", price: 0.45, change24h: -1.2 },
  { symbol: "WETH", price: 2450.50, change24h: 3.8 },
  { symbol: "USDC", price: 1.0, change24h: 0.01 },
  { symbol: "WNEX", price: 1.02, change24h: 1.5 },
];

export function PriceTicker({ tokens = defaultTokens, className }: PriceTickerProps) {
  return (
    <div className={cn("w-full overflow-hidden py-2", className)}>
      <Marquee pauseOnHover speed={30} repeat={3}>
        {tokens.map((token, idx) => (
          <MarqueeItem key={`${token.symbol}-${idx}`}>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gradient-sakura flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {token.symbol.charAt(0)}
                </span>
              </div>
              <div>
                <span className="font-semibold text-sm">{token.symbol}</span>
                <span className="text-muted-foreground mx-2">
                  ${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  token.change24h >= 0 ? "text-green-500" : "text-red-500"
                )}
              >
                {token.change24h >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(token.change24h).toFixed(2)}%
              </div>
            </div>
          </MarqueeItem>
        ))}
      </Marquee>
    </div>
  );
}
