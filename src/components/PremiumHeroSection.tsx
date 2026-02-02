import { memo, useEffect, useState, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Spotlight } from '@/components/ui/spotlight';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { TextGenerateEffect } from '@/components/ui/text-generate-effect';
import { BorderBeam } from '@/components/ui/border-beam';
import { NumberTicker } from '@/components/ui/number-ticker';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Stat {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
}

interface PremiumHeroSectionProps {
  badge?: string;
  badgeIcon?: LucideIcon;
  title: string;
  titleHighlight?: string;
  description: string;
  primaryAction?: {
    label: string;
    href: string;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  stats?: Stat[];
  children?: ReactNode;
  variant?: 'default' | 'centered' | 'split';
  showSpotlight?: boolean;
  className?: string;
}

const PremiumHeroSection = memo(function PremiumHeroSection({
  badge,
  badgeIcon: BadgeIcon,
  title,
  titleHighlight,
  description,
  primaryAction,
  secondaryAction,
  stats,
  children,
  variant = 'default',
  showSpotlight = true,
  className,
}: PremiumHeroSectionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className={cn(
      "relative pt-32 pb-20 overflow-hidden",
      className
    )}>
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] animate-pulse-soft" />
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
      </div>

      {showSpotlight && <Spotlight className="hidden md:block" />}

      <div className="container mx-auto px-4 relative z-10">
        <div className={cn(
          "max-w-4xl",
          variant === 'centered' && "mx-auto text-center"
        )}>
          {/* Badge */}
          {badge && (
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6",
              "animate-fade-in-up",
              isVisible ? "opacity-100" : "opacity-0"
            )}>
              {BadgeIcon && <BadgeIcon className="w-4 h-4" />}
              {badge}
            </div>
          )}

          {/* Title */}
          <h1 className={cn(
            "text-4xl md:text-6xl lg:text-7xl font-bold mb-6",
            "animate-fade-in-up stagger-1"
          )}>
            {titleHighlight ? (
              <>
                {title.split(titleHighlight)[0]}
                <span className="gradient-text">{titleHighlight}</span>
                {title.split(titleHighlight)[1]}
              </>
            ) : (
              <TextGenerateEffect words={title} />
            )}
          </h1>

          {/* Description */}
          <p className={cn(
            "text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl",
            variant === 'centered' && "mx-auto",
            "animate-fade-in-up stagger-2"
          )}>
            {description}
          </p>

          {/* Actions */}
          {(primaryAction || secondaryAction) && (
            <div className={cn(
              "flex flex-wrap gap-4 mb-12",
              variant === 'centered' && "justify-center",
              "animate-fade-in-up stagger-3"
            )}>
              {primaryAction && (
                <Link to={primaryAction.href}>
                  <ShimmerButton className="shadow-sakura-strong">
                    {primaryAction.icon && <primaryAction.icon className="w-5 h-5 mr-2" />}
                    {primaryAction.label}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </ShimmerButton>
                </Link>
              )}
              {secondaryAction && (
                <Link to={secondaryAction.href}>
                  <Button variant="outline" size="lg" className="rounded-xl px-8 h-12">
                    {secondaryAction.label}
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Stats Grid */}
          {stats && stats.length > 0 && (
            <div className={cn(
              "grid gap-4 animate-fade-in-up stagger-4",
              stats.length <= 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4"
            )}>
              {stats.map((stat, idx) => (
                <div key={idx} className="relative p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 overflow-hidden group hover:border-primary/30 transition-colors">
                  <BorderBeam size={120} duration={8} delay={idx * 2} />
                  <div className="text-2xl md:text-3xl font-bold mb-1">
                    {stat.prefix}
                    <NumberTicker value={stat.value} />
                    {stat.suffix}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Custom Content */}
          {children}
        </div>
      </div>
    </section>
  );
});

export { PremiumHeroSection };
export default PremiumHeroSection;
