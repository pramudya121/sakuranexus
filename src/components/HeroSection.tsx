import { memo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, ArrowLeftRight, ChevronDown } from "lucide-react";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Spotlight } from "@/components/ui/spotlight";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { NumberTicker } from "@/components/ui/number-ticker";
import { PriceTicker } from "@/components/ui/price-ticker";
import { Button } from "@/components/ui/button";
import sakuraHeroBg from "@/assets/sakura-hero-bg.jpg";
import sakuraLogo from "@/assets/sakura-logo.png";

interface QuickStat {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
}

interface HeroSectionProps {
  stats: QuickStat[];
  isLoaded: boolean;
}

const HeroSection = memo(function HeroSection({ stats, isLoaded }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Spotlight Effect */}
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="hsl(335 80% 55%)"
      />

      {/* Sakura Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${sakuraHeroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
      </div>

      {/* Animated Mesh Gradient Orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[150px] animate-pulse-soft" />
        <div
          className="absolute bottom-20 right-10 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[180px] animate-pulse-soft"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[200px] animate-pulse-soft"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative container mx-auto px-4 text-center z-10 pt-20">
        <div
          className={`max-w-5xl mx-auto space-y-8 transition-all duration-1000 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Logo - Static, no rotation */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl scale-150 animate-pulse-soft" />
              <img
                src={sakuraLogo}
                alt="NEXUSAKURA"
                className="relative w-24 h-24 md:w-32 md:h-32 rounded-full ring-4 ring-primary/20 shadow-2xl"
              />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-md animate-fade-in-up stagger-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-primary">
              🌸 Live on Nexus Testnet
            </span>
          </div>

          {/* Headline */}
          <div className="animate-fade-in-up stagger-2">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight">
              <span className="text-foreground">Trade & Collect</span>
              <br />
              <TextGenerateEffect
                words="Digital Art"
                className="gradient-text inline-block text-5xl md:text-7xl lg:text-8xl"
                duration={0.8}
              />
            </h1>
          </div>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up stagger-3">
            The premier NFT marketplace and decentralized exchange on Nexus blockchain.
            Experience the beauty of{" "}
            <span className="text-primary font-medium">Sakura</span> while trading.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 animate-fade-in-up stagger-4">
            <Link to="/marketplace">
              <ShimmerButton
                className="text-base px-10 py-4 text-lg group"
                shimmerColor="rgba(255,255,255,0.3)"
                shimmerDuration="2.5s"
              >
                <Sparkles className="mr-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                Explore NFTs
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </ShimmerButton>
            </Link>
            <Link to="/dex/swap">
              <Button
                size="lg"
                variant="outline"
                className="text-base px-10 py-7 h-auto rounded-2xl text-lg border-2 hover:bg-primary/10 hover:border-primary transition-all group backdrop-blur-sm"
              >
                <ArrowLeftRight className="mr-2 w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                Launch DEX
              </Button>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-16 max-w-4xl mx-auto animate-fade-in-up stagger-5">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="glass rounded-2xl p-6 text-center hover:scale-105 transition-transform duration-300 border border-primary/10 hover:border-primary/30"
              >
                <div className="text-2xl md:text-3xl font-bold gradient-text">
                  {stat.prefix}
                  <NumberTicker
                    value={stat.value}
                    duration={2000}
                    delay={index * 200}
                  />
                  {stat.suffix}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Live Price Ticker */}
          <div className="pt-8 animate-fade-in-up stagger-6">
            <PriceTicker />
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
        <ChevronDown className="w-8 h-8 text-muted-foreground/50" />
      </div>
    </section>
  );
});

export default HeroSection;
