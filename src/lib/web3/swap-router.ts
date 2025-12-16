import { Token, DEFAULT_TOKENS, DEX_CONTRACTS } from './dex-config';
import { getPairAddress, getReserves, isNativeToken } from './dex';
import { getAmountOut as calcAmountOut } from './uniswap-library';
import { ethers } from 'ethers';

export interface Route {
  path: Token[];
  pairs: string[];
  amounts: string[];
  priceImpact: number;
}

export interface RouteResult {
  bestRoute: Route | null;
  allRoutes: Route[];
}

// Get all possible intermediate tokens for routing
const getIntermediateTokens = (): Token[] => {
  // Common base tokens for routing
  return DEFAULT_TOKENS.filter(t => 
    t.symbol === 'WNEX' || 
    t.symbol === 'NXSA' || 
    t.symbol === 'WETH' ||
    t.symbol === 'USDC'
  );
};

// Calculate output amount for a path
const calculatePathOutput = async (
  amountIn: string,
  path: Token[]
): Promise<{ amountOut: string; priceImpact: number; pairs: string[] } | null> => {
  try {
    let currentAmount = ethers.parseUnits(amountIn, path[0].decimals);
    let totalPriceImpact = 0;
    const pairs: string[] = [];

    for (let i = 0; i < path.length - 1; i++) {
      const tokenIn = path[i];
      const tokenOut = path[i + 1];

      // Get pair address
      const tokenInAddr = isNativeToken(tokenIn.address) ? DEX_CONTRACTS.WETH9 : tokenIn.address;
      const tokenOutAddr = isNativeToken(tokenOut.address) ? DEX_CONTRACTS.WETH9 : tokenOut.address;
      
      const pairAddress = await getPairAddress(tokenInAddr, tokenOutAddr);
      if (!pairAddress || pairAddress === ethers.ZeroAddress) {
        return null; // No pair exists
      }
      pairs.push(pairAddress);

      // Get reserves
      const reserves = await getReserves(pairAddress);
      if (!reserves || reserves.reserve0 === BigInt(0) || reserves.reserve1 === BigInt(0)) {
        return null; // No liquidity
      }

      // Determine correct reserve order
      const token0 = reserves.token0.toLowerCase();
      let reserveIn: bigint;
      let reserveOut: bigint;

      if (token0 === tokenInAddr.toLowerCase()) {
        reserveIn = reserves.reserve0;
        reserveOut = reserves.reserve1;
      } else {
        reserveIn = reserves.reserve1;
        reserveOut = reserves.reserve0;
      }

      // Calculate output
      const amountOut = calcAmountOut(currentAmount, reserveIn, reserveOut);
      
      // Calculate price impact for this hop
      const spotPrice = (reserveOut * BigInt(1e18)) / reserveIn;
      const executionPrice = (amountOut * BigInt(1e18)) / currentAmount;
      const impact = Number((spotPrice - executionPrice) * BigInt(10000) / spotPrice) / 100;
      totalPriceImpact += Math.abs(impact);

      currentAmount = amountOut;
    }

    const finalDecimals = path[path.length - 1].decimals;
    return {
      amountOut: ethers.formatUnits(currentAmount, finalDecimals),
      priceImpact: totalPriceImpact,
      pairs,
    };
  } catch (error) {
    console.error('Error calculating path output:', error);
    return null;
  }
};

// Find all possible routes between two tokens
export const findAllRoutes = async (
  tokenIn: Token,
  tokenOut: Token,
  amountIn: string,
  maxHops: number = 3
): Promise<RouteResult> => {
  const routes: Route[] = [];
  const intermediates = getIntermediateTokens();

  // Direct route (1 hop)
  const directResult = await calculatePathOutput(amountIn, [tokenIn, tokenOut]);
  if (directResult) {
    routes.push({
      path: [tokenIn, tokenOut],
      pairs: directResult.pairs,
      amounts: [amountIn, directResult.amountOut],
      priceImpact: directResult.priceImpact,
    });
  }

  // 2-hop routes through intermediates
  if (maxHops >= 2) {
    for (const intermediate of intermediates) {
      // Skip if intermediate is same as input or output
      if (
        intermediate.address.toLowerCase() === tokenIn.address.toLowerCase() ||
        intermediate.address.toLowerCase() === tokenOut.address.toLowerCase()
      ) {
        continue;
      }

      const result = await calculatePathOutput(amountIn, [tokenIn, intermediate, tokenOut]);
      if (result) {
        routes.push({
          path: [tokenIn, intermediate, tokenOut],
          pairs: result.pairs,
          amounts: [amountIn, result.amountOut],
          priceImpact: result.priceImpact,
        });
      }
    }
  }

  // 3-hop routes (through 2 intermediates)
  if (maxHops >= 3) {
    for (const inter1 of intermediates) {
      if (
        inter1.address.toLowerCase() === tokenIn.address.toLowerCase() ||
        inter1.address.toLowerCase() === tokenOut.address.toLowerCase()
      ) {
        continue;
      }

      for (const inter2 of intermediates) {
        if (
          inter2.address.toLowerCase() === tokenIn.address.toLowerCase() ||
          inter2.address.toLowerCase() === tokenOut.address.toLowerCase() ||
          inter2.address.toLowerCase() === inter1.address.toLowerCase()
        ) {
          continue;
        }

        const result = await calculatePathOutput(amountIn, [tokenIn, inter1, inter2, tokenOut]);
        if (result) {
          routes.push({
            path: [tokenIn, inter1, inter2, tokenOut],
            pairs: result.pairs,
            amounts: [amountIn, result.amountOut],
            priceImpact: result.priceImpact,
          });
        }
      }
    }
  }

  // Sort by output amount (descending)
  routes.sort((a, b) => parseFloat(b.amounts[1]) - parseFloat(a.amounts[1]));

  return {
    bestRoute: routes.length > 0 ? routes[0] : null,
    allRoutes: routes,
  };
};

// Execute multi-hop swap
export const executeMultiHopSwap = async (
  route: Route,
  amountIn: string,
  minAmountOut: string,
  account: string,
  slippage: number
): Promise<{ success: boolean; hash?: string; error?: string }> => {
  try {
    if (!window.ethereum) throw new Error('No wallet connected');

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const routerAbi = [
      'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
      'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
      'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
    ];

    const router = new ethers.Contract(DEX_CONTRACTS.UniswapV2Router02, routerAbi, signer);

    // Build path addresses
    const pathAddresses = route.path.map(t => 
      isNativeToken(t.address) ? DEX_CONTRACTS.WETH9 : t.address
    );

    const amountInWei = ethers.parseUnits(amountIn, route.path[0].decimals);
    const minOutWei = ethers.parseUnits(
      (parseFloat(minAmountOut) * (1 - slippage / 100)).toFixed(route.path[route.path.length - 1].decimals),
      route.path[route.path.length - 1].decimals
    );

    // Get deadline from blockchain
    const block = await provider.getBlock('latest');
    const deadline = (block?.timestamp || Math.floor(Date.now() / 1000)) + 1800;

    const isInputNative = isNativeToken(route.path[0].address);
    const isOutputNative = isNativeToken(route.path[route.path.length - 1].address);

    let tx;

    if (isInputNative) {
      // ETH -> Token(s)
      tx = await router.swapExactETHForTokens(
        minOutWei,
        pathAddresses,
        account,
        deadline,
        { value: amountInWei }
      );
    } else if (isOutputNative) {
      // Token(s) -> ETH
      // Approve first
      const tokenContract = new ethers.Contract(
        route.path[0].address,
        ['function approve(address spender, uint256 amount) returns (bool)'],
        signer
      );
      const approveTx = await tokenContract.approve(DEX_CONTRACTS.UniswapV2Router02, amountInWei);
      await approveTx.wait();

      tx = await router.swapExactTokensForETH(
        amountInWei,
        minOutWei,
        pathAddresses,
        account,
        deadline
      );
    } else {
      // Token -> Token(s)
      // Approve first
      const tokenContract = new ethers.Contract(
        route.path[0].address,
        ['function approve(address spender, uint256 amount) returns (bool)'],
        signer
      );
      const approveTx = await tokenContract.approve(DEX_CONTRACTS.UniswapV2Router02, amountInWei);
      await approveTx.wait();

      tx = await router.swapExactTokensForTokens(
        amountInWei,
        minOutWei,
        pathAddresses,
        account,
        deadline
      );
    }

    const receipt = await tx.wait();
    return { success: true, hash: receipt.hash };
  } catch (error: any) {
    console.error('Multi-hop swap error:', error);
    return { success: false, error: error.message };
  }
};
