import { ethers } from 'ethers';
import { getProvider, getSigner } from './wallet';
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

// Generate mock auctions from database NFTs for demo
export const generateMockAuctions = (nfts: any[]): AuctionData[] => {
  return nfts.slice(0, 12).map((nft, index) => {
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
      highestBidder: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
      totalBids: bidCount,
      minIncrement: 0.05,
      seller: nft.owner_address,
      status: 'active' as const,
    };
  });
};

// Load auctions from database
export const loadAuctions = async (): Promise<AuctionData[]> => {
  try {
    const { data: nfts, error } = await supabase
      .from('nfts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    if (nfts && nfts.length > 0) {
      return generateMockAuctions(nfts);
    }
    return [];
  } catch (error) {
    console.error('Error loading auctions:', error);
    return [];
  }
};

// Place bid on auction (simulated for now)
export const placeBid = async (
  auctionId: string,
  amount: number,
  bidderAddress: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate inputs
    if (!bidderAddress) {
      return { success: false, error: 'Wallet not connected' };
    }
    if (amount <= 0) {
      return { success: false, error: 'Invalid bid amount' };
    }

    // For now, simulate the bid placement
    // In production, this would interact with the auction contract
    
    // Record the bid in activity log
    const auctionIdParts = auctionId.split('-');
    const nftId = auctionIdParts.length > 1 ? auctionIdParts.slice(1).join('-') : auctionId;
    
    await supabase.from('activities').insert({
      activity_type: 'bid',
      from_address: bidderAddress.toLowerCase(),
      price: amount.toString(),
      contract_address: CONTRACTS.NFTCollection,
      token_id: 0, // Would be actual token_id in production
      transaction_hash: `0x${Date.now().toString(16)}`, // Mock hash
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error placing bid:', error);
    return { success: false, error: error.message || 'Failed to place bid' };
  }
};

// Create auction (simulated for now)
export const createAuction = async (
  tokenId: number,
  startPrice: number,
  durationHours: number,
  sellerAddress: string
): Promise<{ success: boolean; auctionId?: string; error?: string }> => {
  try {
    if (!sellerAddress) {
      return { success: false, error: 'Wallet not connected' };
    }

    // Verify NFT ownership
    const { data: nft, error: nftError } = await supabase
      .from('nfts')
      .select('*')
      .eq('token_id', tokenId)
      .eq('owner_address', sellerAddress.toLowerCase())
      .single();

    if (nftError || !nft) {
      return { success: false, error: 'You do not own this NFT' };
    }

    // For demo, return success with mock auction ID
    const auctionId = `auction-${nft.id}`;
    
    return { success: true, auctionId };
  } catch (error: any) {
    console.error('Error creating auction:', error);
    return { success: false, error: error.message || 'Failed to create auction' };
  }
};

// End auction and transfer to winner
export const endAuction = async (
  auctionId: string,
  winnerAddress: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // In production, this would call the smart contract
    // For now, just return success
    return { success: true };
  } catch (error: any) {
    console.error('Error ending auction:', error);
    return { success: false, error: error.message || 'Failed to end auction' };
  }
};

// Calculate countdown time remaining
export const calculateTimeRemaining = (endTime: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isEnded: boolean;
} => {
  const now = Date.now();
  const difference = endTime - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    isEnded: false,
  };
};

// Format bid amount
export const formatBidAmount = (amount: number): string => {
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K`;
  }
  return amount.toFixed(4);
};
