import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AIChat from "@/components/AIChat";
import { AppWrapper } from "@/components/AppWrapper";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import Mint from "./pages/Mint";
import Activity from "./pages/Activity";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import NFTDetail from "./pages/NFTDetail";
import Leaderboard from "./pages/Leaderboard";
import Analytics from "./pages/Analytics";
import Collections from "./pages/Collections";
import NotFound from "./pages/NotFound";
import Swap from "./pages/dex/Swap";
import Liquidity from "./pages/dex/Liquidity";
import Pools from "./pages/dex/Pools";
import PoolDetail from "./pages/dex/PoolDetail";
import TokenAnalytics from "./pages/dex/TokenAnalytics";
import Staking from "./pages/dex/Staking";
import TransactionHistoryPage from "./pages/dex/TransactionHistoryPage";
import NFTAnalytics from "./pages/NFTAnalytics";
import TokenDetail from "./pages/TokenDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppWrapper>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/mint" element={<Mint />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/nft/:tokenId" element={<NFTDetail />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/nft-analytics" element={<NFTAnalytics />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/dex/swap" element={<Swap />} />
            <Route path="/dex/liquidity" element={<Liquidity />} />
            <Route path="/dex/pools" element={<Pools />} />
            <Route path="/dex/staking" element={<Staking />} />
            <Route path="/dex/history" element={<TransactionHistoryPage />} />
            <Route path="/dex/pool/:pairAddress" element={<PoolDetail />} />
            <Route path="/dex/token/:tokenAddress" element={<TokenAnalytics />} />
            <Route path="/token/:address" element={<TokenDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <AIChat />
        </AppWrapper>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
