import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeftRight, Droplets, Waves, Coins, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const DEXNavigation = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { path: '/dex/swap', label: 'Swap', icon: ArrowLeftRight },
    { path: '/dex/liquidity', label: 'Liquidity', icon: Droplets },
    { path: '/dex/pools', label: 'Pools', icon: Waves },
    { path: '/dex/staking', label: 'Staking', icon: Coins },
  ];

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-sakura text-white shadow-sakura'
                  : 'bg-secondary/50 hover:bg-secondary text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Mobile Hamburger Menu */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-secondary/50 border-border/50"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-background/95 backdrop-blur-xl">
            <SheetHeader>
              <SheetTitle className="text-left gradient-text">DEX Menu</SheetTitle>
            </SheetHeader>
            <nav className="mt-8 flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-sakura text-white shadow-sakura'
                        : 'bg-secondary/30 hover:bg-secondary/50 text-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Mobile: Show current page indicator */}
      <div className="md:hidden flex items-center gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          if (!isActive) return null;
          return (
            <div
              key={item.path}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-sakura text-white shadow-sakura"
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium text-sm">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DEXNavigation;
