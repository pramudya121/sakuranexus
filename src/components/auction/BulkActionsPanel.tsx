import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  XCircle, 
  CheckSquare, 
  Square,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { AuctionData, endAuction, cancelAuction } from '@/lib/web3/auction';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BulkActionsPanelProps {
  auctions: AuctionData[];
  account: string;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onActionComplete: () => void;
}

const BulkActionsPanel = memo(({
  auctions,
  account,
  selectedIds,
  onSelectionChange,
  onActionComplete,
}: BulkActionsPanelProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAction, setCurrentAction] = useState<'finalize' | 'cancel' | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'finalize' | 'cancel' | null>(null);

  // Get eligible auctions for each action
  const finalizableAuctions = auctions.filter(a => {
    const isEnded = a.status === 'ended' || a.endTime <= Date.now();
    return selectedIds.has(a.id) && isEnded && a.totalBids > 0;
  });

  const cancellableAuctions = auctions.filter(a => {
    const isEnded = a.status === 'ended' || a.endTime <= Date.now();
    return selectedIds.has(a.id) && !isEnded && a.totalBids === 0;
  });

  const selectAll = () => {
    onSelectionChange(new Set(auctions.map(a => a.id)));
  };

  const deselectAll = () => {
    onSelectionChange(new Set());
  };

  const toggleSelection = (auctionId: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(auctionId)) {
      newSelection.delete(auctionId);
    } else {
      newSelection.add(auctionId);
    }
    onSelectionChange(newSelection);
  };

  const handleBulkAction = async (action: 'finalize' | 'cancel') => {
    setPendingAction(action);
    setShowConfirmDialog(true);
  };

  const executeBulkAction = async () => {
    if (!pendingAction) return;
    
    setShowConfirmDialog(false);
    setIsProcessing(true);
    setCurrentAction(pendingAction);

    const targetAuctions = pendingAction === 'finalize' ? finalizableAuctions : cancellableAuctions;
    let successCount = 0;
    let failCount = 0;

    for (const auction of targetAuctions) {
      try {
        if (pendingAction === 'finalize') {
          const result = await endAuction(auction.id, account);
          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        } else {
          const result = await cancelAuction(auction.id, account);
          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        }
        // Small delay between actions
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        failCount++;
      }
    }

    toast({
      title: pendingAction === 'finalize' ? 'Bulk Finalize Complete' : 'Bulk Cancel Complete',
      description: `${successCount} succeeded, ${failCount} failed`,
      variant: failCount > 0 ? 'destructive' : 'default',
    });

    setIsProcessing(false);
    setCurrentAction(null);
    setPendingAction(null);
    onSelectionChange(new Set());
    onActionComplete();
  };

  if (auctions.length === 0) return null;

  return (
    <>
      <Card className="glass mb-4">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Selection Controls */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectedIds.size === auctions.length ? deselectAll : selectAll}
                className="gap-2"
              >
                {selectedIds.size === auctions.length ? (
                  <>
                    <CheckSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">Deselect All</span>
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4" />
                    <span className="hidden sm:inline">Select All</span>
                  </>
                )}
              </Button>

              {selectedIds.size > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedIds.size} selected
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {finalizableAuctions.length > 0 && (
                <Button
                  size="sm"
                  className="btn-hero gap-2"
                  onClick={() => handleBulkAction('finalize')}
                  disabled={isProcessing}
                >
                  {isProcessing && currentAction === 'finalize' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trophy className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Finalize</span>
                  <Badge variant="secondary" className="text-xs ml-1">
                    {finalizableAuctions.length}
                  </Badge>
                </Button>
              )}

              {cancellableAuctions.length > 0 && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-2"
                  onClick={() => handleBulkAction('cancel')}
                  disabled={isProcessing}
                >
                  {isProcessing && currentAction === 'cancel' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Cancel</span>
                  <Badge variant="secondary" className="text-xs ml-1 bg-white/20">
                    {cancellableAuctions.length}
                  </Badge>
                </Button>
              )}
            </div>
          </div>

          {/* Selection Checkboxes List */}
          {selectedIds.size > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="flex flex-wrap gap-2">
                {auctions.map((auction) => (
                  <label
                    key={auction.id}
                    className="flex items-center gap-2 text-sm bg-muted/30 px-2 py-1 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedIds.has(auction.id)}
                      onCheckedChange={() => toggleSelection(auction.id)}
                    />
                    <span className="truncate max-w-[120px]">{auction.nft.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirm Bulk {pendingAction === 'finalize' ? 'Finalize' : 'Cancel'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === 'finalize' ? (
                <>
                  You are about to finalize <strong>{finalizableAuctions.length}</strong> auction(s).
                  This will transfer NFTs to the highest bidders and is irreversible.
                </>
              ) : (
                <>
                  You are about to cancel <strong>{cancellableAuctions.length}</strong> auction(s).
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeBulkAction}>
              {pendingAction === 'finalize' ? 'Finalize All' : 'Cancel All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

BulkActionsPanel.displayName = 'BulkActionsPanel';

export default BulkActionsPanel;
