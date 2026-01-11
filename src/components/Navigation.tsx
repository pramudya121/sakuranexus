import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Store, 
  Palette, 
  Activity, 
  User, 
  Trophy, 
  BarChart3, 
  ArrowLeftRight, 
  LayoutDashboard,
  Menu,
  X,
  ChevronDown,
  Gavel
} from 'lucide-react';
import ConnectWallet from './ConnectWallet';
import NotificationBell from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import sakuraLogo from '@/assets/sakura-logo.png';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const Navigation = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mainNavItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/marketplace', label: 'Marketplace', icon: Store },
  ];

  const dexNavItems = [
    { path: '/dex/swap', label: 'Swap' },
    { path: '/dex/liquidity', label: 'Liquidity' },
    { path: '/dex/pools', label: 'Pools' },
    { path: '/dex/staking', label: 'Staking' },
  ];

  const moreNavItems = [
    { path: '/mint', label: 'Mint NFT', icon: Palette },
    { path: '/auctions', label: 'Auctions', icon: Gavel },
    { path: '/my-auctions', label: 'My Auctions', icon: Gavel },
    { path: '/activity', label: 'Activity', icon: Activity },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isDexActive = dexNavItems.some(item => location.pathname.startsWith('/dex'));

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <img 
                src={sakuraLogo} 
                alt="NEXUSAKURA" 
                className="w-9 h-9 rounded-xl shadow-sm group-hover:shadow-sakura transition-shadow duration-300" 
              />
            </div>
            <span className="text-lg font-bold gradient-text hidden sm:block">
              NEXUSAKURA
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive(item.path)
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}

            {/* DEX Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isDexActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  DEX
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                {dexNavItems.map((item) => (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link
                      to={item.path}
                      className={cn(
                        "w-full cursor-pointer",
                        isActive(item.path) && "bg-primary/10 text-primary"
                      )}
                    >
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* More Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200">
                  More
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {moreNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link
                        to={item.path}
                        className={cn(
                          "w-full cursor-pointer flex items-center gap-2",
                          isActive(item.path) && "bg-primary/10 text-primary"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            <div className="hidden sm:block">
              <ConnectWallet />
            </div>
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border/50 animate-fade-in">
            <div className="grid grid-cols-2 gap-2 mb-4">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg text-sm font-medium transition-all",
                      isActive(item.path)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            
            {/* DEX Links */}
            <div className="mb-4">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-1">DEX</div>
              <div className="grid grid-cols-2 gap-2">
                {dexNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "p-3 rounded-lg text-sm font-medium text-center transition-all",
                      isActive(item.path)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* More Links */}
            <div className="grid grid-cols-3 gap-2">
              {moreNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-lg text-xs font-medium transition-all",
                      isActive(item.path)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            
            {/* Mobile Connect Wallet */}
            <div className="mt-4 sm:hidden">
              <ConnectWallet />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
