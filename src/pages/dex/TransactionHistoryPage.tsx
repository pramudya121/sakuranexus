import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import DEXNavigation from '@/components/dex/DEXNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, Search, ExternalLink, Filter, Download, RefreshCw, History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { DEFAULT_TOKENS } from '@/lib/web3/dex-config';

interface Transaction {
  id: string;
  type: 'swap' | 'add_liquidity' | 'remove_liquidity' | 'stake' | 'unstake' | 'claim';
  hash: string;
  timestamp: number;
  tokenIn?: string;
  tokenOut?: string;
  amountIn?: string;
  amountOut?: string;
  status: 'success' | 'pending' | 'failed';
  gasUsed?: string;
  gasFee?: string;
}

const generateMockTransactions = (): Transaction[] => {
  const types: Transaction['type'][] = ['swap', 'add_liquidity', 'remove_liquidity', 'stake', 'unstake', 'claim'];
  const tokens = DEFAULT_TOKENS.map(t => t.symbol);
  const transactions: Transaction[] = [];

  for (let i = 0; i < 25; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const tokenIn = tokens[Math.floor(Math.random() * tokens.length)];
    let tokenOut = tokens[Math.floor(Math.random() * tokens.length)];
    while (tokenOut === tokenIn) {
      tokenOut = tokens[Math.floor(Math.random() * tokens.length)];
    }

    transactions.push({
      id: `tx-${i}`,
      type,
      hash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
      timestamp: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
      tokenIn,
      tokenOut,
      amountIn: (Math.random() * 1000).toFixed(4),
      amountOut: (Math.random() * 1000).toFixed(4),
      status: Math.random() > 0.1 ? 'success' : Math.random() > 0.5 ? 'pending' : 'failed',
      gasUsed: (Math.random() * 200000 + 50000).toFixed(0),
      gasFee: (Math.random() * 0.01).toFixed(6),
    });
  }

  return transactions.sort((a, b) => b.timestamp - a.timestamp);
};

const TransactionHistoryPage = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockData = generateMockTransactions();
      setTransactions(mockData);
      setFilteredTransactions(mockData);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTransactions();
    setIsRefreshing(false);
    toast.success('Transactions refreshed');
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    let filtered = [...transactions];

    if (searchQuery) {
      filtered = filtered.filter(tx =>
        tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.tokenIn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.tokenOut?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(tx => tx.type === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchQuery, typeFilter, statusFilter]);

  const getTypeLabel = (type: Transaction['type']) => {
    const labels: Record<Transaction['type'], string> = {
      swap: 'Swap',
      add_liquidity: 'Add Liquidity',
      remove_liquidity: 'Remove Liquidity',
      stake: 'Stake',
      unstake: 'Unstake',
      claim: 'Claim Rewards'
    };
    return labels[type];
  };

  const getTypeColor = (type: Transaction['type']) => {
    const colors: Record<Transaction['type'], string> = {
      swap: 'bg-primary/20 text-primary',
      add_liquidity: 'bg-green-500/20 text-green-500',
      remove_liquidity: 'bg-orange-500/20 text-orange-500',
      stake: 'bg-accent/20 text-accent-foreground',
      unstake: 'bg-destructive/20 text-destructive',
      claim: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
    };
    return colors[type];
  };

  const getStatusBadge = (status: Transaction['status']) => {
    const styles: Record<Transaction['status'], string> = {
      success: 'bg-green-500/20 text-green-500',
      pending: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
      failed: 'bg-destructive/20 text-destructive'
    };
    return <Badge className={styles[status]}>{status}</Badge>;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const exportTransactions = () => {
    const csv = [
      ['Date', 'Type', 'Hash', 'Token In', 'Amount In', 'Token Out', 'Amount Out', 'Status', 'Gas Fee'].join(','),
      ...filteredTransactions.map(tx => [
        formatDate(tx.timestamp),
        tx.type,
        tx.hash,
        tx.tokenIn || '',
        tx.amountIn || '',
        tx.tokenOut || '',
        tx.amountOut || '',
        tx.status,
        tx.gasFee || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${Date.now()}.csv`;
    a.click();
    toast.success('Transactions exported');
  };

  const totalSwaps = transactions.filter(t => t.type === 'swap').length;
  const totalLiquidity = transactions.filter(t => t.type === 'add_liquidity' || t.type === 'remove_liquidity').length;
  const totalStaking = transactions.filter(t => t.type === 'stake' || t.type === 'unstake' || t.type === 'claim').length;

  return (
    <div className="min-h-screen bg-background">
      <SakuraFalling />
      <Navigation />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <DEXNavigation />

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <History className="w-4 h-4" />
            TRANSACTION HISTORY
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">Your Activity</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            View and export all your DEX transactions
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Swaps</p>
                  <p className="text-3xl font-bold text-primary">{totalSwaps}</p>
                </div>
                <ArrowUpDown className="w-8 h-8 text-primary opacity-40" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Liquidity Txns</p>
                  <p className="text-3xl font-bold text-accent-foreground">{totalLiquidity}</p>
                </div>
                <Filter className="w-8 h-8 text-accent-foreground opacity-40" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-secondary to-secondary/50 border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Staking Txns</p>
                  <p className="text-3xl font-bold text-foreground">{totalStaking}</p>
                </div>
                <Filter className="w-8 h-8 text-muted-foreground opacity-40" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-end gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportTransactions}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by hash or token..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="swap">Swap</SelectItem>
                  <SelectItem value="add_liquidity">Add Liquidity</SelectItem>
                  <SelectItem value="remove_liquidity">Remove Liquidity</SelectItem>
                  <SelectItem value="stake">Stake</SelectItem>
                  <SelectItem value="unstake">Unstake</SelectItem>
                  <SelectItem value="claim">Claim</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transaction List */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Transactions</span>
              <span className="text-sm font-normal text-muted-foreground">
                Showing {filteredTransactions.length} of {transactions.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-24 h-6" />
                      <Skeleton className="w-32 h-4" />
                    </div>
                    <Skeleton className="w-20 h-6" />
                  </div>
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No transactions found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors gap-4 border border-border/30"
                  >
                    <div className="flex items-center gap-4">
                      <Badge className={getTypeColor(tx.type)}>
                        {getTypeLabel(tx.type)}
                      </Badge>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{tx.hash}</span>
                          <a
                            href={`https://nexus.testnet.blockscout.com/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(tx.timestamp)}
                        </p>
                      </div>
                    </div>

                    {tx.type === 'swap' && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-destructive">-{tx.amountIn} {tx.tokenIn}</span>
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                        <span className="text-green-500">+{tx.amountOut} {tx.tokenOut}</span>
                      </div>
                    )}

                    {(tx.type === 'add_liquidity' || tx.type === 'stake') && (
                      <div className="text-sm text-green-500">
                        +{tx.amountIn} {tx.tokenIn}
                      </div>
                    )}

                    {(tx.type === 'remove_liquidity' || tx.type === 'unstake') && (
                      <div className="text-sm text-destructive">
                        -{tx.amountIn} {tx.tokenIn}
                      </div>
                    )}

                    {tx.type === 'claim' && (
                      <div className="text-sm text-primary">
                        +{tx.amountOut} Rewards
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      {tx.gasFee && (
                        <span className="text-xs text-muted-foreground">
                          Gas: {tx.gasFee} NEX
                        </span>
                      )}
                      {getStatusBadge(tx.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TransactionHistoryPage;
