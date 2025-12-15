// Multicall implementation for batching RPC calls
// Contract Address: 0x503Bdb5Dd218E73c755D2Fc03D6E14c79330a85f

import { ethers } from 'ethers';
import { getProvider } from './wallet';
import { DEX_CONTRACTS, MULTICALL_ABI, ERC20_ABI } from './dex-config';

export const MULTICALL_ADDRESS = DEX_CONTRACTS.Multicall;

interface Call {
  target: string;
  callData: string;
}

interface MulticallResult {
  blockNumber: bigint;
  returnData: string[];
}

// Execute multiple calls in a single transaction
export const multicall = async (calls: Call[]): Promise<MulticallResult | null> => {
  try {
    const provider = getProvider();
    if (!provider) return null;

    const multicallContract = new ethers.Contract(
      MULTICALL_ADDRESS,
      MULTICALL_ABI,
      provider
    );

    const result = await multicallContract.aggregate(calls);
    return {
      blockNumber: result[0],
      returnData: result[1],
    };
  } catch (error) {
    console.error('Multicall error:', error);
    return null;
  }
};

// Get multiple token balances in a single call
export const getMultipleBalances = async (
  tokens: string[],
  account: string
): Promise<Map<string, string>> => {
  const balances = new Map<string, string>();
  
  try {
    const provider = getProvider();
    if (!provider) return balances;

    const iface = new ethers.Interface(ERC20_ABI);
    const calls: Call[] = [];

    // Check for native token (NEX)
    const hasNative = tokens.some(t => t === '0x0000000000000000000000000000000000000000');
    const erc20Tokens = tokens.filter(t => t !== '0x0000000000000000000000000000000000000000');

    // Add ERC20 balance calls
    for (const token of erc20Tokens) {
      calls.push({
        target: token,
        callData: iface.encodeFunctionData('balanceOf', [account]),
      });
    }

    // Execute multicall for ERC20 tokens
    if (calls.length > 0) {
      const result = await multicall(calls);
      if (result) {
        erc20Tokens.forEach((token, index) => {
          try {
            const decoded = iface.decodeFunctionResult('balanceOf', result.returnData[index]);
            balances.set(token.toLowerCase(), ethers.formatEther(decoded[0]));
          } catch {
            balances.set(token.toLowerCase(), '0');
          }
        });
      }
    }

    // Get native balance separately (multicall has getEthBalance)
    if (hasNative) {
      const nativeBalance = await provider.getBalance(account);
      balances.set('0x0000000000000000000000000000000000000000', ethers.formatEther(nativeBalance));
    }

    return balances;
  } catch (error) {
    console.error('Error getting multiple balances:', error);
    return balances;
  }
};

// Get multiple token decimals in a single call
export const getMultipleDecimals = async (
  tokens: string[]
): Promise<Map<string, number>> => {
  const decimals = new Map<string, number>();
  
  try {
    const provider = getProvider();
    if (!provider) return decimals;

    const iface = new ethers.Interface(ERC20_ABI);
    const calls: Call[] = [];

    // Filter out native token
    const erc20Tokens = tokens.filter(t => t !== '0x0000000000000000000000000000000000000000');

    // Native token is always 18 decimals
    if (tokens.includes('0x0000000000000000000000000000000000000000')) {
      decimals.set('0x0000000000000000000000000000000000000000', 18);
    }

    // Add decimals calls
    for (const token of erc20Tokens) {
      calls.push({
        target: token,
        callData: iface.encodeFunctionData('decimals', []),
      });
    }

    // Execute multicall
    if (calls.length > 0) {
      const result = await multicall(calls);
      if (result) {
        erc20Tokens.forEach((token, index) => {
          try {
            const decoded = iface.decodeFunctionResult('decimals', result.returnData[index]);
            decimals.set(token.toLowerCase(), Number(decoded[0]));
          } catch {
            decimals.set(token.toLowerCase(), 18); // Default to 18
          }
        });
      }
    }

    return decimals;
  } catch (error) {
    console.error('Error getting multiple decimals:', error);
    return decimals;
  }
};

// Get current block info
export const getBlockInfo = async (): Promise<{
  blockNumber: bigint;
  timestamp: bigint;
  difficulty: bigint;
  gasLimit: bigint;
} | null> => {
  try {
    const provider = getProvider();
    if (!provider) return null;

    const multicallContract = new ethers.Contract(
      MULTICALL_ADDRESS,
      MULTICALL_ABI,
      provider
    );

    const [timestamp, difficulty, gasLimit] = await Promise.all([
      multicallContract.getCurrentBlockTimestamp(),
      multicallContract.getCurrentBlockDifficulty(),
      multicallContract.getCurrentBlockGasLimit(),
    ]);

    const blockNumber = await provider.getBlockNumber();

    return {
      blockNumber: BigInt(blockNumber),
      timestamp,
      difficulty,
      gasLimit,
    };
  } catch (error) {
    console.error('Error getting block info:', error);
    return null;
  }
};

// Get ETH balance using multicall
export const getEthBalanceMulticall = async (address: string): Promise<string> => {
  try {
    const provider = getProvider();
    if (!provider) return '0';

    const multicallContract = new ethers.Contract(
      MULTICALL_ADDRESS,
      MULTICALL_ABI,
      provider
    );

    const balance = await multicallContract.getEthBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error getting ETH balance:', error);
    return '0';
  }
};
