import { memo, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { MovingBorder } from '@/components/ui/moving-border';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import { HoverEffect } from '@/components/ui/hover-effect';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumFeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  variant?: 'default' | 'moving-border' | 'gradient' | 'hover';
  colorGradient?: string;
  className?: string;
  children?: ReactNode;
}

const PremiumFeatureCard = memo(function PremiumFeatureCard({
  icon: Icon,
  title,
  description,
  href,
  variant = 'default',
  colorGradient = 'from-primary to-accent',
  className,
  children,
}: PremiumFeatureCardProps) {
  const content = (
    <div className="h-full">
      <div className={cn(
        "inline-flex p-4 rounded-xl bg-gradient-to-br mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300",
        colorGradient
      )}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm leading-relaxed mb-4">
        {description}
      </p>
      {children}
      {href && (
        <div className="flex items-center gap-1 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Learn More <ArrowRight className="w-4 h-4" />
        </div>
      )}
    </div>
  );

  if (variant === 'moving-border') {
    const Wrapper = href ? Link : 'div';
    return (
      <Wrapper to={href || ''} className={cn("block group", className)}>
        <MovingBorder
          className="bg-card p-6"
          containerClassName="h-full"
        >
          {content}
        </MovingBorder>
      </Wrapper>
    );
  }

  if (variant === 'gradient') {
    const Wrapper = href ? Link : 'div';
    return (
      <Wrapper to={href || ''} className={cn("block group", className)}>
        <BackgroundGradient className="h-full p-6 bg-card rounded-2xl">
          {content}
        </BackgroundGradient>
      </Wrapper>
    );
  }

  // Default card
  const Wrapper = href ? Link : 'div';
  return (
    <Wrapper to={href || ''} className={cn("block group", className)}>
      <Card className="h-full p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 hover:shadow-elegant transition-all duration-300">
        {content}
      </Card>
    </Wrapper>
  );
});

// Multiple cards with hover effect
interface HoverFeatureCardsProps {
  items: {
    icon: LucideIcon;
    title: string;
    description: string;
    href?: string;
  }[];
  className?: string;
}

const HoverFeatureCards = memo(function HoverFeatureCards({
  items,
  className,
}: HoverFeatureCardsProps) {
  const formattedItems = items.map((item) => ({
    title: item.title,
    description: item.description,
    link: item.href || '#',
  }));

  return (
    <HoverEffect items={formattedItems} className={className} />
  );
});

export { PremiumFeatureCard, HoverFeatureCards };
export default PremiumFeatureCard;
