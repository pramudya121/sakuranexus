import { ethers } from 'ethers';
import { CONTRACTS, NFT_COLLECTION_ABI, MARKETPLACE_ABI, OFFER_CONTRACT_ABI } from '@/lib/web3/config';
import { DEX_CONTRACTS, ERC20_ABI, UNISWAP_V2_ROUTER_ABI, UNISWAP_V2_PAIR_ABI } from '@/lib/web3/dex-config';
import { STAKING_CONTRACT, STAKING_ABI } from '@/lib/web3/staking-config';
import { getProvider, getSigner } from '@/lib/web3/wallet';

// ===== NFT COLLECTION CONTRACT =====
export const getNFTCollectionContract = async (readonly = false) => {
  const providerOrSigner = readonly ? getProvider() : await getSigner();
  if (!providerOrSigner) throw new Error('No provider/signer available');
  return new ethers.Contract(CONTRACTS.NFTCollection, NFT_COLLECTION_ABI, providerOrSigner);
};

export const nftCollection = {
  // Read functions
  async totalMinted(): Promise<bigint> {
    const contract = await getNFTCollectionContract(true);
    return contract.totalMinted();
  },

  async ownerOf(tokenId: number): Promise<string> {
    const contract = await getNFTCollectionContract(true);
    return contract.ownerOf(tokenId);
  },

  async balanceOf(address: string): Promise<bigint> {
    const contract = await getNFTCollectionContract(true);
    return contract.balanceOf(address);
  },

  async tokenURI(tokenId: number): Promise<string> {
    const contract = await getNFTCollectionContract(true);
    return contract.tokenURI(tokenId);
  },

  async getApproved(tokenId: number): Promise<string> {
    const contract = await getNFTCollectionContract(true);
    return contract.getApproved(tokenId);
  },

  // Write functions
  async mintNFT(to: string, uri: string): Promise<ethers.TransactionReceipt> {
    const contract = await getNFTCollectionContract();
    const tx = await contract.mintNFT(to, uri);
    return tx.wait();
  },

  async approve(to: string, tokenId: number): Promise<ethers.TransactionReceipt> {
    const contract = await getNFTCollectionContract();
    const tx = await contract.approve(to, tokenId);
    return tx.wait();
  },

  async transferFrom(from: string, to: string, tokenId: number): Promise<ethers.TransactionReceipt> {
    const contract = await getNFTCollectionContract();
    const tx = await contract.transferFrom(from, to, tokenId);
    return tx.wait();
  },
};

// ===== MARKETPLACE CONTRACT =====
export const getMarketplaceContract = async (readonly = false) => {
  const providerOrSigner = readonly ? getProvider() : await getSigner();
  if (!providerOrSigner) throw new Error('No provider/signer available');
  return new ethers.Contract(CONTRACTS.Marketplace, MARKETPLACE_ABI, providerOrSigner);
};

export const marketplace = {
  // Read functions
  async getListing(listingId: number) {
    const contract = await getMarketplaceContract(true);
    return contract.listings(listingId);
  },

  async getListingCount(): Promise<bigint> {
    const contract = await getMarketplaceContract(true);
    return contract.listingCount();
  },

  async getFee(): Promise<bigint> {
    const contract = await getMarketplaceContract(true);
    return contract.marketplaceFee();
  },

  // Write functions
  async listNFT(nft: string, tokenId: number, price: bigint): Promise<ethers.TransactionReceipt> {
    const contract = await getMarketplaceContract();
    const tx = await contract.listNFT(nft, tokenId, price);
    return tx.wait();
  },

  async buyNFT(listingId: number, price: bigint): Promise<ethers.TransactionReceipt> {
    const contract = await getMarketplaceContract();
    const tx = await contract.buyNFT(listingId, { value: price });
    return tx.wait();
  },

  // Admin functions
  async setFee(fee: bigint): Promise<ethers.TransactionReceipt> {
    const contract = await getMarketplaceContract();
    const tx = await contract.setFee(fee);
    return tx.wait();
  },
};

// ===== OFFER CONTRACT =====
export const getOfferContract = async (readonly = false) => {
  const providerOrSigner = readonly ? getProvider() : await getSigner();
  if (!providerOrSigner) throw new Error('No provider/signer available');
  return new ethers.Contract(CONTRACTS.OfferContract, OFFER_CONTRACT_ABI, providerOrSigner);
};

export const offers = {
  // Read functions
  async getOffer(nft: string, tokenId: number) {
    const contract = await getOfferContract(true);
    return contract.offers(nft, tokenId);
  },

  // Write functions
  async makeOffer(nft: string, tokenId: number, price: bigint): Promise<ethers.TransactionReceipt> {
    const contract = await getOfferContract();
    const tx = await contract.makeOffer(nft, tokenId, { value: price });
    return tx.wait();
  },

  async acceptOffer(nft: string, tokenId: number): Promise<ethers.TransactionReceipt> {
    const contract = await getOfferContract();
    const tx = await contract.acceptOffer(nft, tokenId);
    return tx.wait();
  },

  async cancelOffer(nft: string, tokenId: number): Promise<ethers.TransactionReceipt> {
    const contract = await getOfferContract();
    const tx = await contract.cancelOffer(nft, tokenId);
    return tx.wait();
  },
};

// ===== DEX ROUTER CONTRACT =====
export const getRouterContract = async (readonly = false) => {
  const providerOrSigner = readonly ? getProvider() : await getSigner();
  if (!providerOrSigner) throw new Error('No provider/signer available');
  return new ethers.Contract(DEX_CONTRACTS.UniswapV2Router02, UNISWAP_V2_ROUTER_ABI, providerOrSigner);
};

export const dexRouter = {
  async getAmountsOut(amountIn: bigint, path: string[]): Promise<bigint[]> {
    const contract = await getRouterContract(true);
    return contract.getAmountsOut(amountIn, path);
  },

  async swapExactTokensForTokens(
    amountIn: bigint,
    amountOutMin: bigint,
    path: string[],
    to: string,
    deadline: number
  ): Promise<ethers.TransactionReceipt> {
    const contract = await getRouterContract();
    const tx = await contract.swapExactTokensForTokens(amountIn, amountOutMin, path, to, deadline);
    return tx.wait();
  },

  async swapExactETHForTokens(
    amountOutMin: bigint,
    path: string[],
    to: string,
    deadline: number,
    value: bigint
  ): Promise<ethers.TransactionReceipt> {
    const contract = await getRouterContract();
    const tx = await contract.swapExactETHForTokens(amountOutMin, path, to, deadline, { value });
    return tx.wait();
  },

  async addLiquidity(
    tokenA: string,
    tokenB: string,
    amountADesired: bigint,
    amountBDesired: bigint,
    amountAMin: bigint,
    amountBMin: bigint,
    to: string,
    deadline: number
  ): Promise<ethers.TransactionReceipt> {
    const contract = await getRouterContract();
    const tx = await contract.addLiquidity(
      tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, to, deadline
    );
    return tx.wait();
  },

  async removeLiquidity(
    tokenA: string,
    tokenB: string,
    liquidity: bigint,
    amountAMin: bigint,
    amountBMin: bigint,
    to: string,
    deadline: number
  ): Promise<ethers.TransactionReceipt> {
    const contract = await getRouterContract();
    const tx = await contract.removeLiquidity(
      tokenA, tokenB, liquidity, amountAMin, amountBMin, to, deadline
    );
    return tx.wait();
  },
};

// ===== STAKING CONTRACT =====
export const getStakingContract = async (readonly = false) => {
  const providerOrSigner = readonly ? getProvider() : await getSigner();
  if (!providerOrSigner) throw new Error('No provider/signer available');
  return new ethers.Contract(STAKING_CONTRACT.address, STAKING_ABI, providerOrSigner);
};

export const staking = {
  // Read functions
  async getPool(pid: number) {
    const contract = await getStakingContract(true);
    return contract.pools(pid);
  },

  async getUserStake(pid: number, user: string) {
    const contract = await getStakingContract(true);
    return contract.userStakes(pid, user);
  },

  async getPendingReward(pid: number, user: string): Promise<bigint> {
    const contract = await getStakingContract(true);
    return contract.pendingReward(pid, user);
  },

  async getOwner(): Promise<string> {
    const contract = await getStakingContract(true);
    return contract.owner();
  },

  // Write functions
  async stake(pid: number, amount: bigint): Promise<ethers.TransactionReceipt> {
    const contract = await getStakingContract();
    const tx = await contract.stake(pid, amount);
    return tx.wait();
  },

  async unstake(pid: number): Promise<ethers.TransactionReceipt> {
    const contract = await getStakingContract();
    const tx = await contract.unstake(pid);
    return tx.wait();
  },

  // Admin functions
  async addPool(
    token: string,
    apr: number,
    lockPeriod: number,
    minStake: bigint
  ): Promise<ethers.TransactionReceipt> {
    const contract = await getStakingContract();
    const tx = await contract.addPool(token, apr, lockPeriod, minStake);
    return tx.wait();
  },

  async setPoolStatus(pid: number, active: boolean): Promise<ethers.TransactionReceipt> {
    const contract = await getStakingContract();
    const tx = await contract.setPoolStatus(pid, active);
    return tx.wait();
  },
};

// ===== ERC20 TOKEN HELPERS =====
export const getTokenContract = async (tokenAddress: string, readonly = false) => {
  const providerOrSigner = readonly ? getProvider() : await getSigner();
  if (!providerOrSigner) throw new Error('No provider/signer available');
  return new ethers.Contract(tokenAddress, ERC20_ABI, providerOrSigner);
};

export const token = {
  async balanceOf(tokenAddress: string, account: string): Promise<bigint> {
    const contract = await getTokenContract(tokenAddress, true);
    return contract.balanceOf(account);
  },

  async allowance(tokenAddress: string, owner: string, spender: string): Promise<bigint> {
    const contract = await getTokenContract(tokenAddress, true);
    return contract.allowance(owner, spender);
  },

  async approve(tokenAddress: string, spender: string, amount: bigint): Promise<ethers.TransactionReceipt> {
    const contract = await getTokenContract(tokenAddress);
    const tx = await contract.approve(spender, amount);
    return tx.wait();
  },

  async transfer(tokenAddress: string, to: string, amount: bigint): Promise<ethers.TransactionReceipt> {
    const contract = await getTokenContract(tokenAddress);
    const tx = await contract.transfer(to, amount);
    return tx.wait();
  },
};

// ===== PAIR CONTRACT HELPERS =====
export const getPairContract = async (pairAddress: string, readonly = false) => {
  const providerOrSigner = readonly ? getProvider() : await getSigner();
  if (!providerOrSigner) throw new Error('No provider/signer available');
  return new ethers.Contract(pairAddress, UNISWAP_V2_PAIR_ABI, providerOrSigner);
};

export const pair = {
  async getReserves(pairAddress: string) {
    const contract = await getPairContract(pairAddress, true);
    const [reserve0, reserve1] = await contract.getReserves();
    const token0 = await contract.token0();
    const token1 = await contract.token1();
    return { reserve0, reserve1, token0, token1 };
  },

  async totalSupply(pairAddress: string): Promise<bigint> {
    const contract = await getPairContract(pairAddress, true);
    return contract.totalSupply();
  },
};

// Export all contracts info
export const contracts = {
  nftCollection: {
    address: CONTRACTS.NFTCollection,
    name: 'NFT Collection',
    methods: nftCollection,
  },
  marketplace: {
    address: CONTRACTS.Marketplace,
    name: 'NFT Marketplace',
    methods: marketplace,
  },
  offers: {
    address: CONTRACTS.OfferContract,
    name: 'Offer Contract',
    methods: offers,
  },
  dexRouter: {
    address: DEX_CONTRACTS.UniswapV2Router02,
    name: 'UniswapV2 Router',
    methods: dexRouter,
  },
  staking: {
    address: STAKING_CONTRACT.address,
    name: 'Staking Contract',
    methods: staking,
  },
};
