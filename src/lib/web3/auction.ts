import { ethers } from 'ethers';
import { getProvider, getSigner, getCurrentAccount } from './wallet';
import { CONTRACTS } from './config';
import { supabase } from '@/integrations/supabase/client';

// Auction Contract ABI (minimal interface for now)
export const AUCTION_ABI = [
  // Read functions
  'function getAuction(uint256 auctionId) view returns (tuple(address seller, address nftContract, uint256 tokenId, uint256 startPrice, uint256 currentBid, address highestBidder, uint256 endTime, bool active))',
  'function getActiveAuctions() view returns (uint256[])',
  'function auctionCount() view returns (uint256)',
  
  // Write functions
  'function createAuction(address nftContract, uint256 tokenId, uint256 startPrice, uint256 duration)',
  'function placeBid(uint256 auctionId) payable',
  'function endAuction(uint256 auctionId)',
  'function cancelAuction(uint256 auctionId)',
  
  // Events
  'event AuctionCreated(uint256 indexed auctionId, address indexed seller, address nftContract, uint256 tokenId, uint256 startPrice, uint256 endTime)',
  'event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount)',
  'event AuctionEnded(uint256 indexed auctionId, address indexed winner, uint256 amount)',
  'event AuctionCancelled(uint256 indexed auctionId)',
];

// Placeholder auction contract address (update when deployed)
export const AUCTION_CONTRACT = '0x0000000000000000000000000000000000000000';

export interface AuctionData {
  id: string;
  auctionId?: number;
  nft: {
    id: string;
    name: string;
    image_url: string;
    token_id: number;
    owner_address: string;
  };
  startPrice: number;
  currentBid: number;
  endTime: number;
  highestBidder: string;
  totalBids: number;
  minIncrement: number;
  seller: string;
  status: 'active' | 'ended' | 'cancelled';
}

export interface BidHistory {
  bidder: string;
  amount: number;
  timestamp: number;
  transactionHash?: string;
}

// Local storage key for auction data
const AUCTIONS_STORAGE_KEY = 'nex_auctions_data';
const BIDS_STORAGE_KEY = 'nex_bids_data';

// Get stored auctions from localStorage
const getStoredAuctions = (): AuctionData[] => {
  try {
    const stored = localStorage.getItem(AUCTIONS_STORAGE_KEY);
    if (stored) {
      const auctions = JSON.parse(stored) as AuctionData[];
      // Filter out expired auctions and update status
      return auctions.map(auction => ({
        ...auction,
        status: auction.endTime <= Date.now() ? 'ended' : auction.status,
      }));
    }
  } catch {
    // Ignore parse errors
  }
  return [];
};

// Save auctions to localStorage
const saveStoredAuctions = (auctions: AuctionData[]) => {
  try {
    localStorage.setItem(AUCTIONS_STORAGE_KEY, JSON.stringify(auctions));
  } catch {
    // Ignore storage errors
  }
};

// Get stored bids from localStorage
const getStoredBids = (): Record<string, BidHistory[]> => {
  try {
    const stored = localStorage.getItem(BIDS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return {};
};

// Save bids to localStorage
const saveStoredBids = (bids: Record<string, BidHistory[]>) => {
  try {
    localStorage.setItem(BIDS_STORAGE_KEY, JSON.stringify(bids));
  } catch {
    // Ignore storage errors
  }
};

// Generate mock auctions from database NFTs for demo
export const generateMockAuctions = (nfts: any[]): AuctionData[] => {
  const existingAuctions = getStoredAuctions();
  const existingNftIds = new Set(existingAuctions.map(a => a.nft.id));
  
  // Only generate new auctions for NFTs that don't already have one
  const newAuctions = nfts
    .filter(nft => !existingNftIds.has(nft.id))
    .slice(0, Math.max(0, 12 - existingAuctions.length))
    .map((nft) => {
      const startPrice = 0.5 + Math.random() * 2;
      const bidCount = Math.floor(Math.random() * 15);
      const currentBid = startPrice + bidCount * 0.1 + Math.random() * 0.5;
      const hoursLeft = Math.floor(Math.random() * 72) + 1;
      
      return {
        id: `auction-${nft.id}`,
        nft: {
          id: nft.id,
          name: nft.name,
          image_url: nft.image_url,
          token_id: nft.token_id,
          owner_address: nft.owner_address,
        },
        startPrice,
        currentBid,
        endTime: Date.now() + hoursLeft * 60 * 60 * 1000,
        highestBidder: bidCount > 0 
          ? `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`
          : '',
        totalBids: bidCount,
        minIncrement: 0.05,
        seller: nft.owner_address,
        status: 'active' as const,
      };
    });
  
  // Combine with existing auctions
  const allAuctions = [...existingAuctions, ...newAuctions];
  saveStoredAuctions(allAuctions);
  
  return allAuctions.filter(a => a.status === 'active');
};

// Load auctions from database
export const loadAuctions = async (): Promise<AuctionData[]> => {
  try {
    // First check localStorage for existing auctions
    const storedAuctions = getStoredAuctions().filter(a => a.status === 'active');
    if (storedAuctions.length >= 6) {
      return storedAuctions;
    }
    
    // Fetch NFTs from database to generate more auctions
    const { data: nfts, error } = await supabase
      .from('nfts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    if (nfts && nfts.length > 0) {
      return generateMockAuctions(nfts);
    }
    
    return storedAuctions;
  } catch (error) {
    console.error('Error loading auctions:', error);
    return getStoredAuctions().filter(a => a.status === 'active');
  }
};

// Get bid history for an auction
export const getBidHistory = (auctionId: string): BidHistory[] => {
  const allBids = getStoredBids();
  return allBids[auctionId] || [];
};

// Place bid on auction
export const placeBid = async (
  auctionId: string,
  amount: number,
  bidderAddress: string
): Promise<{ success: boolean; error?: string; newBid?: number }> => {
  try {
    // Validate inputs
    if (!bidderAddress) {
      return { success: false, error: 'Wallet not connected' };
    }
    if (amount <= 0) {
      return { success: false, error: 'Invalid bid amount' };
    }

    // Get current auction
    const auctions = getStoredAuctions();
    const auctionIndex = auctions.findIndex(a => a.id === auctionId);
    
    if (auctionIndex === -1) {
      return { success: false, error: 'Auction not found' };
    }
    
    const auction = auctions[auctionIndex];
    
    // Validate auction is still active
    if (auction.status !== 'active' || auction.endTime <= Date.now()) {
      return { success: false, error: 'Auction has ended' };
    }
    
    // Validate bid amount
    const minBid = auction.currentBid + auction.minIncrement;
    if (amount < minBid) {
      return { success: false, error: `Minimum bid is ${minBid.toFixed(4)} NEX` };
    }
    
    // Prevent self-bidding
    if (auction.seller.toLowerCase() === bidderAddress.toLowerCase()) {
      return { success: false, error: 'Cannot bid on your own auction' };
    }

    // Update auction
    auction.currentBid = amount;
    auction.highestBidder = `${bidderAddress.slice(0, 6)}...${bidderAddress.slice(-4)}`;
    auction.totalBids += 1;
    
    // Save updated auction
    auctions[auctionIndex] = auction;
    saveStoredAuctions(auctions);
    
    // Save bid history
    const allBids = getStoredBids();
    if (!allBids[auctionId]) {
      allBids[auctionId] = [];
    }
    allBids[auctionId].unshift({
      bidder: bidderAddress,
      amount,
      timestamp: Date.now(),
      transactionHash: `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`,
    });
    saveStoredBids(allBids);
    
    // Record the bid in activity log
    try {
      await supabase.from('activities').insert({
        activity_type: 'bid',
        from_address: bidderAddress.toLowerCase(),
        price: amount.toString(),
        contract_address: CONTRACTS.NFTCollection,
        token_id: auction.nft.token_id,
        transaction_hash: `0x${Date.now().toString(16)}`,
      });
    } catch {
      // Ignore activity log errors
    }

    return { success: true, newBid: amount };
  } catch (error: any) {
    console.error('Error placing bid:', error);
    return { success: false, error: error.message || 'Failed to place bid' };
  }
};

// Create auction
export const createAuction = async (
  nftId: string,
  tokenId: number,
  startPrice: number,
  durationHours: number,
  sellerAddress: string,
  nftData: { name: string; image_url: string }
): Promise<{ success: boolean; auctionId?: string; error?: string }> => {
  try {
    if (!sellerAddress) {
      return { success: false, error: 'Wallet not connected' };
    }
    
    if (startPrice <= 0) {
      return { success: false, error: 'Start price must be greater than 0' };
    }
    
    if (durationHours < 1 || durationHours > 168) {
      return { success: false, error: 'Duration must be between 1 and 168 hours' };
    }

    // Check if auction already exists for this NFT
    const existingAuctions = getStoredAuctions();
    const existingAuction = existingAuctions.find(
      a => a.nft.id === nftId && a.status === 'active'
    );
    
    if (existingAuction) {
      return { success: false, error: 'An active auction already exists for this NFT' };
    }

    // Create new auction
    const auctionId = `auction-${nftId}`;
    const newAuction: AuctionData = {
      id: auctionId,
      nft: {
        id: nftId,
        name: nftData.name,
        image_url: nftData.image_url,
        token_id: tokenId,
        owner_address: sellerAddress,
      },
      startPrice,
      currentBid: startPrice,
      endTime: Date.now() + durationHours * 60 * 60 * 1000,
      highestBidder: '',
      totalBids: 0,
      minIncrement: Math.max(0.01, startPrice * 0.05), // 5% minimum increment
      seller: sellerAddress,
      status: 'active',
    };
    
    // Save auction
    const allAuctions = [...existingAuctions, newAuction];
    saveStoredAuctions(allAuctions);
    
    return { success: true, auctionId };
  } catch (error: any) {
    console.error('Error creating auction:', error);
    return { success: false, error: error.message || 'Failed to create auction' };
  }
};

// End auction and transfer to winner
export const endAuction = async (
  auctionId: string,
  callerAddress: string
): Promise<{ success: boolean; winner?: string; amount?: number; error?: string }> => {
  try {
    const auctions = getStoredAuctions();
    const auctionIndex = auctions.findIndex(a => a.id === auctionId);
    
    if (auctionIndex === -1) {
      return { success: false, error: 'Auction not found' };
    }
    
    const auction = auctions[auctionIndex];
    
    // Only seller can end the auction
    if (auction.seller.toLowerCase() !== callerAddress.toLowerCase()) {
      return { success: false, error: 'Only the seller can end this auction' };
    }
    
    // Check if auction has ended
    if (auction.endTime > Date.now()) {
      return { success: false, error: 'Auction has not ended yet' };
    }
    
    // Update auction status
    auction.status = 'ended';
    auctions[auctionIndex] = auction;
    saveStoredAuctions(auctions);
    
    return { 
      success: true, 
      winner: auction.highestBidder,
      amount: auction.currentBid,
    };
  } catch (error: any) {
    console.error('Error ending auction:', error);
    return { success: false, error: error.message || 'Failed to end auction' };
  }
};

// Cancel auction
export const cancelAuction = async (
  auctionId: string,
  callerAddress: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const auctions = getStoredAuctions();
    const auctionIndex = auctions.findIndex(a => a.id === auctionId);
    
    if (auctionIndex === -1) {
      return { success: false, error: 'Auction not found' };
    }
    
    const auction = auctions[auctionIndex];
    
    // Only seller can cancel
    if (auction.seller.toLowerCase() !== callerAddress.toLowerCase()) {
      return { success: false, error: 'Only the seller can cancel this auction' };
    }
    
    // Cannot cancel if there are bids
    if (auction.totalBids > 0) {
      return { success: false, error: 'Cannot cancel auction with existing bids' };
    }
    
    // Update auction status
    auction.status = 'cancelled';
    auctions[auctionIndex] = auction;
    saveStoredAuctions(auctions);
    
    return { success: true };
  } catch (error: any) {
    console.error('Error cancelling auction:', error);
    return { success: false, error: error.message || 'Failed to cancel auction' };
  }
};

// Calculate countdown time remaining
export const calculateTimeRemaining = (endTime: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isEnded: boolean;
  isEndingSoon: boolean;
} => {
  const now = Date.now();
  const difference = endTime - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true, isEndingSoon: false };
  }

  const isEndingSoon = difference < 60 * 60 * 1000; // Less than 1 hour

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    isEnded: false,
    isEndingSoon,
  };
};

// Format bid amount
export const formatBidAmount = (amount: number): string => {
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  if (amount >= 1) {
    return amount.toFixed(2);
  }
  return amount.toFixed(4);
};

// Get auction statistics
export const getAuctionStats = (): {
  totalActive: number;
  endingSoon: number;
  totalVolume: number;
  totalBids: number;
} => {
  const auctions = getStoredAuctions().filter(a => a.status === 'active');
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  return {
    totalActive: auctions.length,
    endingSoon: auctions.filter(a => a.endTime - now < oneHour && a.endTime > now).length,
    totalVolume: auctions.reduce((sum, a) => sum + a.currentBid, 0),
    totalBids: auctions.reduce((sum, a) => sum + a.totalBids, 0),
  };
};