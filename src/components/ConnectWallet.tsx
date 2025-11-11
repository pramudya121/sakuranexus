import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Wallet } from 'lucide-react';
import { connectWallet, getCurrentAccount, formatAddress } from '@/lib/web3/wallet';
import { useToast } from '@/hooks/use-toast';

const ConnectWallet = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAccount(accounts[0] || null);
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  const checkConnection = async () => {
    const currentAccount = await getCurrentAccount();
    setAccount(currentAccount);
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const connectedAccount = await connectWallet();
      if (connectedAccount) {
        setAccount(connectedAccount);
        toast({
          title: 'Wallet Connected!',
          description: `Connected to ${formatAddress(connectedAccount)}`,
        });
      }
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect wallet. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  if (account) {
    return (
      <Button variant="outline" size="sm" className="font-medium">
        <Wallet className="mr-2 h-4 w-4" />
        {formatAddress(account)}
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleConnect} 
      disabled={isConnecting}
      className="bg-gradient-sakura hover:shadow-sakura font-semibold"
      size="sm"
    >
      <Wallet className="mr-2 h-4 w-4" />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
};

export default ConnectWallet;
