// UniswapV2Library implementation
// Since the library contract has no ABI (pure functions compiled into other contracts),
// we implement the library functions in JavaScript/TypeScript

import { ethers } from 'ethers';
import { DEX_CONTRACTS } from './dex-config';

// Sort tokens to get consistent pair ordering
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
export function pairFor(factory: string, tokenA: string, tokenB: string): string {
  const [token0, token1] = sortTokens(tokenA, tokenB);
  
  // INIT_CODE_PAIR_HASH - this is specific to UniswapV2
  // You may need to update this hash based on your deployment
  const INIT_CODE_HASH = '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f';
  
  const salt = ethers.keccak256(
    ethers.solidityPacked(['address', 'address'], [token0, token1])
  );
  
  const pair = ethers.getCreate2Address(factory, salt, INIT_CODE_HASH);
  return pair;
}

// Given some asset amount and reserves, returns an amount of the other asset
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
  const amounts: bigint[] = new Array(path.length);
  amounts[amounts.length - 1] = amountOut;
  for (let i = path.length - 1; i > 0; i--) {
    amounts[i - 1] = getAmountIn(amounts[i], reserves[i - 1].reserveIn, reserves[i - 1].reserveOut);
  }
  return amounts;
}

// Calculate price impact percentage
export function calculatePriceImpact(
  amountIn: bigint,
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): number {
  if (reserveIn === 0n || reserveOut === 0n) return 0;
  
  // Ideal price (no slippage)
  const idealAmountOut = (amountIn * reserveOut) / reserveIn;
  
  if (idealAmountOut === 0n) return 0;
  
  // Price impact = (idealAmountOut - actualAmountOut) / idealAmountOut * 100
  const impact = Number((idealAmountOut - amountOut) * 10000n / idealAmountOut) / 100;
  return Math.max(0, impact);
}

// Export contract address for reference
export const UNISWAP_V2_LIBRARY_ADDRESS = DEX_CONTRACTS.UniswapV2Library;
