import { ethers } from 'ethers';
import { getProvider, getSigner } from './wallet';
import {
  DEX_CONTRACTS,
  UNISWAP_V2_FACTORY_ABI,
  UNISWAP_V2_PAIR_ABI,
  UNISWAP_V2_ROUTER_ABI,
  ERC20_ABI,
  WETH_ABI,
  Token,
  DEFAULT_TOKENS,
} from './dex-config';
import * as UniswapV2Library from './uniswap-library';

// Get contract instances
export const getRouterContract = async () => {
  const signer = await getSigner();
  if (!signer) return null;
  return new ethers.Contract(DEX_CONTRACTS.UniswapV2Router02, UNISWAP_V2_ROUTER_ABI, signer);
};

export const getFactoryContract = async () => {
  const signer = await getSigner();
  if (!signer) return null;
  return new ethers.Contract(DEX_CONTRACTS.UniswapV2Factory, UNISWAP_V2_FACTORY_ABI, signer);
};

export const getPairContract = async (pairAddress: string) => {
  const signer = await getSigner();
  if (!signer) return null;
  return new ethers.Contract(pairAddress, UNISWAP_V2_PAIR_ABI, signer);
};

export const getTokenContract = async (tokenAddress: string) => {
  const signer = await getSigner();
  if (!signer) return null;
  return new ethers.Contract(tokenAddress, ERC20_ABI, signer);
};

export const getWETHContract = async () => {
  const signer = await getSigner();
  if (!signer) return null;
  return new ethers.Contract(DEX_CONTRACTS.WETH9, WETH_ABI, signer);
};

// Check if token is native (NEX)
export const isNativeToken = (address: string) => {
  return address === '0x0000000000000000000000000000000000000000';
};

// Simple cache for balances to reduce RPC calls
const balanceCache: Map<string, { balance: string; timestamp: number }> = new Map();
const CACHE_DURATION = 30000; // 30 seconds - increased to reduce RPC calls

// Token decimals cache to avoid repeated calls
const decimalsCache: Map<string, number> = new Map();

// Get token decimals with caching
const getTokenDecimals = async (tokenAddress: string, provider: ethers.BrowserProvider): Promise<number> => {
  const cached = decimalsCache.get(tokenAddress.toLowerCase());
  if (cached !== undefined) return cached;
  
  // Default to 18 for known tokens
  const knownDecimals: Record<string, number> = {
    [DEX_CONTRACTS.WNEX.toLowerCase()]: 18,
    [DEX_CONTRACTS.NXSA.toLowerCase()]: 18,
    [DEX_CONTRACTS.WETH.toLowerCase()]: 18,
    [DEX_CONTRACTS.WETH9.toLowerCase()]: 18,
  };
  
  const known = knownDecimals[tokenAddress.toLowerCase()];
  if (known !== undefined) {
    decimalsCache.set(tokenAddress.toLowerCase(), known);
    return known;
  }
  
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const decimals = await tokenContract.decimals();
    decimalsCache.set(tokenAddress.toLowerCase(), Number(decimals));
    return Number(decimals);
  } catch {
    // Default to 18 if we can't get decimals
    return 18;
  }
};

// Get token balance with caching and retry
export const getTokenBalance = async (tokenAddress: string, account: string, forceRefresh = false): Promise<string> => {
  const cacheKey = `${tokenAddress.toLowerCase()}-${account.toLowerCase()}`;
  const cached = balanceCache.get(cacheKey);
  
  // Return cached value if valid and not forcing refresh
  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.balance;
  }

  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const provider = getProvider();
      if (!provider) return cached?.balance || '0';

      let balance: string;

      if (isNativeToken(tokenAddress)) {
        const rawBalance = await provider.getBalance(account);
        balance = ethers.formatEther(rawBalance);
      } else {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        // Get decimals from cache first to reduce RPC calls
        const decimals = await getTokenDecimals(tokenAddress, provider);
        const rawBalance = await tokenContract.balanceOf(account);
        balance = ethers.formatUnits(rawBalance, decimals);
      }

      // Cache the result
      balanceCache.set(cacheKey, { balance, timestamp: Date.now() });
      return balance;
    } catch (error: any) {
      lastError = error;
      // If rate limited or contract error, wait before retry
      if (error?.error?.code === -32002 || error?.code === 'UNKNOWN_ERROR' || error?.code === 'CALL_EXCEPTION') {
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
        continue;
      }
      break;
    }
  }

  // Return cached value if available, even if expired
  if (cached) return cached.balance;
  return '0';
};

// Get pair address
export const getPairAddress = async (tokenA: string, tokenB: string): Promise<string | null> => {
  try {
    const provider = getProvider();
    if (!provider) return null;

    const factory = new ethers.Contract(DEX_CONTRACTS.UniswapV2Factory, UNISWAP_V2_FACTORY_ABI, provider);
    
    // Use WETH for native token
    const addressA = isNativeToken(tokenA) ? DEX_CONTRACTS.WETH9 : tokenA;
    const addressB = isNativeToken(tokenB) ? DEX_CONTRACTS.WETH9 : tokenB;

    const pairAddress = await factory.getPair(addressA, addressB);
    if (pairAddress === '0x0000000000000000000000000000000000000000') {
      return null;
    }
    return pairAddress;
  } catch (error) {
    console.error('Error getting pair address:', error);
    return null;
  }
};

// Get reserves
export const getReserves = async (pairAddress: string) => {
  try {
    const provider = getProvider();
    if (!provider) return null;

    const pair = new ethers.Contract(pairAddress, UNISWAP_V2_PAIR_ABI, provider);
    const reserves = await pair.getReserves();
    const token0 = await pair.token0();
    const token1 = await pair.token1();

    return {
      reserve0: reserves[0],
      reserve1: reserves[1],
      token0,
      token1,
    };
  } catch (error) {
    console.error('Error getting reserves:', error);
    return null;
  }
};

// Calculate output amount
export const getAmountOut = async (
  amountIn: string,
  tokenIn: Token,
  tokenOut: Token
): Promise<string> => {
  try {
    const provider = getProvider();
    if (!provider || !amountIn || parseFloat(amountIn) === 0) return '0';

    const router = new ethers.Contract(DEX_CONTRACTS.UniswapV2Router02, UNISWAP_V2_ROUTER_ABI, provider);
    
    const addressIn = isNativeToken(tokenIn.address) ? DEX_CONTRACTS.WETH9 : tokenIn.address;
    const addressOut = isNativeToken(tokenOut.address) ? DEX_CONTRACTS.WETH9 : tokenOut.address;

    const amountInWei = ethers.parseUnits(amountIn, tokenIn.decimals);
    const amounts = await router.getAmountsOut(amountInWei, [addressIn, addressOut]);
    
    return ethers.formatUnits(amounts[1], tokenOut.decimals);
  } catch (error) {
    console.error('Error calculating amount out:', error);
    return '0';
  }
};

// Approve token
export const approveToken = async (
  tokenAddress: string,
  spender: string,
  amount: bigint
): Promise<boolean> => {
  try {
    const tokenContract = await getTokenContract(tokenAddress);
    if (!tokenContract) return false;

    const tx = await tokenContract.approve(spender, amount);
    await tx.wait();
    return true;
  } catch (error) {
    console.error('Error approving token:', error);
    return false;
  }
};

// Check allowance
export const checkAllowance = async (
  tokenAddress: string,
  owner: string,
  spender: string
): Promise<bigint> => {
  try {
    const provider = getProvider();
    if (!provider) return BigInt(0);

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    return await tokenContract.allowance(owner, spender);
  } catch (error) {
    console.error('Error checking allowance:', error);
    return BigInt(0);
  }
};

// Swap tokens
export const swapTokens = async (
  amountIn: string,
  amountOutMin: string,
  tokenIn: Token,
  tokenOut: Token,
  account: string,
  slippage: number
): Promise<{ success: boolean; hash?: string; error?: string }> => {
  try {
    const router = await getRouterContract();
    if (!router) return { success: false, error: 'Router not found' };

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    const amountInWei = ethers.parseUnits(amountIn, tokenIn.decimals);
    const minOut = parseFloat(amountOutMin) * (1 - slippage / 100);
    const amountOutMinWei = ethers.parseUnits(minOut.toFixed(tokenOut.decimals), tokenOut.decimals);

    let tx;

    if (isNativeToken(tokenIn.address)) {
      // ETH -> Token
      tx = await router.swapExactETHForTokens(
        amountOutMinWei,
        [DEX_CONTRACTS.WETH9, tokenOut.address],
        account,
        deadline,
        { value: amountInWei }
      );
    } else if (isNativeToken(tokenOut.address)) {
      // Token -> ETH
      await approveToken(tokenIn.address, DEX_CONTRACTS.UniswapV2Router02, amountInWei);
      tx = await router.swapExactTokensForETH(
        amountInWei,
        amountOutMinWei,
        [tokenIn.address, DEX_CONTRACTS.WETH9],
        account,
        deadline
      );
    } else {
      // Token -> Token
      await approveToken(tokenIn.address, DEX_CONTRACTS.UniswapV2Router02, amountInWei);
      tx = await router.swapExactTokensForTokens(
        amountInWei,
        amountOutMinWei,
        [tokenIn.address, tokenOut.address],
        account,
        deadline
      );
    }

    const receipt = await tx.wait();
    return { success: true, hash: receipt.hash };
  } catch (error: any) {
    console.error('Swap error:', error);
    return { success: false, error: error.message || 'Swap failed' };
  }
};

// Add liquidity
export const addLiquidity = async (
  tokenA: Token,
  tokenB: Token,
  amountA: string,
  amountB: string,
  account: string,
  slippage: number
): Promise<{ success: boolean; hash?: string; error?: string }> => {
  try {
    const router = await getRouterContract();
    if (!router) return { success: false, error: 'Router not found' };

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const amountAWei = ethers.parseUnits(amountA, tokenA.decimals);
    const amountBWei = ethers.parseUnits(amountB, tokenB.decimals);
    const amountAMin = ethers.parseUnits((parseFloat(amountA) * (1 - slippage / 100)).toFixed(tokenA.decimals), tokenA.decimals);
    const amountBMin = ethers.parseUnits((parseFloat(amountB) * (1 - slippage / 100)).toFixed(tokenB.decimals), tokenB.decimals);

    let tx;

    if (isNativeToken(tokenA.address)) {
      // ETH + Token
      await approveToken(tokenB.address, DEX_CONTRACTS.UniswapV2Router02, amountBWei);
      tx = await router.addLiquidityETH(
        tokenB.address,
        amountBWei,
        amountBMin,
        amountAMin,
        account,
        deadline,
        { value: amountAWei }
      );
    } else if (isNativeToken(tokenB.address)) {
      // Token + ETH
      await approveToken(tokenA.address, DEX_CONTRACTS.UniswapV2Router02, amountAWei);
      tx = await router.addLiquidityETH(
        tokenA.address,
        amountAWei,
        amountAMin,
        amountBMin,
        account,
        deadline,
        { value: amountBWei }
      );
    } else {
      // Token + Token
      await approveToken(tokenA.address, DEX_CONTRACTS.UniswapV2Router02, amountAWei);
      await approveToken(tokenB.address, DEX_CONTRACTS.UniswapV2Router02, amountBWei);
      tx = await router.addLiquidity(
        tokenA.address,
        tokenB.address,
        amountAWei,
        amountBWei,
        amountAMin,
        amountBMin,
        account,
        deadline
      );
    }

    const receipt = await tx.wait();
    return { success: true, hash: receipt.hash };
  } catch (error: any) {
    console.error('Add liquidity error:', error);
    return { success: false, error: error.message || 'Add liquidity failed' };
  }
};

// Remove liquidity
export const removeLiquidity = async (
  tokenA: Token,
  tokenB: Token,
  liquidity: string,
  account: string,
  slippage: number
): Promise<{ success: boolean; hash?: string; error?: string }> => {
  try {
    const router = await getRouterContract();
    if (!router) return { success: false, error: 'Router not found' };

    const pairAddress = await getPairAddress(tokenA.address, tokenB.address);
    if (!pairAddress) return { success: false, error: 'Pair not found' };

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    const liquidityWei = ethers.parseUnits(liquidity, 18);

    // Approve LP tokens
    await approveToken(pairAddress, DEX_CONTRACTS.UniswapV2Router02, liquidityWei);

    let tx;
    const amountAMin = 0;
    const amountBMin = 0;

    if (isNativeToken(tokenA.address) || isNativeToken(tokenB.address)) {
      const token = isNativeToken(tokenA.address) ? tokenB : tokenA;
      tx = await router.removeLiquidityETH(
        token.address,
        liquidityWei,
        amountAMin,
        amountBMin,
        account,
        deadline
      );
    } else {
      tx = await router.removeLiquidity(
        tokenA.address,
        tokenB.address,
        liquidityWei,
        amountAMin,
        amountBMin,
        account,
        deadline
      );
    }

    const receipt = await tx.wait();
    return { success: true, hash: receipt.hash };
  } catch (error: any) {
    console.error('Remove liquidity error:', error);
    return { success: false, error: error.message || 'Remove liquidity failed' };
  }
};

// Get all pairs from factory
export const getAllPairs = async (): Promise<string[]> => {
  try {
    const provider = getProvider();
    if (!provider) return [];

    const factory = new ethers.Contract(DEX_CONTRACTS.UniswapV2Factory, UNISWAP_V2_FACTORY_ABI, provider);
    const pairsLength = await factory.allPairsLength();
    
    const pairs: string[] = [];
    for (let i = 0; i < pairsLength; i++) {
      const pairAddress = await factory.allPairs(i);
      pairs.push(pairAddress);
    }
    
    return pairs;
  } catch (error) {
    console.error('Error getting all pairs:', error);
    return [];
  }
};

// Get pool info
export interface PoolInfo {
  pairAddress: string;
  token0: Token;
  token1: Token;
  reserve0: string;
  reserve1: string;
  totalSupply: string;
  tvl: number;
  volume24h: number;
  apr: number;
}

export const getPoolInfo = async (pairAddress: string): Promise<PoolInfo | null> => {
  try {
    const provider = getProvider();
    if (!provider) return null;

    const pair = new ethers.Contract(pairAddress, UNISWAP_V2_PAIR_ABI, provider);
    
    const [token0Address, token1Address, reserves, totalSupply] = await Promise.all([
      pair.token0(),
      pair.token1(),
      pair.getReserves(),
      pair.totalSupply(),
    ]);

    // Find tokens in default list or create basic token info
    const token0 = DEFAULT_TOKENS.find(t => t.address.toLowerCase() === token0Address.toLowerCase()) || {
      address: token0Address,
      symbol: 'TOKEN0',
      name: 'Token 0',
      decimals: 18,
    };

    const token1 = DEFAULT_TOKENS.find(t => t.address.toLowerCase() === token1Address.toLowerCase()) || {
      address: token1Address,
      symbol: 'TOKEN1',
      name: 'Token 1',
      decimals: 18,
    };

    // Calculate dummy TVL, volume, APR for display
    const reserve0Formatted = ethers.formatUnits(reserves[0], token0.decimals);
    const reserve1Formatted = ethers.formatUnits(reserves[1], token1.decimals);
    const tvl = parseFloat(reserve0Formatted) * 2; // Simplified TVL calculation
    const volume24h = tvl * 0.1; // 10% of TVL as dummy volume
    const apr = 12.5; // Dummy APR

    return {
      pairAddress,
      token0,
      token1,
      reserve0: reserve0Formatted,
      reserve1: reserve1Formatted,
      totalSupply: ethers.formatEther(totalSupply),
      tvl,
      volume24h,
      apr,
    };
  } catch (error) {
    console.error('Error getting pool info:', error);
    return null;
  }
};

// Get LP token balance
export const getLPBalance = async (pairAddress: string, account: string): Promise<string> => {
  try {
    const provider = getProvider();
    if (!provider) return '0';

    const pair = new ethers.Contract(pairAddress, UNISWAP_V2_PAIR_ABI, provider);
    const balance = await pair.balanceOf(account);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error getting LP balance:', error);
    return '0';
  }
};

// Calculate price impact
export const calculatePriceImpact = (
  amountIn: string,
  amountOut: string,
  reserve0: string,
  reserve1: string
): number => {
  try {
    const amountInNum = parseFloat(amountIn);
    const amountOutNum = parseFloat(amountOut);
    const reserve0Num = parseFloat(reserve0);
    const reserve1Num = parseFloat(reserve1);

    if (amountInNum === 0 || reserve0Num === 0) return 0;

    const idealPrice = reserve1Num / reserve0Num;
    const actualPrice = amountOutNum / amountInNum;
    const impact = ((idealPrice - actualPrice) / idealPrice) * 100;

    return Math.max(0, impact);
  } catch {
    return 0;
  }
};

// Re-export UniswapV2Library functions for convenience
export {
  UniswapV2Library,
};
