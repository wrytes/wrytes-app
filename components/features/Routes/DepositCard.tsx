import { useState, useEffect, useCallback } from 'react';
import { useAppKitAccount } from '@reown/appkit-controllers/react';
import { readContract, writeContract } from 'wagmi/actions';
import { parseUnits } from 'viem';
import { faArrowUpFromBracket } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import TokenInput from '@/components/ui/Input/TokenInput';
import { SelectInput } from '@/components/ui/Input/SelectInput';
import ButtonInput from '@/components/ui/Input/ButtonInput';
import { showToast } from '@/components/ui';
import { WAGMI_CONFIG } from '@/lib/web3/config';
import { TOKENS, type TokenConfig } from '@/lib/tokens/config';
import type { OffRampRoute } from './types';

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

const DEPOSIT_TOKENS: TokenConfig[] = [
  TOKENS.USDC,
  TOKENS.USDT,
  TOKENS.DAI,
  TOKENS.ZCHF,
  TOKENS.USDU,
];

// Minimum deposit enforced before the send button enables
const MIN_DEPOSIT_HUMAN = '1';

interface Props {
  routes: OffRampRoute[];
}

export function DepositCard({ routes }: Props) {
  const { address, isConnected } = useAppKitAccount();

  const [token, setToken] = useState<TokenConfig>(TOKENS.USDC);
  const [amount, setAmount] = useState('');
  const [routeId, setRouteId] = useState('');
  const [balance, setBalance] = useState<bigint>(0n);
  const [sending, setSending] = useState(false);

  const activeRoutes = routes.filter(r => r.status === 'ACTIVE');
  const selectedRoute = activeRoutes.find(r => r.id === routeId);

  const minAmount = parseUnits(MIN_DEPOSIT_HUMAN, token.decimals);

  let amountBigInt = 0n;
  try {
    if (amount) amountBigInt = parseUnits(amount, token.decimals);
  } catch {
    amountBigInt = 0n;
  }

  const fetchBalance = useCallback(async () => {
    if (!isConnected || !address) {
      setBalance(0n);
      return;
    }
    try {
      const result = await readContract(WAGMI_CONFIG, {
        chainId: token.chainId,
        address: token.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      });
      setBalance(result as bigint);
    } catch {
      setBalance(0n);
    }
  }, [isConnected, address, token]);

  useEffect(() => {
    void fetchBalance();
  }, [fetchBalance]);

  const insufficientBalance = amountBigInt > 0n && amountBigInt > balance;
  const amountTooLow = amountBigInt > 0n && amountBigInt < minAmount;
  const canSend =
    isConnected && !!selectedRoute && amountBigInt >= minAmount && !insufficientBalance && !sending;

  const errorMsg = insufficientBalance
    ? 'Insufficient balance'
    : amountTooLow
    ? `Minimum: ${MIN_DEPOSIT_HUMAN} ${token.symbol}`
    : undefined;

  const handleSend = async () => {
    if (!canSend || !selectedRoute) return;
    setSending(true);
    try {
      const hash = await writeContract(WAGMI_CONFIG, {
        chainId: token.chainId as 1,
        address: token.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [selectedRoute.depositAddress as `0x${string}`, amountBigInt],
      });
      showToast.success(`Deposit sent · ${hash.slice(0, 10)}…`);
      setAmount('');
      void fetchBalance();
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Transaction failed';
      const msg = raw.includes('User rejected') ? 'Transaction rejected' : raw.split('\n')[0];
      showToast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const tokenOptions = DEPOSIT_TOKENS.map(t => ({ value: t.symbol, label: t.symbol }));
  const routeOptions = activeRoutes.map(r => ({
    value: r.id,
    label: r.label ? `${r.label} · ${r.targetCurrency}` : `${r.depositAddress.slice(0, 6)}…${r.depositAddress.slice(-4)}`,
  }));

  return (
    <div className="bg-card border border-table-alt rounded-xl p-4 mb-6 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
        <FontAwesomeIcon icon={faArrowUpFromBracket} className="w-3 h-3" />
        Deposit to Route
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SelectInput
          label="Token"
          options={tokenOptions}
          value={token.symbol}
          onChange={sym => {
            const found = DEPOSIT_TOKENS.find(t => t.symbol === sym);
            if (found) {
              setToken(found);
              setAmount('');
            }
          }}
        />
        <SelectInput
          label="Route"
          options={routeOptions}
          value={routeId}
          onChange={setRouteId}
          placeholder={activeRoutes.length === 0 ? 'No active routes' : 'Select route…'}
          disabled={activeRoutes.length === 0}
        />
      </div>

      <TokenInput
        label="Amount"
        symbol={token.symbol}
        digit={token.decimals}
        value={amount}
        onChange={setAmount}
        max={balance}
        min={minAmount}
        limitLabel={isConnected ? 'Wallet' : undefined}
        limit={balance}
        limitDigit={token.decimals}
        error={errorMsg}
        disabled={!isConnected}
        showButtons={isConnected}
      />

      <ButtonInput
        label={sending ? 'Sending…' : 'Send Deposit'}
        variant="primary"
        onClick={() => void handleSend()}
        disabled={!canSend}
        loading={sending}
        className="w-full"
      />

      {!isConnected && (
        <p className="text-xs text-center text-text-muted">Connect your wallet to deposit</p>
      )}
    </div>
  );
}
