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

// ============= Request Queue & Rate Limiting =============
const requestQueue: Array<() => Promise<any>> = [];
let isProcessingQueue = false;
const MIN_REQUEST_INTERVAL = 150; // 150ms between requests - faster but still safe
let lastRequestTime = 0;

const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) return;
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    
    const request = requestQueue.shift();
    if (request) {
      lastRequestTime = Date.now();
      try {
        await request();
      } catch {
        // Continue processing even if one request fails
      }
    }
  }
  
  isProcessingQueue = false;
};

// Enhanced queue request with retry logic
const queueRequest = <T>(fn: () => Promise<T>, retries = 2): Promise<T> => {
  return new Promise((resolve, reject) => {
    const attemptRequest = async (attemptsLeft: number) => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error: any) {
        if (attemptsLeft > 0 && !error?.message?.includes('user rejected')) {
          // Wait before retry with exponential backoff
          await new Promise(r => setTimeout(r, (3 - attemptsLeft) * 500));
          attemptRequest(attemptsLeft - 1);
        } else {
          reject(error);
        }
      }
    };
    
    requestQueue.push(() => attemptRequest(retries));
    processQueue();
  });
};

// ============= Enhanced Caching =============
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  expiry: number;
}

class SmartCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private defaultExpiry: number;

  constructor(defaultExpiryMs: number = 30000) {
    this.defaultExpiry = defaultExpiryMs;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.timestamp + entry.expiry) {
      // Return stale data but mark for refresh
      return entry.value;
    }
    return entry.value;
  }

  getIfValid(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.timestamp + entry.expiry) return null;
    return entry.value;
  }

  set(key: string, value: T, customExpiry?: number): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      expiry: customExpiry ?? this.defaultExpiry,
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Initialize caches
const balanceCache = new SmartCache<string>(20000); // 20 seconds
const decimalsCache = new SmartCache<number>(300000); // 5 minutes
// NOTE: store ZERO_ADDRESS for "no pair" so cache misses can be distinguished
const pairAddressCache = new SmartCache<string>(60000); // 1 minute
const contractExistsCache = new SmartCache<boolean>(120000); // 2 minutes

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';


// ============= Contract Instance Helpers =============
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

// Check if a contract exists at the given address
const checkContractExists = async (address: string): Promise<boolean> => {
  const cacheKey = `exists_${address.toLowerCase()}`;
  const cached = contractExistsCache.getIfValid(cacheKey);
  if (cached !== null) return cached;

  try {
    const provider = getProvider();
    if (!provider) return false;
    
    const code = await provider.getCode(address);
    const exists = code !== '0x' && code !== '0x0';
    contractExistsCache.set(cacheKey, exists);
    return exists;
  } catch {
    return false;
  }
};

// Get deadline - use generous buffer to prevent EXPIRED errors
export const getDeadline = async (minutes: number = 30): Promise<number> => {
  try {
    const provider = getProvider();
    if (provider) {
      const block = await provider.getBlock('latest');
      if (block) {
        const blockTimestamp = Number(block.timestamp);
        return blockTimestamp + (60 * (minutes + 5));
      }
    }
  } catch {
    // Silent fallback
  }
  return Math.floor(Date.now() / 1000) + (60 * (minutes + 10));
};

// Get token decimals with caching
const getTokenDecimals = async (tokenAddress: string, provider: ethers.BrowserProvider): Promise<number> => {
  const cacheKey = tokenAddress.toLowerCase();
  const cached = decimalsCache.getIfValid(cacheKey);
  if (cached !== null) return cached;
  
  // Default decimals for known tokens
  const knownDecimals: Record<string, number> = {
    [DEX_CONTRACTS.WNEX.toLowerCase()]: 18,
    [DEX_CONTRACTS.NXSA.toLowerCase()]: 18,
    [DEX_CONTRACTS.WETH.toLowerCase()]: 18,
    [DEX_CONTRACTS.WETH9.toLowerCase()]: 18,
    [DEX_CONTRACTS.USDC.toLowerCase()]: 6,
    [DEX_CONTRACTS.BNB.toLowerCase()]: 18,
    '0x7f5ca558679a7bc8f111dbf709f37b61ca7e3055': 6, // USDT
  };
  
  const known = knownDecimals[cacheKey];
  if (known !== undefined) {
    decimalsCache.set(cacheKey, known);
    return known;
  }
  
  try {
    // Check if contract exists first
    const exists = await checkContractExists(tokenAddress);
    if (!exists) {
      decimalsCache.set(cacheKey, 18);
      return 18;
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const decimals = await tokenContract.decimals();
    decimalsCache.set(cacheKey, Number(decimals));
    return Number(decimals);
  } catch {
    decimalsCache.set(cacheKey, 18);
    return 18;
  }
};

// Get token balance with improved caching and silent error handling
export const getTokenBalance = async (tokenAddress: string, account: string, forceRefresh = false): Promise<string> => {
  const cacheKey = `${tokenAddress.toLowerCase()}-${account.toLowerCase()}`;
  
  // Return cached value if valid and not forcing refresh
  if (!forceRefresh) {
    const cached = balanceCache.getIfValid(cacheKey);
    if (cached !== null) return cached;
  }

  // Check for stale cache value to return on error
  const staleValue = balanceCache.get(cacheKey);

  try {
    const provider = getProvider();
    if (!provider) return staleValue || '0';

    let balance: string;

    if (isNativeToken(tokenAddress)) {
      // Native token balance - queue to prevent rate limiting
      const rawBalance = await queueRequest(() => provider.getBalance(account));
      balance = ethers.formatEther(rawBalance);
    } else {
      // Check if token contract exists first
      const exists = await checkContractExists(tokenAddress);
      if (!exists) {
        // Token contract doesn't exist - return 0 silently
        balanceCache.set(cacheKey, '0');
        return '0';
      }

      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const decimals = await getTokenDecimals(tokenAddress, provider);
      const rawBalance = await queueRequest(() => tokenContract.balanceOf(account));
      balance = ethers.formatUnits(rawBalance, decimals);
    }

    balanceCache.set(cacheKey, balance);
    return balance;
  } catch (error: any) {
    // Silent handling - just return stale cache or 0
    if (staleValue) return staleValue;
    return '0';
  }
};

// Get pair address with caching and silent error handling
export const getPairAddress = async (tokenA: string, tokenB: string): Promise<string | null> => {
  // Use WETH for native token
  const addressA = isNativeToken(tokenA) ? DEX_CONTRACTS.WETH9 : tokenA;
  const addressB = isNativeToken(tokenB) ? DEX_CONTRACTS.WETH9 : tokenB;

  // Create a consistent cache key (sorted addresses)
  const sortedAddresses = [addressA.toLowerCase(), addressB.toLowerCase()].sort();
  const cacheKey = `pair_${sortedAddresses[0]}_${sortedAddresses[1]}`;

  // Check cache first
  const cached = pairAddressCache.getIfValid(cacheKey);
  if (cached !== null) {
    return cached === ZERO_ADDRESS ? null : cached;
  }

  try {
    const provider = getProvider();
    if (!provider) return null;

    // Check if factory exists
    const factoryExists = await checkContractExists(DEX_CONTRACTS.UniswapV2Factory);
    if (!factoryExists) {
      pairAddressCache.set(cacheKey, ZERO_ADDRESS);
      return null;
    }

    const factory = new ethers.Contract(DEX_CONTRACTS.UniswapV2Factory, UNISWAP_V2_FACTORY_ABI, provider);
    const pairAddress = await queueRequest(() => factory.getPair(addressA, addressB));

    if (pairAddress === ZERO_ADDRESS) {
      pairAddressCache.set(cacheKey, ZERO_ADDRESS);
      return null;
    }

    pairAddressCache.set(cacheKey, pairAddress);
    return pairAddress;
  } catch {
    // Silent fail - cache as "no pair" to reduce repeated failures
    pairAddressCache.set(cacheKey, ZERO_ADDRESS);
    return null;
  }
};


// Cache for reserves
const reservesCache = new SmartCache<{ reserve0: bigint; reserve1: bigint; token0: string; token1: string } | null>(15000); // 15 seconds

// Cache for LP balances
const lpBalanceCache = new SmartCache<string>(10000); // 10 seconds

// Get reserves with caching
export const getReserves = async (pairAddress: string, forceRefresh = false) => {
  if (!pairAddress || pairAddress === '0x0000000000000000000000000000000000000000') {
    return null;
  }

  const cacheKey = `reserves_${pairAddress.toLowerCase()}`;
  
  // Return cached if not forcing refresh
  if (!forceRefresh) {
    const cached = reservesCache.getIfValid(cacheKey);
    if (cached !== null) return cached;
  }


  try {
    const provider = getProvider();
    if (!provider) return null;

    // Check if pair contract exists
    const pairExists = await checkContractExists(pairAddress);
    if (!pairExists) {
      reservesCache.set(cacheKey, null);
      return null;
    }

    const pair = new ethers.Contract(pairAddress, UNISWAP_V2_PAIR_ABI, provider);
    
    // Batch the calls to reduce RPC requests
    const [reserves, token0, token1] = await Promise.all([
      queueRequest(() => pair.getReserves()),
      queueRequest(() => pair.token0()),
      queueRequest(() => pair.token1()),
    ]);

    const result = {
      reserve0: reserves[0],
      reserve1: reserves[1],
      token0,
      token1,
    };
    
    reservesCache.set(cacheKey, result);
    return result;
  } catch {
    // Silent fail
    reservesCache.set(cacheKey, null);
    return null;
  }
};

// Calculate output amount with better error handling
export const getAmountOut = async (
  amountIn: string,
  tokenIn: Token,
  tokenOut: Token
): Promise<string> => {
  if (!amountIn || parseFloat(amountIn) === 0) return '0';
  
  try {
    const provider = getProvider();
    if (!provider) return '0';

    // Check if tokens exist (for non-native tokens)
    if (!isNativeToken(tokenIn.address)) {
      const tokenInExists = await checkContractExists(tokenIn.address);
      if (!tokenInExists) return '0';
    }
    if (!isNativeToken(tokenOut.address)) {
      const tokenOutExists = await checkContractExists(tokenOut.address);
      if (!tokenOutExists) return '0';
    }

    const router = new ethers.Contract(DEX_CONTRACTS.UniswapV2Router02, UNISWAP_V2_ROUTER_ABI, provider);
    
    const addressIn = isNativeToken(tokenIn.address) ? DEX_CONTRACTS.WETH9 : tokenIn.address;
    const addressOut = isNativeToken(tokenOut.address) ? DEX_CONTRACTS.WETH9 : tokenOut.address;

    const amountInWei = ethers.parseUnits(amountIn, tokenIn.decimals);
    const amounts = await queueRequest(() => router.getAmountsOut(amountInWei, [addressIn, addressOut]));
    
    return ethers.formatUnits(amounts[1], tokenOut.decimals);
  } catch {
    // Silent fail - return 0 for pairs without liquidity
    return '0';
  }
};

// Approve token with improved error handling
export const approveToken = async (
  tokenAddress: string,
  spender: string,
  amount: bigint
): Promise<boolean> => {
  try {
    const tokenContract = await getTokenContract(tokenAddress);
    if (!tokenContract) {
      console.warn('Token contract not available for approval');
      return false;
    }

    // Check if already approved to avoid unnecessary transactions
    try {
      const provider = getProvider();
      if (provider) {
        const signer = await provider.getSigner();
        const owner = await signer.getAddress();
        const currentAllowance = await checkAllowance(tokenAddress, owner, spender);
        if (currentAllowance >= amount) {
          return true; // Already approved
        }
      }
    } catch {
      // Continue with approval if check fails
    }

    // Use max uint256 for approval to avoid repeated approvals
    const maxApproval = ethers.MaxUint256;
    
    const tx = await tokenContract.approve(spender, maxApproval, {
      gasLimit: 100000, // Set explicit gas limit
    });
    
    const receipt = await tx.wait();
    return receipt?.status === 1;
  } catch (error: any) {
    // Parse error for better debugging
    const reason = error?.reason || error?.message || 'Unknown error';
    if (reason.includes('user rejected') || reason.includes('denied')) {
      console.warn('User rejected token approval');
    } else {
      console.warn('Token approval failed:', reason);
    }
    return false;
  }
};

// Check allowance with silent error handling
export const checkAllowance = async (
  tokenAddress: string,
  owner: string,
  spender: string
): Promise<bigint> => {
  try {
    const provider = getProvider();
    if (!provider) return BigInt(0);

    // Check if token exists
    const exists = await checkContractExists(tokenAddress);
    if (!exists) return BigInt(0);

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    return await queueRequest(() => tokenContract.allowance(owner, spender));
  } catch {
    // Silent fail
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

    const deadline = await getDeadline(30); // Get deadline from blockchain
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

// Estimate gas with fallback
const estimateGasWithFallback = async (
  contract: ethers.Contract,
  method: string,
  args: any[],
  overrides: any = {}
): Promise<bigint> => {
  try {
    const gasEstimate = await contract[method].estimateGas(...args, overrides);
    // Add 30% buffer for safety
    return (gasEstimate * BigInt(130)) / BigInt(100);
  } catch {
    // Return default gas limits based on method
    const gasDefaults: Record<string, bigint> = {
      addLiquidity: BigInt(300000),
      addLiquidityETH: BigInt(300000),
      removeLiquidity: BigInt(300000),
      removeLiquidityETH: BigInt(350000),
      swapExactTokensForTokens: BigInt(250000),
      swapExactETHForTokens: BigInt(250000),
      swapExactTokensForETH: BigInt(250000),
    };
    return gasDefaults[method] || BigInt(300000);
  }
};

// Add liquidity with improved error handling and gas estimation
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
    if (!router) return { success: false, error: 'Wallet not connected' };

    // Validate tokens exist
    if (!isNativeToken(tokenA.address)) {
      const tokenAExists = await checkContractExists(tokenA.address);
      if (!tokenAExists) return { success: false, error: `Token ${tokenA.symbol} not found on this network` };
    }
    if (!isNativeToken(tokenB.address)) {
      const tokenBExists = await checkContractExists(tokenB.address);
      if (!tokenBExists) return { success: false, error: `Token ${tokenB.symbol} not found on this network` };
    }

    const deadline = await getDeadline(30);
    const amountAWei = ethers.parseUnits(amountA, tokenA.decimals);
    const amountBWei = ethers.parseUnits(amountB, tokenB.decimals);
    
    // Use more generous slippage for minimum amounts to prevent failures
    const effectiveSlippage = Math.max(slippage, 1); // At least 1% slippage
    const amountAMin = ethers.parseUnits(
      (parseFloat(amountA) * (1 - effectiveSlippage / 100)).toFixed(Math.min(6, tokenA.decimals)), 
      tokenA.decimals
    );
    const amountBMin = ethers.parseUnits(
      (parseFloat(amountB) * (1 - effectiveSlippage / 100)).toFixed(Math.min(6, tokenB.decimals)), 
      tokenB.decimals
    );

    let tx;

    if (isNativeToken(tokenA.address)) {
      const gasLimit = await estimateGasWithFallback(
        router, 'addLiquidityETH',
        [tokenB.address, amountBWei, amountBMin, amountAMin, account, deadline],
        { value: amountAWei }
      );
      
      tx = await router.addLiquidityETH(
        tokenB.address,
        amountBWei,
        amountBMin,
        amountAMin,
        account,
        deadline,
        { value: amountAWei, gasLimit }
      );
    } else if (isNativeToken(tokenB.address)) {
      const gasLimit = await estimateGasWithFallback(
        router, 'addLiquidityETH',
        [tokenA.address, amountAWei, amountAMin, amountBMin, account, deadline],
        { value: amountBWei }
      );
      
      tx = await router.addLiquidityETH(
        tokenA.address,
        amountAWei,
        amountAMin,
        amountBMin,
        account,
        deadline,
        { value: amountBWei, gasLimit }
      );
    } else {
      const gasLimit = await estimateGasWithFallback(
        router, 'addLiquidity',
        [tokenA.address, tokenB.address, amountAWei, amountBWei, amountAMin, amountBMin, account, deadline]
      );
      
      tx = await router.addLiquidity(
        tokenA.address,
        tokenB.address,
        amountAWei,
        amountBWei,
        amountAMin,
        amountBMin,
        account,
        deadline,
        { gasLimit }
      );
    }

    const receipt = await tx.wait();
    
    // Invalidate related caches after successful transaction
    pairAddressCache.clear();
    reservesCache.clear();
    balanceCache.clear();
    lpBalanceCache.clear();
    
    return { success: true, hash: receipt.hash };
  } catch (error: any) {
    // Parse error for user-friendly message
    const message = error?.message || error?.reason || 'Add liquidity failed';
    const shortMessage = error?.shortMessage || '';
    
    if (message.includes('user rejected') || message.includes('denied') || shortMessage.includes('rejected')) {
      return { success: false, error: 'Transaction rejected by user' };
    }
    if (message.includes('insufficient') || message.includes('INSUFFICIENT')) {
      return { success: false, error: 'Insufficient balance or allowance. Please check your token balances.' };
    }
    if (message.includes('EXPIRED') || message.includes('deadline')) {
      return { success: false, error: 'Transaction expired. Please try again.' };
    }
    if (message.includes('TRANSFER_FAILED') || message.includes('transfer')) {
      return { success: false, error: 'Token transfer failed. Please ensure you have approved the tokens.' };
    }
    if (message.includes('gas') || message.includes('intrinsic')) {
      return { success: false, error: 'Not enough gas. Please ensure you have enough native tokens for gas.' };
    }
    return { success: false, error: 'Add liquidity failed. Try increasing slippage or refreshing prices.' };
  }
};

// Calculate estimated output amounts when removing liquidity
export const calculateRemoveLiquidityAmounts = async (
  tokenA: Token,
  tokenB: Token,
  liquidity: string
): Promise<{ amountA: string; amountB: string } | null> => {
  try {
    const pairAddress = await getPairAddress(tokenA.address, tokenB.address);
    if (!pairAddress || pairAddress === '0x0000000000000000000000000000000000000000') {
      return null;
    }

    const reserves = await getReserves(pairAddress);
    if (!reserves) return null;

    const provider = getProvider();
    if (!provider) return null;

    const pairContract = new ethers.Contract(pairAddress, UNISWAP_V2_PAIR_ABI, provider);
    const totalSupply = await pairContract.totalSupply();
    
    if (totalSupply === 0n) return null;

    const liquidityWei = ethers.parseUnits(liquidity, 18);
    
    // Get actual token addresses (WETH9 for native)
    const addressA = isNativeToken(tokenA.address) ? DEX_CONTRACTS.WETH9 : tokenA.address;
    const isTokenAToken0 = reserves.token0.toLowerCase() === addressA.toLowerCase();
    
    const reserveA = isTokenAToken0 ? reserves.reserve0 : reserves.reserve1;
    const reserveB = isTokenAToken0 ? reserves.reserve1 : reserves.reserve0;

    // Calculate amounts: amount = liquidity * reserve / totalSupply
    const amountAWei = (liquidityWei * reserveA) / totalSupply;
    const amountBWei = (liquidityWei * reserveB) / totalSupply;

    return {
      amountA: ethers.formatUnits(amountAWei, tokenA.decimals),
      amountB: ethers.formatUnits(amountBWei, tokenB.decimals),
    };
  } catch (error) {
    console.error('Error calculating remove liquidity amounts:', error);
    return null;
  }
};

// Remove liquidity with improved error handling and gas estimation
export const removeLiquidity = async (
  tokenA: Token,
  tokenB: Token,
  liquidity: string,
  account: string,
  slippage: number,
  expectedAmountA?: string,
  expectedAmountB?: string
): Promise<{ success: boolean; hash?: string; error?: string }> => {
  try {
    const router = await getRouterContract();
    if (!router) return { success: false, error: 'Wallet not connected' };

    const pairAddress = await getPairAddress(tokenA.address, tokenB.address);
    if (!pairAddress || pairAddress === '0x0000000000000000000000000000000000000000') {
      return { success: false, error: 'Liquidity pool not found for this pair' };
    }

    const liquidityWei = ethers.parseUnits(liquidity, 18);

    // Verify LP token allowance first
    const currentAllowance = await checkAllowance(pairAddress, account, DEX_CONTRACTS.UniswapV2Router02);
    if (currentAllowance < liquidityWei) {
      return { success: false, error: 'LP tokens not approved. Please approve first.' };
    }

    // Verify LP balance
    const lpBalance = await getLPBalance(pairAddress, account, true);
    if (parseFloat(lpBalance) < parseFloat(liquidity)) {
      return { success: false, error: 'Insufficient LP token balance' };
    }

    const deadline = await getDeadline(30);

    // Calculate minimum amounts with slippage protection - use more generous slippage
    const effectiveSlippage = Math.max(slippage, 1); // At least 1% slippage
    let amountAMin = BigInt(0);
    let amountBMin = BigInt(0);
    
    if (expectedAmountA && expectedAmountB && parseFloat(expectedAmountA) > 0 && parseFloat(expectedAmountB) > 0) {
      // Use fewer decimals to avoid precision issues
      const expectedAFormatted = parseFloat(expectedAmountA).toFixed(Math.min(6, tokenA.decimals));
      const expectedBFormatted = parseFloat(expectedAmountB).toFixed(Math.min(6, tokenB.decimals));
      
      const expectedA = ethers.parseUnits(expectedAFormatted, tokenA.decimals);
      const expectedB = ethers.parseUnits(expectedBFormatted, tokenB.decimals);
      
      // Apply slippage (e.g., 1% slippage = 99% of expected)
      const slippageMultiplier = BigInt(Math.floor((100 - effectiveSlippage) * 100));
      amountAMin = (expectedA * slippageMultiplier) / BigInt(10000);
      amountBMin = (expectedB * slippageMultiplier) / BigInt(10000);
    }

    let tx;

    if (isNativeToken(tokenA.address) || isNativeToken(tokenB.address)) {
      const token = isNativeToken(tokenA.address) ? tokenB : tokenA;
      const amountTokenMin = isNativeToken(tokenA.address) ? amountBMin : amountAMin;
      const amountETHMin = isNativeToken(tokenA.address) ? amountAMin : amountBMin;
      
      const gasLimit = await estimateGasWithFallback(
        router, 'removeLiquidityETH',
        [token.address, liquidityWei, amountTokenMin, amountETHMin, account, deadline]
      );
      
      tx = await router.removeLiquidityETH(
        token.address,
        liquidityWei,
        amountTokenMin,
        amountETHMin,
        account,
        deadline,
        { gasLimit }
      );
    } else {
      const gasLimit = await estimateGasWithFallback(
        router, 'removeLiquidity',
        [tokenA.address, tokenB.address, liquidityWei, amountAMin, amountBMin, account, deadline]
      );
      
      tx = await router.removeLiquidity(
        tokenA.address,
        tokenB.address,
        liquidityWei,
        amountAMin,
        amountBMin,
        account,
        deadline,
        { gasLimit }
      );
    }

    const receipt = await tx.wait();
    
    // Invalidate all related caches after successful transaction
    pairAddressCache.clear();
    reservesCache.clear();
    balanceCache.clear();
    lpBalanceCache.clear();
    
    return { success: true, hash: receipt.hash };
  } catch (error: any) {
    // Parse error for user-friendly message
    const message = error?.message || error?.reason || '';
    const shortMessage = error?.shortMessage || '';
    const combinedMessage = `${message} ${shortMessage}`.toLowerCase();
    
    if (combinedMessage.includes('user rejected') || combinedMessage.includes('denied')) {
      return { success: false, error: 'Transaction rejected by user' };
    }
    if (combinedMessage.includes('insufficient')) {
      return { success: false, error: 'Insufficient LP balance or output amounts too low. Try increasing slippage.' };
    }
    if (combinedMessage.includes('expired') || combinedMessage.includes('deadline')) {
      return { success: false, error: 'Transaction expired. Please try again.' };
    }
    if (combinedMessage.includes('transfer_failed') || combinedMessage.includes('transfer failed')) {
      return { success: false, error: 'Transfer failed. Ensure LP tokens are properly approved.' };
    }
    if (combinedMessage.includes('gas') || combinedMessage.includes('intrinsic')) {
      return { success: false, error: 'Not enough gas. Please ensure you have enough native tokens.' };
    }
    if (combinedMessage.includes('execution reverted')) {
      return { success: false, error: 'Transaction reverted. Try increasing slippage tolerance.' };
    }
    return { success: false, error: 'Remove liquidity failed. Try increasing slippage or refreshing the page.' };
  }
};

// Get all pairs from factory
export const getAllPairs = async (): Promise<string[]> => {
  try {
    const provider = getProvider();
    if (!provider) return [];

    const factory = new ethers.Contract(DEX_CONTRACTS.UniswapV2Factory, UNISWAP_V2_FACTORY_ABI, provider);
    const pairsLength = await queueRequest(() => factory.allPairsLength());

    const pairs: string[] = [];
    for (let i = 0; i < pairsLength; i++) {
      const pairAddress = await queueRequest(() => factory.allPairs(i));
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

    // Check if pair contract exists first to avoid "missing revert data" errors
    const pairExists = await checkContractExists(pairAddress);
    if (!pairExists) {
      return null;
    }

    const pair = new ethers.Contract(pairAddress, UNISWAP_V2_PAIR_ABI, provider);
    
    // Use individual calls with error handling instead of Promise.all
    let token0Address: string;
    let token1Address: string;
    let reserves: any;
    let totalSupply: bigint;
    
    try {
      token0Address = await queueRequest(() => pair.token0());
      token1Address = await queueRequest(() => pair.token1());
      reserves = await queueRequest(() => pair.getReserves());
      totalSupply = await queueRequest(() => pair.totalSupply());
    } catch {
      // Pair exists but may not be properly initialized
      return null;
    }

    // Find tokens in default list, also check WETH9 address for native token wrapper
    const findToken = (address: string): Token => {
      // Direct match
      let token = DEFAULT_TOKENS.find(t => t.address.toLowerCase() === address.toLowerCase());
      if (token) return token;
      
      // Check if it's WETH9 (native wrapper) - map to WNEX or NEX
      if (address.toLowerCase() === DEX_CONTRACTS.WETH9.toLowerCase()) {
        const wnex = DEFAULT_TOKENS.find(t => t.symbol === 'WNEX');
        if (wnex) return { ...wnex, address }; // Use WNEX info but with actual address
      }
      
      // Try to get token info from contract
      return {
        address,
        symbol: `${address.slice(0, 6)}...`,
        name: 'Unknown Token',
        decimals: 18,
      };
    };

    const token0 = findToken(token0Address);
    const token1 = findToken(token1Address);

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
  } catch {
    // Silent fail - don't log errors for invalid pairs
    return null;
  }
};

// Get LP token balance with error handling and caching
export const getLPBalance = async (pairAddress: string, account: string, forceRefresh = false): Promise<string> => {
  if (!pairAddress || !account) return '0';
  
  // Validate address format
  if (!ethers.isAddress(pairAddress) || !ethers.isAddress(account)) {
    return '0';
  }

  const cacheKey = `lp_${pairAddress.toLowerCase()}_${account.toLowerCase()}`;
  
  // Return cached if valid and not forcing refresh
  if (!forceRefresh) {
    const cached = lpBalanceCache.getIfValid(cacheKey);
    if (cached !== null) return cached;
  }

  // Get stale value for fallback
  const staleValue = lpBalanceCache.get(cacheKey);

  try {
    const provider = getProvider();
    if (!provider) return staleValue || '0';
    
    // Check if contract exists first
    const pairExists = await checkContractExists(pairAddress);
    if (!pairExists) {
      lpBalanceCache.set(cacheKey, '0');
      return '0';
    }

    const pair = new ethers.Contract(pairAddress, UNISWAP_V2_PAIR_ABI, provider);
    
    // Use queueRequest to avoid rate limiting
    const balance = await queueRequest(() => pair.balanceOf(account));
    const formattedBalance = ethers.formatEther(balance);
    
    lpBalanceCache.set(cacheKey, formattedBalance);
    return formattedBalance;
  } catch (error: any) {
    // Silently handle errors and return stale or 0
    if (staleValue) return staleValue;
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
