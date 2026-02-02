import { FloatingDock } from "@/components/ui/floating-dock";
import { Home, Store, ArrowLeftRight, Droplets, LayoutDashboard } from "lucide-react";

const dockItems = [
  {
    title: "Home",
    icon: <Home className="w-5 h-5" />,
    href: "/",
  },
  {
    title: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    href: "/dashboard",
  },
  {
    title: "Marketplace",
    icon: <Store className="w-5 h-5" />,
    href: "/marketplace",
  },
  {
    title: "Swap",
    icon: <ArrowLeftRight className="w-5 h-5" />,
    href: "/dex/swap",
  },
  {
    title: "Liquidity",
    icon: <Droplets className="w-5 h-5" />,
    href: "/dex/liquidity",
  },
];

export function MobileFloatingDock() {
  return (
    <FloatingDock
      items={dockItems}
      className="lg:hidden"
      mobileClassName="max-w-[90vw]"
    />
  );
}
