import {
  TradingSdk,
  OrderBookApi,
  OrderKind,
  SupportedChainId,
  SigningScheme,
  setGlobalAdapter,
} from '@cowprotocol/cow-sdk';
import { ViemAdapter } from '@cowprotocol/sdk-viem-adapter';
import type { PublicClient, WalletClient } from 'viem';
import type { SwapQuote, SwapSigningScheme, SwapExecutionResult } from './types';

const APP_CODE = 'Wrytes';

let tradingSdk: TradingSdk | null = null;
let orderBookApi: OrderBookApi | null = null;

function getOrderBookApi(): OrderBookApi {
  if (!orderBookApi) {
    orderBookApi = new OrderBookApi({
      chainId: SupportedChainId.MAINNET,
      env: 'prod',
    });
  }
  return orderBookApi;
}

export function initializeSdk(
  publicClient: PublicClient,
  walletClient: WalletClient,
): TradingSdk {
  const adapter = new ViemAdapter({
    provider: publicClient,
    walletClient,
  } as Parameters<typeof ViemAdapter.prototype.setProvider>[0] extends never
    ? never
    : { provider: PublicClient; walletClient: WalletClient });

  setGlobalAdapter(adapter);

  tradingSdk = new TradingSdk(
    {
      chainId: SupportedChainId.MAINNET,
      appCode: APP_CODE,
      env: 'prod',
    },
    {
      orderBookApi: getOrderBookApi(),
    },
    adapter,
  );

  return tradingSdk;
}

function getSdk(): TradingSdk {
  if (!tradingSdk) {
    throw new Error('CoW SDK not initialized. Call initializeSdk first.');
  }
  return tradingSdk;
}

export async function detectSigningScheme(
  address: string,
  publicClient: PublicClient,
): Promise<SwapSigningScheme> {
  try {
    const bytecode = await publicClient.getBytecode({
      address: address as `0x${string}`,
    });
    // If bytecode exists and is non-trivial, it's a contract wallet
    if (bytecode && bytecode !== '0x' && bytecode.length > 2) {
      return 'erc1271';
    }
    return 'eip712';
  } catch {
    return 'eip712';
  }
}

function mapSigningScheme(scheme: SwapSigningScheme): SigningScheme {
  switch (scheme) {
    case 'erc1271':
      return SigningScheme.EIP1271;
    case 'presign':
      return SigningScheme.PRESIGN;
    case 'eip712':
    default:
      return SigningScheme.EIP712;
  }
}

export async function getQuote(params: {
  sellToken: string;
  buyToken: string;
  sellTokenDecimals: number;
  buyTokenDecimals: number;
  amount: string;
  kind: 'sell' | 'buy';
  slippageBps: number;
  owner: string;
}): Promise<{ quote: SwapQuote; postOrder: () => Promise<SwapExecutionResult> }> {
  const sdk = getSdk();

  const quoteAndPost = await sdk.getQuote({
    kind: params.kind === 'sell' ? OrderKind.SELL : OrderKind.BUY,
    sellToken: params.sellToken,
    sellTokenDecimals: params.sellTokenDecimals,
    buyToken: params.buyToken,
    buyTokenDecimals: params.buyTokenDecimals,
    amount: params.amount,
    slippageBps: params.slippageBps,
  });

  const { quoteResults } = quoteAndPost;
  const { amountsAndCosts, orderToSign } = quoteResults;

  const sellAmount = BigInt(orderToSign.sellAmount);
  const buyAmount = BigInt(orderToSign.buyAmount);
  const feeAmount = BigInt(orderToSign.feeAmount);

  // Calculate exchange rate (buy per sell)
  const sellDec = 10 ** params.sellTokenDecimals;
  const buyDec = 10 ** params.buyTokenDecimals;
  const rate =
    sellAmount > 0n
      ? (Number(buyAmount) / buyDec / (Number(sellAmount) / sellDec)).toFixed(6)
      : '0';

  const quote: SwapQuote = {
    sellAmount,
    buyAmount,
    feeAmount,
    validTo: orderToSign.validTo,
    minimumReceived: BigInt(amountsAndCosts.afterSlippage.buyAmount),
    exchangeRate: rate,
    networkFeeSellCurrency: BigInt(
      amountsAndCosts.costs.networkFee.amountInSellCurrency,
    ),
    protocolFeeBps: amountsAndCosts.costs.protocolFee.bps,
  };

  const postOrder = async (): Promise<SwapExecutionResult> => {
    const result = await quoteAndPost.postSwapOrderFromQuote();
    return {
      orderId: result.orderId,
      txHash: result.txHash,
      signingScheme: result.signingScheme as unknown as SwapSigningScheme,
    };
  };

  return { quote, postOrder };
}

export async function checkAllowance(params: {
  tokenAddress: string;
  owner: string;
}): Promise<bigint> {
  const sdk = getSdk();
  return sdk.getCowProtocolAllowance({
    tokenAddress: params.tokenAddress,
    owner: params.owner,
  });
}

export async function approveToken(params: {
  tokenAddress: string;
  amount: bigint;
}): Promise<string> {
  const sdk = getSdk();
  return sdk.approveCowProtocol({
    tokenAddress: params.tokenAddress,
    amount: params.amount,
  });
}

export async function getOrderStatus(orderUid: string) {
  const api = getOrderBookApi();
  return api.getOrder(orderUid);
}

export function getOrderExplorerUrl(orderUid: string): string {
  return `https://explorer.cow.fi/orders/${orderUid}`;
}
