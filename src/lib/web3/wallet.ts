import { ethers } from 'ethers';
import { NEXUS_TESTNET, CONTRACTS, NFT_COLLECTION_ABI, MARKETPLACE_ABI, OFFER_CONTRACT_ABI } from './config';

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Retry wrapper for RPC calls with exponential backoff
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 2000
): Promise<T> => {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMsg = (error?.message || '').toLowerCase();
      
      // Don't retry user rejections or insufficient funds
      if (
        errorMsg.includes('user rejected') ||
        errorMsg.includes('user denied') ||
        errorMsg.includes('insufficient funds') ||
        errorMsg.includes('insufficient balance')
      ) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(`RPC call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
};

// Get provider from wallet
export const getProvider = (): ethers.BrowserProvider | null => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return null;
};

// Get signer (current connected account)
export const getSigner = async (): Promise<ethers.Signer | null> => {
  const provider = getProvider();
  if (!provider) return null;
  
  try {
    const signer = await provider.getSigner();
    return signer;
  } catch (error) {
    console.error('Error getting signer:', error);
    return null;
  }
};

// Connect wallet (MetaMask, OKX, Bitget)
export const connectWallet = async (): Promise<string | null> => {
  if (!window.ethereum) {
    alert('Please install MetaMask, OKX Wallet, or Bitget Wallet!');
    return null;
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    // Switch to Nexus Testnet
    await switchToNexusTestnet();

    return accounts[0];
  } catch (error: any) {
    console.error('Error connecting wallet:', error);
    if (error.code === 4001) {
      alert('Please connect your wallet to continue.');
    }
    return null;
  }
};

// Switch to Nexus Testnet
export const switchToNexusTestnet = async (): Promise<boolean> => {
  if (!window.ethereum) return false;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: NEXUS_TESTNET.chainIdHex }],
    });
    return true;
  } catch (switchError: any) {
    // Chain not added yet, add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: NEXUS_TESTNET.chainIdHex,
              chainName: NEXUS_TESTNET.name,
              nativeCurrency: NEXUS_TESTNET.nativeCurrency,
              rpcUrls: [NEXUS_TESTNET.rpcUrl],
              blockExplorerUrls: [NEXUS_TESTNET.blockExplorer],
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error('Error adding network:', addError);
        return false;
      }
    }
    console.error('Error switching network:', switchError);
    return false;
  }
};

// Get current connected account
export const getCurrentAccount = async (): Promise<string | null> => {
  if (!window.ethereum) return null;

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });
    return accounts[0] || null;
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
};

// Get NFTCollection contract
export const getSakuraNFTContract = async (): Promise<ethers.Contract | null> => {
  const signer = await getSigner();
  if (!signer) return null;

  return new ethers.Contract(CONTRACTS.NFTCollection, NFT_COLLECTION_ABI, signer);
};

// Get Marketplace contract
export const getSakuraMarketplaceContract = async (): Promise<ethers.Contract | null> => {
  const signer = await getSigner();
  if (!signer) return null;

  return new ethers.Contract(CONTRACTS.Marketplace, MARKETPLACE_ABI, signer);
};

// Get Offer contract
export const getOfferContract = async (): Promise<ethers.Contract | null> => {
  const signer = await getSigner();
  if (!signer) return null;

  return new ethers.Contract(CONTRACTS.OfferContract, OFFER_CONTRACT_ABI, signer);
};

// Format address for display (0x1234...5678)
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Format price from wei to NEX
export const formatPrice = (wei: bigint | string): string => {
  try {
    return ethers.formatEther(wei);
  } catch {
    return '0';
  }
};

// Parse price from NEX to wei
export const parsePrice = (price: string): bigint => {
  try {
    return ethers.parseEther(price);
  } catch {
    return BigInt(0);
  }
};
