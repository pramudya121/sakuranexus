import { useState, useEffect } from 'react';
import { getCurrentAccount } from '@/lib/web3/wallet';
import { OfferNotificationListener } from './OfferNotificationListener';

interface AppWrapperProps {
  children: React.ReactNode;
}

export const AppWrapper = ({ children }: AppWrapperProps) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    const loadWallet = async () => {
      const account = await getCurrentAccount();
      setWalletAddress(account);
    };

    loadWallet();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setWalletAddress(accounts[0] || null);
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
