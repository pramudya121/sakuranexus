import { useState, useEffect } from 'react';
import { getCurrentAccount } from '@/lib/web3/wallet';
import { setWalletAddress } from '@/integrations/supabase/client';
import { OfferNotificationListener } from './OfferNotificationListener';

interface AppWrapperProps {
  children: React.ReactNode;
}

export const AppWrapper = ({ children }: AppWrapperProps) => {
  const [walletAddress, setWalletAddressState] = useState<string | null>(null);

  useEffect(() => {
    const loadWallet = async () => {
      const account = await getCurrentAccount();
      setWalletAddressState(account);
      setWalletAddress(account);
    };

    loadWallet();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        const addr = accounts[0] || null;
        setWalletAddressState(addr);
        setWalletAddress(addr);
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  return (
    <>
      <OfferNotificationListener walletAddress={walletAddress} />
      {children}
    </>
  );
};
