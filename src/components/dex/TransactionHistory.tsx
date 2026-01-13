import { useState, useEffect, memo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRightLeft, Plus, Minus, ExternalLink, RefreshCw, Clock } from 'lucide-react';
import { ethers } from 'ethers';
import { DEX_CONTRACTS, DEFAULT_TOKENS } from '@/lib/web3/dex-config';
import { getCurrentAccount } from '@/lib/web3/wallet';

interface Transaction {
  hash: string;
  type: 'swap' | 'add_liquidity' | 'remove_liquidity';
  tokenIn?: string;
  tokenOut?: string;
  amountIn?: string;
  amountOut?: string;
  timestamp: number;
  status: 'success' | 'pending' | 'failed';
}

// Store transactions in localStorage
const STORAGE_KEY = 'dex_transactions';

export const saveTransaction = (tx: Transaction) => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const transactions: Transaction[] = stored ? JSON.parse(stored) : [];
  transactions.unshift(tx);
  // Keep only last 50 transactions
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions.slice(0, 50)));
};

export const getTransactions = (): Transaction[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    loadAccount();
  }, []);

  useEffect(() => {
    if (account) {
      loadTransactions();
    }
  }, [account]);

  const loadAccount = async () => {
    const acc = await getCurrentAccount();
    setAccount(acc);
  };

  const loadTransactions = () => {
    setIsLoading(true);
    // Load from localStorage
    const storedTxs = getTransactions();
    setTransactions(storedTxs);
    setIsLoading(false);
  };

  const getTokenSymbol = (address: string) => {
    const token = DEFAULT_TOKENS.find(t => t.address.toLowerCase() === address.toLowerCase());
    return token?.symbol || address.slice(0, 6) + '...';
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString();
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'swap':
        return <ArrowRightLeft className="w-4 h-4" />;
      case 'add_liquidity':
        return <Plus className="w-4 h-4" />;
      case 'remove_liquidity':
        return <Minus className="w-4 h-4" />;
      default:
        return <ArrowRightLeft className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/50">Success</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return null;
    }
  };

  const swapTxs = transactions.filter(tx => tx.type === 'swap');
  const liquidityTxs = transactions.filter(tx => tx.type === 'add_liquidity' || tx.type === 'remove_liquidity');

  const TransactionItem = ({ tx }: { tx: Transaction }) => (
    <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg hover:bg-secondary/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          tx.type === 'swap' ? 'bg-primary/20 text-primary' :
          tx.type === 'add_liquidity' ? 'bg-green-500/20 text-green-500' :
          'bg-red-500/20 text-red-500'
        }`}>
          {getTransactionIcon(tx.type)}
        </div>
        <div>
          <div className="font-medium text-sm">
            {tx.type === 'swap' ? (
              <>Swap {tx.amountIn} {tx.tokenIn} → {tx.amountOut} {tx.tokenOut}</>
            ) : tx.type === 'add_liquidity' ? (
              <>Add Liquidity: {tx.tokenIn}/{tx.tokenOut}</>
            ) : (
              <>Remove Liquidity: {tx.tokenIn}/{tx.tokenOut}</>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatTimestamp(tx.timestamp)}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {getStatusBadge(tx.status)}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => window.open(`https://nexus.testnet.blockscout.com/tx/${tx.hash}`, '_blank')}
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Clock className="w-12 h-12 mb-4 opacity-50" />
      <p>{message}</p>
    </div>
  );

  if (!account) {
    return (
      <Card className="glass border-border/50 p-6">
        <div className="text-center text-muted-foreground">
          Connect wallet to view transaction history
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass border-border/50 overflow-hidden">
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="text-lg font-bold">Transaction History</h3>
        <Button variant="ghost" size="icon" onClick={loadTransactions}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 p-1 m-4 mb-0 w-[calc(100%-2rem)]">
          <TabsTrigger value="all">All ({transactions.length})</TabsTrigger>
          <TabsTrigger value="swaps">Swaps ({swapTxs.length})</TabsTrigger>
          <TabsTrigger value="liquidity">Liquidity ({liquidityTxs.length})</TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[400px]">
          <div className="p-4 space-y-2">
            <TabsContent value="all" className="mt-0">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full mb-2" />
                ))
              ) : transactions.length === 0 ? (
                <EmptyState message="No transactions yet" />
              ) : (
                transactions.map((tx, i) => <TransactionItem key={i} tx={tx} />)
              )}
            </TabsContent>

            <TabsContent value="swaps" className="mt-0">
              {swapTxs.length === 0 ? (
                <EmptyState message="No swap transactions" />
              ) : (
                swapTxs.map((tx, i) => <TransactionItem key={i} tx={tx} />)
              )}
            </TabsContent>

            <TabsContent value="liquidity" className="mt-0">
              {liquidityTxs.length === 0 ? (
                <EmptyState message="No liquidity transactions" />
              ) : (
                liquidityTxs.map((tx, i) => <TransactionItem key={i} tx={tx} />)
              )}
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </Card>
  );
};

export default TransactionHistory;
