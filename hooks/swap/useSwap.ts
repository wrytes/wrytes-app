import { useState, useCallback, useEffect, useRef } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { TokenConfig } from '@/lib/tokens/config';
import { SwapQuote, SwapSigningScheme, SwapExecutionResult } from '@/lib/swap/types';
import {
  initializeSdk,
  detectSigningScheme,
  getQuote,
  checkAllowance,
  approveToken,
  getOrderExplorerUrl,
} from '@/lib/swap/cow-sdk';

interface UseSwapReturn {
  // Token selection
  sellToken: TokenConfig | null;
  buyToken: TokenConfig | null;
  setSellToken: (token: TokenConfig | null) => void;
  setBuyToken: (token: TokenConfig | null) => void;
  switchTokens: () => void;

  // Amounts
  sellAmount: string;
  buyAmount: string;
  setSellAmount: (amount: string) => void;

  // Slippage
  slippageBps: number;
  setSlippageBps: (bps: number) => void;

  // Quote
  quote: SwapQuote | null;
  isLoadingQuote: boolean;

  // Signing
  signingScheme: SwapSigningScheme;

  // Execution
  executeSwap: () => Promise<SwapExecutionResult>;
  isExecuting: boolean;

  // Validation
  canSwap: boolean;
  validationError: string | null;

  // Status
  error: string | null;
}

export function useSwap(): UseSwapReturn {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [sellToken, setSellToken] = useState<TokenConfig | null>(null);
  const [buyToken, setBuyToken] = useState<TokenConfig | null>(null);
  const [sellAmount, setSellAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');
  const [slippageBps, setSlippageBps] = useState(50); // 0.5% default
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [signingScheme, setSigningScheme] = useState<SwapSigningScheme>('eip712');
  const [error, setError] = useState<string | null>(null);

  // Store postOrder fn from latest quote
  const postOrderRef = useRef<(() => Promise<SwapExecutionResult>) | null>(null);

  // Initialize SDK when wallet is available
  useEffect(() => {
    if (publicClient && walletClient) {
      try {
        initializeSdk(publicClient, walletClient);
      } catch {
        // SDK init may fail before wallet is fully connected
      }
    }
  }, [publicClient, walletClient]);

  // Detect signing scheme when address changes
  useEffect(() => {
    if (!address || !publicClient) return;
    detectSigningScheme(address, publicClient).then(setSigningScheme);
  }, [address, publicClient]);

  // Fetch quote when inputs change (debounced)
  useEffect(() => {
    if (!sellToken || !buyToken || !sellAmount || !address) {
      setQuote(null);
      setBuyAmount('');
      postOrderRef.current = null;
      return;
    }

    const parsed = parseFloat(sellAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setQuote(null);
      setBuyAmount('');
      postOrderRef.current = null;
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingQuote(true);
      setError(null);

      try {
        const amountWei = parseUnits(sellAmount, sellToken.decimals).toString();

        const result = await getQuote({
          sellToken: sellToken.address,
          buyToken: buyToken.address,
          sellTokenDecimals: sellToken.decimals,
          buyTokenDecimals: buyToken.decimals,
          amount: amountWei,
          kind: 'sell',
          slippageBps,
          owner: address,
        });

        setQuote(result.quote);
        setBuyAmount(formatUnits(result.quote.buyAmount, buyToken.decimals));
        postOrderRef.current = result.postOrder;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Failed to fetch quote';
        setError(msg);
        setQuote(null);
        setBuyAmount('');
        postOrderRef.current = null;
      } finally {
        setIsLoadingQuote(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [sellToken, buyToken, sellAmount, slippageBps, address]);

  const switchTokens = useCallback(() => {
    setSellToken(buyToken);
    setBuyToken(sellToken);
    setSellAmount(buyAmount);
    setBuyAmount(sellAmount);
    setQuote(null);
    postOrderRef.current = null;
  }, [sellToken, buyToken, sellAmount, buyAmount]);

  // Validation
  let validationError: string | null = null;
  if (!isConnected) {
    validationError = 'Connect wallet';
  } else if (!sellToken) {
    validationError = 'Select sell token';
  } else if (!buyToken) {
    validationError = 'Select buy token';
  } else if (!sellAmount || parseFloat(sellAmount) <= 0) {
    validationError = 'Enter amount';
  } else if (!quote && !isLoadingQuote) {
    validationError = error || 'No quote available';
  }

  const canSwap =
    isConnected &&
    !!sellToken &&
    !!buyToken &&
    !!quote &&
    !isLoadingQuote &&
    !isExecuting &&
    !validationError;

  const executeSwap = useCallback(async (): Promise<SwapExecutionResult> => {
    if (!canSwap || !postOrderRef.current || !sellToken || !address) {
      throw new Error(validationError || 'Cannot swap');
    }

    setIsExecuting(true);
    setError(null);

    try {
      // Check and handle token approval
      const allowance = await checkAllowance({
        tokenAddress: sellToken.address,
        owner: address,
      });

      const requiredAmount = quote!.sellAmount + quote!.feeAmount;

      if (allowance < requiredAmount) {
        await approveToken({
          tokenAddress: sellToken.address,
          amount: requiredAmount,
        });
      }

      // Post the order
      const result = await postOrderRef.current();
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Swap failed';
      setError(msg);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  }, [canSwap, sellToken, address, quote, validationError]);

  return {
    sellToken,
    buyToken,
    setSellToken,
    setBuyToken,
    switchTokens,
    sellAmount,
    buyAmount,
    setSellAmount,
    slippageBps,
    setSlippageBps,
    quote,
    isLoadingQuote,
    signingScheme,
    executeSwap,
    isExecuting,
    canSwap,
    validationError,
    error,
  };
}
