import { Link, useLocation } from 'react-router-dom';
import { ArrowLeftRight, Droplets, Waves } from 'lucide-react';

const DEXNavigation = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dex/swap', label: 'Swap', icon: ArrowLeftRight },
    { path: '/dex/liquidity', label: 'Liquidity', icon: Droplets },
    { path: '/dex/pools', label: 'Pools', icon: Waves },
  ];

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
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
  );
};

export default DEXNavigation;
