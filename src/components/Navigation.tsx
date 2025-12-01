import { Link, useLocation } from 'react-router-dom';
import { Home, Store, Palette, Activity, User, Trophy, BarChart3 } from 'lucide-react';
import ConnectWallet from './ConnectWallet';
import NotificationBell from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';
import sakuraLogo from '@/assets/sakura-logo.png';

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/marketplace', label: 'Marketplace', icon: Store },
    { path: '/collections', label: 'Collections', icon: Store },
    { path: '/mint', label: 'Mint NFT', icon: Palette },
    { path: '/activity', label: 'Activity', icon: Activity },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src={sakuraLogo} alt="NEXUSAKURA" className="w-10 h-10 rounded-full" />
            <span className="text-xl font-bold gradient-text">NEXUSAKURA</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-2 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sakura'
                      : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Theme Toggle, Notifications & Connect Wallet */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            <ConnectWallet />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-border/50">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
