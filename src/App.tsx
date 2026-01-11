import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AIChat from "@/components/AIChat";
import { AppWrapper } from "@/components/AppWrapper";
import { PageLoadingSkeleton } from "@/components/ui/loading-skeleton";
import PriceAlertNotifier from "@/components/nft/PriceAlertNotifier";

// Lazy load all pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const Mint = lazy(() => import("./pages/Mint"));
const Activity = lazy(() => import("./pages/Activity"));
const Profile = lazy(() => import("./pages/Profile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const NFTDetail = lazy(() => import("./pages/NFTDetail"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Collections = lazy(() => import("./pages/Collections"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Swap = lazy(() => import("./pages/dex/Swap"));
const Liquidity = lazy(() => import("./pages/dex/Liquidity"));
const Pools = lazy(() => import("./pages/dex/Pools"));
const PoolDetail = lazy(() => import("./pages/dex/PoolDetail"));
const TokenAnalytics = lazy(() => import("./pages/dex/TokenAnalytics"));
const Staking = lazy(() => import("./pages/dex/Staking"));
const TransactionHistoryPage = lazy(() => import("./pages/dex/TransactionHistoryPage"));
const NFTAnalytics = lazy(() => import("./pages/NFTAnalytics"));
const TokenDetail = lazy(() => import("./pages/TokenDetail"));
const Auctions = lazy(() => import("./pages/Auctions"));
const AuctionDetail = lazy(() => import("./pages/AuctionDetail"));
const MyAuctions = lazy(() => import("./pages/MyAuctions"));
const Watchlist = lazy(() => import("./pages/Watchlist"));

// Optimized QueryClient with aggressive caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
      retryDelay: 1000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={200}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppWrapper>
          <Suspense fallback={<PageLoadingSkeleton />}>
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
              <Route path="/auctions" element={<Auctions />} />
              <Route path="/auction/:auctionId" element={<AuctionDetail />} />
              <Route path="/my-auctions" element={<MyAuctions />} />
              <Route path="/watchlist" element={<Watchlist />} />
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
          </Suspense>
          <AIChat />
          <PriceAlertNotifier />
        </AppWrapper>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
