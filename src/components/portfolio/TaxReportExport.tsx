import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  FileDown, 
  Calendar as CalendarIcon,
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { format, subDays, startOfYear, endOfYear } from 'date-fns';
import { cn } from '@/lib/utils';

interface Transaction {
  date: string;
  type: 'buy' | 'sell' | 'swap' | 'transfer' | 'stake' | 'unstake' | 'lp_add' | 'lp_remove';
  asset: string;
  amount: number;
  priceUSD: number;
  totalUSD: number;
  fee: number;
  txHash: string;
}

interface TaxReportExportProps {
  walletAddress: string;
}

// Mock transaction data
const generateMockTransactions = (): Transaction[] => {
  const types: Transaction['type'][] = ['buy', 'sell', 'swap', 'stake', 'unstake', 'lp_add', 'lp_remove'];
  const assets = ['NEX', 'NXSA', 'WETH', 'BNB', 'USDC'];
  const transactions: Transaction[] = [];
  
  for (let i = 0; i < 50; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const asset = assets[Math.floor(Math.random() * assets.length)];
    const amount = Math.random() * 1000;
    const priceUSD = Math.random() * 100;
    
    transactions.push({
      date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      type,
      asset,
      amount,
      priceUSD,
      totalUSD: amount * priceUSD,
      fee: amount * priceUSD * 0.003,
      txHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
    });
  }
  
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const TaxReportExport = ({ walletAddress }: TaxReportExportProps) => {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfYear(new Date()),
    to: new Date(),
  });
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  
  const transactions = generateMockTransactions();
  
  // Calculate tax summary
  const taxSummary = {
    totalTrades: transactions.length,
    totalVolume: transactions.reduce((sum, t) => sum + t.totalUSD, 0),
    totalFees: transactions.reduce((sum, t) => sum + t.fee, 0),
    realizedGains: transactions
      .filter(t => t.type === 'sell')
      .reduce((sum, t) => sum + t.totalUSD * 0.15, 0), // Mock 15% profit
    realizedLosses: transactions
      .filter(t => t.type === 'sell')
      .reduce((sum, t) => sum + t.totalUSD * 0.05, 0), // Mock 5% losses
    shortTermGains: transactions
      .filter(t => t.type === 'sell')
      .reduce((sum, t) => sum + t.totalUSD * 0.10, 0),
    longTermGains: transactions
      .filter(t => t.type === 'sell')
      .reduce((sum, t) => sum + t.totalUSD * 0.05, 0),
  };

  const netGains = taxSummary.realizedGains - taxSummary.realizedLosses;

  const handleExport = async () => {
    setIsExporting(true);
    
    // Simulate export
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate CSV content
    if (exportFormat === 'csv') {
      const headers = ['Date', 'Type', 'Asset', 'Amount', 'Price (USD)', 'Total (USD)', 'Fee (USD)', 'TX Hash'];
      const rows = transactions.map(t => [
        format(new Date(t.date), 'yyyy-MM-dd HH:mm:ss'),
        t.type,
        t.asset,
        t.amount.toFixed(6),
        t.priceUSD.toFixed(4),
        t.totalUSD.toFixed(2),
        t.fee.toFixed(4),
        t.txHash,
      ]);
      
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax-report-${year}-${walletAddress.slice(0, 8)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (exportFormat === 'json') {
      const jsonContent = JSON.stringify({ 
        wallet: walletAddress,
        year,
        summary: taxSummary,
        transactions 
      }, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax-report-${year}-${walletAddress.slice(0, 8)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
    
    setIsExporting(false);
    setExportComplete(true);
    setTimeout(() => setExportComplete(false), 3000);
  };

  return (
    <Card className="glass border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-primary" />
            Tax Report Export
          </CardTitle>
          <Badge variant="outline" className="gap-1">
            {transactions.length} Transactions
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tax Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-secondary/30 rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Volume</p>
            <p className="text-xl font-bold">
              ${taxSummary.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          
          <div className="bg-secondary/30 rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Fees</p>
            <p className="text-xl font-bold">
              ${taxSummary.totalFees.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className={cn(
            "rounded-xl p-4",
            netGains >= 0 ? "bg-green-500/10" : "bg-red-500/10"
          )}>
            <p className="text-sm text-muted-foreground mb-1">Net Gains/Losses</p>
            <p className={cn(
              "text-xl font-bold",
              netGains >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {netGains >= 0 ? '+' : ''}{netGains.toLocaleString(undefined, { maximumFractionDigits: 2, style: 'currency', currency: 'USD' })}
            </p>
          </div>
          
          <div className="bg-secondary/30 rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-1">Tax Liability (Est.)</p>
            <p className="text-xl font-bold text-amber-500">
              ${(netGains * 0.25).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">~25% rate</p>
          </div>
        </div>

        {/* Capital Gains Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm font-medium">Short-Term Gains</span>
            </div>
            <p className="text-lg font-bold">
              ${taxSummary.shortTermGains.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">Held &lt; 1 year</p>
          </div>
          
          <div className="bg-secondary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm font-medium">Long-Term Gains</span>
            </div>
            <p className="text-lg font-bold">
              ${taxSummary.longTermGains.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">Held &gt; 1 year</p>
          </div>
        </div>

        {/* Export Options */}
        <div className="border-t border-border/50 pt-4">
          <h4 className="text-sm font-medium mb-3">Export Options</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Year Selection */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Tax Year</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Format Selection */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Format</label>
              <Select value={exportFormat} onValueChange={(v: 'csv' | 'json' | 'pdf') => setExportFormat(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      CSV (Excel)
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      JSON
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf" disabled>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      PDF (Coming Soon)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export Button */}
            <div className="flex items-end">
              <Button 
                onClick={handleExport} 
                disabled={isExporting}
                className="w-full gap-2"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : exportComplete ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Exported!
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-amber-500">Tax Disclaimer</p>
            <p className="text-muted-foreground">
              This report is for informational purposes only. Please consult a tax professional for 
              accurate tax advice. Calculations are estimates based on available data.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaxReportExport;
