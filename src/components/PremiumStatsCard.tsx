import { memo, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { BorderBeam } from '@/components/ui/border-beam';
import { NumberTicker } from '@/components/ui/number-ticker';
import { GlowingStarsBackgroundCard } from '@/components/ui/glowing-stars';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumStatsCardProps {
  icon: LucideIcon;
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  description?: string;
  trend?: number;
  variant?: 'default' | 'glow' | 'gradient';
  colorScheme?: 'primary' | 'success' | 'warning' | 'info' | 'purple';
  className?: string;
}

const colorSchemes = {
  primary: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    gradient: 'from-primary/20 to-primary/5',
    border: 'border-primary/20',
  },
  success: {
    bg: 'bg-green-500/10',
    text: 'text-green-500',
    gradient: 'from-green-500/20 to-green-500/5',
    border: 'border-green-500/20',
  },
  warning: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    gradient: 'from-amber-500/20 to-amber-500/5',
    border: 'border-amber-500/20',
  },
  info: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    gradient: 'from-blue-500/20 to-blue-500/5',
    border: 'border-blue-500/20',
  },
  purple: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-500',
    gradient: 'from-purple-500/20 to-purple-500/5',
    border: 'border-purple-500/20',
  },
};

const PremiumStatsCard = memo(function PremiumStatsCard({
  icon: Icon,
  title,
  value,
  suffix,
  prefix,
  description,
  trend,
  variant = 'default',
  colorScheme = 'primary',
  className,
}: PremiumStatsCardProps) {
  const colors = colorSchemes[colorScheme];

  if (variant === 'glow') {
    return (
      <GlowingStarsBackgroundCard className={cn("h-full", className)}>
        <div className="relative z-10 p-6">
          <div className={cn("p-3 rounded-xl w-fit mb-4", colors.bg)}>
            <Icon className={cn("w-6 h-6", colors.text)} />
          </div>
          <p className="text-sm text-muted-foreground mb-2">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              {prefix}
              <NumberTicker value={value} />
              {suffix}
            </span>
            {trend !== undefined && (
              <span className={cn(
                "text-sm font-medium",
                trend >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-2">{description}</p>
          )}
        </div>
      </GlowingStarsBackgroundCard>
    );
  }

  return (
    <Card className={cn(
      "relative overflow-hidden glass border-border/50",
      variant === 'gradient' && `bg-gradient-to-br ${colors.gradient}`,
      className
    )}>
      {variant === 'default' && <BorderBeam size={100} duration={10} />}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("p-3 rounded-xl", colors.bg)}>
            <Icon className={cn("w-5 h-5", colors.text)} />
          </div>
          {trend !== undefined && (
            <span className={cn(
              "text-sm font-medium px-2 py-1 rounded-full",
              trend >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
            )}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
        
        <div className="space-y-1">
          <div className="text-2xl md:text-3xl font-bold">
            {prefix}
            <NumberTicker value={value} />
            {suffix}
          </div>
          <p className="text-sm text-muted-foreground">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground/70 mt-1">{description}</p>
          )}
        </div>
      </div>
    </Card>
  );
});

export { PremiumStatsCard };
export default PremiumStatsCard;
