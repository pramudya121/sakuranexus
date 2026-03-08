import { FloatingDock } from "@/components/ui/floating-dock";
import { Home, Store, ArrowLeftRight, LayoutDashboard, Coins } from "lucide-react";

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
    title: "Swap",
    icon: <ArrowLeftRight className="w-5 h-5" />,
    href: "/dex/swap",
  },
  {
    title: "Market",
    icon: <Store className="w-5 h-5" />,
    href: "/marketplace",
  },
  {
    title: "Staking",
    icon: <Coins className="w-5 h-5" />,
    href: "/dex/staking",
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
