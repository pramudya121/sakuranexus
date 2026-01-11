// Global error handler for consistent error messages

export interface ParsedError {
  title: string;
  message: string;
  code?: string;
  recoverable: boolean;
}

// Common blockchain/web3 errors
const WEB3_ERRORS: Record<string, ParsedError> = {
  'user rejected': {
    title: 'Transaction Cancelled',
    message: 'You cancelled the transaction',
    code: 'USER_REJECTED',
    recoverable: true,
  },
  'user denied': {
    title: 'Transaction Denied',
    message: 'You denied the transaction request',
    code: 'USER_DENIED',
    recoverable: true,
  },
  'insufficient funds': {
    title: 'Insufficient Balance',
    message: 'You don\'t have enough balance for this transaction',
    code: 'INSUFFICIENT_FUNDS',
    recoverable: false,
  },
  'insufficient balance': {
    title: 'Insufficient Balance',
    message: 'Your wallet balance is too low',
    code: 'INSUFFICIENT_BALANCE',
    recoverable: false,
  },
  'gas required exceeds': {
    title: 'Gas Estimation Failed',
    message: 'Transaction would fail. Check your inputs and try again',
    code: 'GAS_EXCEEDED',
    recoverable: true,
  },
  'nonce too low': {
    title: 'Transaction Conflict',
    message: 'Please wait for pending transactions to complete',
    code: 'NONCE_LOW',
    recoverable: true,
  },
  'replacement fee too low': {
    title: 'Gas Price Too Low',
    message: 'Increase gas price to speed up the transaction',
    code: 'GAS_TOO_LOW',
    recoverable: true,
  },
  'network error': {
    title: 'Network Error',
    message: 'Please check your internet connection',
    code: 'NETWORK_ERROR',
    recoverable: true,
  },
  'timeout': {
    title: 'Request Timeout',
    message: 'The request took too long. Please try again',
    code: 'TIMEOUT',
    recoverable: true,
  },
  'execution reverted': {
    title: 'Transaction Failed',
    message: 'The transaction was reverted by the contract',
    code: 'EXECUTION_REVERTED',
    recoverable: true,
  },
  'call revert': {
    title: 'Contract Error',
    message: 'The contract rejected this operation',
    code: 'CALL_REVERT',
    recoverable: true,
  },
};

// Database/Supabase errors
const DB_ERRORS: Record<string, ParsedError> = {
  '23505': {
    title: 'Already Exists',
    message: 'This record already exists',
    code: 'DUPLICATE',
    recoverable: false,
  },
  '23503': {
    title: 'Reference Error',
    message: 'The referenced item does not exist',
    code: 'FOREIGN_KEY',
    recoverable: false,
  },
  '42501': {
    title: 'Access Denied',
    message: 'You don\'t have permission for this action',
    code: 'RLS_VIOLATION',
    recoverable: false,
  },
  'PGRST116': {
    title: 'Not Found',
    message: 'The requested item was not found',
    code: 'NOT_FOUND',
    recoverable: false,
  },
};

// NFT specific errors
const NFT_ERRORS: Record<string, ParsedError> = {
  'not listed': {
    title: 'NFT Not Listed',
    message: 'This NFT is no longer available for sale',
    code: 'NOT_LISTED',
    recoverable: false,
  },
  'already listed': {
    title: 'Already Listed',
    message: 'This NFT is already listed for sale',
    code: 'ALREADY_LISTED',
    recoverable: false,
  },
  'not owner': {
    title: 'Not Owner',
    message: 'You don\'t own this NFT',
    code: 'NOT_OWNER',
    recoverable: false,
  },
  'offer exists': {
    title: 'Offer Exists',
    message: 'You already have a pending offer on this NFT',
    code: 'OFFER_EXISTS',
    recoverable: false,
  },
  'auction ended': {
    title: 'Auction Ended',
    message: 'This auction has already ended',
    code: 'AUCTION_ENDED',
    recoverable: false,
  },
  'bid too low': {
    title: 'Bid Too Low',
    message: 'Your bid must be higher than the current bid',
    code: 'BID_TOO_LOW',
    recoverable: true,
  },
};

export const parseError = (error: any): ParsedError => {
  // Handle null/undefined
  if (!error) {
    return {
      title: 'Unknown Error',
      message: 'An unexpected error occurred',
      recoverable: true,
    };
  }

  // Get error message string
  const errorMessage = (
    error.message || 
    error.reason || 
    error.error?.message || 
    error.data?.message ||
    (typeof error === 'string' ? error : JSON.stringify(error))
  ).toLowerCase();

  // Check web3 errors
  for (const [key, value] of Object.entries(WEB3_ERRORS)) {
    if (errorMessage.includes(key)) {
      return value;
    }
  }

  // Check database errors
  const errorCode = error.code || error.error?.code;
  if (errorCode && DB_ERRORS[errorCode]) {
    return DB_ERRORS[errorCode];
  }

  // Check NFT errors
  for (const [key, value] of Object.entries(NFT_ERRORS)) {
    if (errorMessage.includes(key)) {
      return value;
    }
  }

  // Default error
  return {
    title: 'Error',
    message: truncateMessage(error.message || error.reason || 'Something went wrong'),
    recoverable: true,
  };
};

const truncateMessage = (message: string, maxLength = 100): string => {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + '...';
};

// Helper for toast notifications
export const getErrorToast = (error: any): { title: string; description: string; variant: 'destructive' } => {
  const parsed = parseError(error);
  return {
    title: parsed.title,
    description: parsed.message,
    variant: 'destructive',
  };
};

// Helper for checking if error is user-initiated cancellation
export const isUserCancellation = (error: any): boolean => {
  const message = (error?.message || error?.reason || '').toLowerCase();
  return message.includes('user rejected') || 
         message.includes('user denied') || 
         message.includes('cancelled');
};