import { useState, useEffect } from 'react';
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
  Gavel,
  Heart,
  Sparkles,
  FolderOpen,
  Brain,
  BookOpen,
  Coins,
  Droplets
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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const Navigation = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const mainNavItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/marketplace', label: 'Marketplace', icon: Store },
  ];

  const dexNavItems = [
    { path: '/dex/swap', label: 'Swap', icon: ArrowLeftRight },
    { path: '/dex/liquidity', label: 'Liquidity', icon: Droplets },
    { path: '/dex/pools', label: 'Pools', icon: Coins },
    { path: '/dex/staking', label: 'Staking', icon: Sparkles },
    { path: '/dex/history', label: 'History', icon: Activity },
  ];

  const nftNavItems = [
    { path: '/mint', label: 'Mint NFT', icon: Palette },
    { path: '/collections', label: 'Collections', icon: FolderOpen },
    { path: '/auctions', label: 'Auctions', icon: Gavel },
    { path: '/watchlist', label: 'Watchlist', icon: Heart },
  ];

  const moreNavItems = [
    { path: '/activity', label: 'Activity', icon: Activity },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    
    { path: '/ai-features', label: 'AI Hub', icon: Brain },
    { path: '/guide', label: 'Guide', icon: BookOpen },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isDexActive = location.pathname.startsWith('/dex');
  const isNftActive = nftNavItems.some(item => isActive(item.path));

  return (
    <>
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled 
          ? "bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm" 
          : "bg-background/60 backdrop-blur-md"
      )}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
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
            <div className="hidden lg:flex items-center gap-0.5">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive(item.path)
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
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
                      "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isDexActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    )}
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    DEX
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  {dexNavItems.map((item) => {
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

              {/* NFT Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isNftActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    )}
                  >
                    <Palette className="w-4 h-4" />
                    NFT
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  {nftNavItems.map((item) => {
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

              {/* More Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200">
                    More
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {moreNavItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.path}>
                        {index === 4 && <DropdownMenuSeparator />}
                        <DropdownMenuItem asChild>
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
                      </div>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <NotificationBell />
              <div className="hidden sm:block ml-1">
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
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="absolute inset-0 bg-background/60 backdrop-blur-sm" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          <div className="absolute top-16 left-0 right-0 max-h-[calc(100vh-4rem)] overflow-y-auto bg-background border-b border-border/50 shadow-xl animate-fade-in">
            <div className="container mx-auto px-4 py-6 space-y-6">
              {/* Main Nav */}
              <div className="grid grid-cols-3 gap-2">
                {mainNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-all",
                        isActive(item.path)
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
              
              {/* DEX Section */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  DEX
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {dexNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-all",
                          isActive(item.path)
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* NFT Section */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  NFT
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {nftNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-xl text-xs font-medium transition-all",
                          isActive(item.path)
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* More Section */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  More
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {moreNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-all",
                          isActive(item.path)
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
              
              {/* Mobile Connect Wallet */}
              <div className="sm:hidden pt-2">
                <ConnectWallet />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;
