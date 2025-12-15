// UniswapV2Library implementation
// Contract Address: 0xdF88Fb97B7d6C8aC8e73BbA341BDB6262e20Bb5B
// Since the library contract has no ABI (pure functions compiled into other contracts),
// we implement the library functions in JavaScript/TypeScript

import { ethers } from 'ethers';
import { DEX_CONTRACTS } from './dex-config';

// Export contract address
export const UNISWAP_V2_LIBRARY_ADDRESS = DEX_CONTRACTS.UniswapV2Library;

// Sort tokens to get consistent pair ordering (token0 < token1)
export function sortTokens(tokenA: string, tokenB: string): [string, string] {
  if (tokenA.toLowerCase() === tokenB.toLowerCase()) {
    throw new Error('UniswapV2Library: IDENTICAL_ADDRESSES');
  }
  const [token0, token1] = tokenA.toLowerCase() < tokenB.toLowerCase() 
    ? [tokenA, tokenB] 
    : [tokenB, tokenA];
  if (token0 === ethers.ZeroAddress) {
    throw new Error('UniswapV2Library: ZERO_ADDRESS');
  }
  return [token0, token1];
}

// Calculate pair address using CREATE2
// This is the deterministic address calculation for UniswapV2 pairs
export function pairFor(factory: string, tokenA: string, tokenB: string): string {
  const [token0, token1] = sortTokens(tokenA, tokenB);
  
  // INIT_CODE_PAIR_HASH - this should match the deployed factory's hash
  // You may need to get this from factory.INIT_CODE_PAIR_HASH()
  const INIT_CODE_HASH = '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f';
  
  const salt = ethers.keccak256(
    ethers.solidityPacked(['address', 'address'], [token0, token1])
  );
  
  const pair = ethers.getCreate2Address(factory, salt, INIT_CODE_HASH);
  return pair;
}

// Given some asset amount and reserves, returns an equivalent amount of the other asset
// Formula: amountB = amountA * reserveB / reserveA
export function quote(amountA: bigint, reserveA: bigint, reserveB: bigint): bigint {
  if (amountA <= 0n) {
    throw new Error('UniswapV2Library: INSUFFICIENT_AMOUNT');
  }
  if (reserveA <= 0n || reserveB <= 0n) {
    throw new Error('UniswapV2Library: INSUFFICIENT_LIQUIDITY');
  }
  return (amountA * reserveB) / reserveA;
}

// Given an input amount of an asset and pair reserves, returns the maximum output amount
// Formula with 0.3% fee: amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
export function getAmountOut(amountIn: bigint, reserveIn: bigint, reserveOut: bigint): bigint {
  if (amountIn <= 0n) {
    throw new Error('UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT');
  }
  if (reserveIn <= 0n || reserveOut <= 0n) {
    throw new Error('UniswapV2Library: INSUFFICIENT_LIQUIDITY');
  }
  const amountInWithFee = amountIn * 997n;
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * 1000n + amountInWithFee;
  return numerator / denominator;
}

// Given an output amount of an asset and pair reserves, returns the required input amount
// Formula: amountIn = (reserveIn * amountOut * 1000) / ((reserveOut - amountOut) * 997) + 1
export function getAmountIn(amountOut: bigint, reserveIn: bigint, reserveOut: bigint): bigint {
  if (amountOut <= 0n) {
    throw new Error('UniswapV2Library: INSUFFICIENT_OUTPUT_AMOUNT');
  }
  if (reserveIn <= 0n || reserveOut <= 0n) {
    throw new Error('UniswapV2Library: INSUFFICIENT_LIQUIDITY');
  }
  const numerator = reserveIn * amountOut * 1000n;
  const denominator = (reserveOut - amountOut) * 997n;
  return numerator / denominator + 1n;
}

// Performs chained getAmountOut calculations on any number of pairs
export function getAmountsOut(
  amountIn: bigint,
  path: string[],
  reserves: Array<{ reserveIn: bigint; reserveOut: bigint }>
): bigint[] {
  if (path.length < 2) {
    throw new Error('UniswapV2Library: INVALID_PATH');
  }
  if (reserves.length !== path.length - 1) {
    throw new Error('UniswapV2Library: INVALID_RESERVES_LENGTH');
  }
  const amounts: bigint[] = [amountIn];
  for (let i = 0; i < path.length - 1; i++) {
    amounts.push(getAmountOut(amounts[i], reserves[i].reserveIn, reserves[i].reserveOut));
  }
  return amounts;
}

// Performs chained getAmountIn calculations on any number of pairs
export function getAmountsIn(
  amountOut: bigint,
  path: string[],
  reserves: Array<{ reserveIn: bigint; reserveOut: bigint }>
): bigint[] {
  if (path.length < 2) {
    throw new Error('UniswapV2Library: INVALID_PATH');
  }
  if (reserves.length !== path.length - 1) {
    throw new Error('UniswapV2Library: INVALID_RESERVES_LENGTH');
  }
  const amounts: bigint[] = new Array(path.length);
  amounts[amounts.length - 1] = amountOut;
  for (let i = path.length - 1; i > 0; i--) {
    amounts[i - 1] = getAmountIn(amounts[i], reserves[i - 1].reserveIn, reserves[i - 1].reserveOut);
  }
  return amounts;
}

// Calculate price impact percentage
// Price impact = (idealAmountOut - actualAmountOut) / idealAmountOut * 100
export function calculatePriceImpact(
  amountIn: bigint,
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): number {
  if (reserveIn === 0n || reserveOut === 0n) return 0;
  
  // Ideal price (no slippage) = amountIn * reserveOut / reserveIn
  const idealAmountOut = (amountIn * reserveOut) / reserveIn;
  
  if (idealAmountOut === 0n) return 0;
  
  // Price impact = (idealAmountOut - actualAmountOut) / idealAmountOut * 100
  const impact = Number((idealAmountOut - amountOut) * 10000n / idealAmountOut) / 100;
  return Math.max(0, impact);
}

// Calculate minimum amount out with slippage tolerance
export function calculateMinAmountOut(amountOut: bigint, slippageTolerance: number): bigint {
  // slippageTolerance is in percentage (e.g., 0.5 for 0.5%)
  const slippageBps = BigInt(Math.floor(slippageTolerance * 100)); // Convert to basis points
  const minAmountOut = amountOut - (amountOut * slippageBps) / 10000n;
  return minAmountOut;
}

// Calculate maximum amount in with slippage tolerance
export function calculateMaxAmountIn(amountIn: bigint, slippageTolerance: number): bigint {
  // slippageTolerance is in percentage (e.g., 0.5 for 0.5%)
  const slippageBps = BigInt(Math.floor(slippageTolerance * 100)); // Convert to basis points
  const maxAmountIn = amountIn + (amountIn * slippageBps) / 10000n;
  return maxAmountIn;
}

// Calculate LP tokens to receive when adding liquidity
export function calculateLPTokens(
  amountA: bigint,
  amountB: bigint,
  reserveA: bigint,
  reserveB: bigint,
  totalSupply: bigint
): bigint {
  if (totalSupply === 0n) {
    // First liquidity provider - use geometric mean
    const product = amountA * amountB;
    // Simple square root approximation for bigint
    return sqrt(product);
  }
  
  // Subsequent providers - use the minimum of the two ratios
  const liquidityA = (amountA * totalSupply) / reserveA;
  const liquidityB = (amountB * totalSupply) / reserveB;
  return liquidityA < liquidityB ? liquidityA : liquidityB;
}

// BigInt square root using Newton's method
function sqrt(value: bigint): bigint {
  if (value < 0n) {
    throw new Error('Square root of negative number');
  }
  if (value === 0n) return 0n;
  
  let z = value;
  let x = value / 2n + 1n;
  while (x < z) {
    z = x;
    x = (value / x + x) / 2n;
  }
  return z;
}

// Calculate amounts to receive when removing liquidity
export function calculateRemoveLiquidityAmounts(
  liquidity: bigint,
  reserveA: bigint,
  reserveB: bigint,
  totalSupply: bigint
): { amountA: bigint; amountB: bigint } {
  if (totalSupply === 0n) {
    return { amountA: 0n, amountB: 0n };
  }
  
  const amountA = (liquidity * reserveA) / totalSupply;
  const amountB = (liquidity * reserveB) / totalSupply;
  
  return { amountA, amountB };
}

// Calculate optimal amount B for adding liquidity given amount A
export function getOptimalAmountB(
  amountA: bigint,
  reserveA: bigint,
  reserveB: bigint
): bigint {
  if (reserveA === 0n || reserveB === 0n) {
    throw new Error('UniswapV2Library: INSUFFICIENT_LIQUIDITY');
  }
  return quote(amountA, reserveA, reserveB);
}

// Helper: Format bigint to human-readable string with decimals
export function formatAmount(amount: bigint, decimals: number): string {
  const divisor = 10n ** BigInt(decimals);
  const integerPart = amount / divisor;
  const fractionalPart = amount % divisor;
  
  if (fractionalPart === 0n) {
    return integerPart.toString();
  }
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  // Trim trailing zeros
  const trimmed = fractionalStr.replace(/0+$/, '');
  
  return `${integerPart}.${trimmed}`;
}

// Helper: Parse human-readable string to bigint with decimals
export function parseAmount(amount: string, decimals: number): bigint {
  const [integerPart, fractionalPart = ''] = amount.split('.');
  const paddedFractional = fractionalPart.slice(0, decimals).padEnd(decimals, '0');
  const combined = integerPart + paddedFractional;
  return BigInt(combined);
}
