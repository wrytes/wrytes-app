import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { Vault } from '@/lib/vaults/types';
import { useVaultActions } from '@/lib/vaults/vault';
import { useVaultUserData } from '@/hooks/vaults/useVaultUserData';
import { useVaultData } from '@/hooks/vaults/useVaultData';
import { parseUnits, formatUnits } from 'viem';
import { ColoredBadge } from '@/components/ui/Badge';
import { AmountInput } from '@/components/ui/AmountInput';
import { useTransactionQueue } from '@/hooks/redux/useTransactionQueue';
import { useAppKitAccount } from '@reown/appkit-controllers/react';
import { erc4626ABI } from '@/lib/vaults/abi';
import { formatCompactNumber } from '@/lib/utils/format-number';
import { shortenAddress } from '@/lib/utils/format-string';

interface VaultWithdrawModalProps {
  vault: Vault;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const VaultWithdrawModal: React.FC<VaultWithdrawModalProps> = ({
  vault,
  isOpen,
  onClose,
  onSuccess, // when added to the queue
}) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [withdrawMode, setWithdrawMode] = useState<'withdraw' | 'redeem'>('redeem');

  const { isWithdrawing, isRedeeming, calculateAssetsFromShares, calculateSharesFromAssets } =
    useVaultActions(vault.address);
  const {
    vaultBalance,
    vaultDecimals,
    assetDecimals,
    assetSymbol,
    loading: assetBalanceLoading,
  } = useVaultUserData(vault);
  const { apy, loading: vaultLoading } = useVaultData(vault);

  const { addTransaction } = useTransactionQueue();
  const { address: userAddress } = useAppKitAccount();

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setError('');

    // Validate amount
    if (value && parseFloat(value) > 0) {
      const numValue = parseFloat(value);
      const maxDecimals = withdrawMode === 'withdraw' ? assetDecimals : vault.decimals;
      const availableBalance = getAvailableBalance();
      const availableBalanceFormatted = parseFloat(formatUnits(availableBalance, maxDecimals));

      if (numValue > availableBalanceFormatted) {
        const balanceSymbol = withdrawMode === 'withdraw' ? assetSymbol : vault.symbol;
        setError(
          `Insufficient balance. You have ${formatUnits(availableBalance, maxDecimals)} ${balanceSymbol}`
        );
      }
    } else if (value && parseFloat(value) <= 0) {
      setError('Amount must be greater than 0');
    }
  };

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (error) return;

    try {
      const decimalsToUse = withdrawMode === 'withdraw' ? assetDecimals : vault.decimals;
      const amountInWei = parseUnits(amount, decimalsToUse);

      const transactionTitle =
        withdrawMode === 'withdraw'
          ? `Withdraw ${formatCompactNumber(amount)} ${assetSymbol} from ${vault.name}`
          : `Redeem ${formatCompactNumber(amount)} ${vault.symbol} from ${vault.name}`;

      const transactionSubtitle = `Receiver is ${shortenAddress(userAddress as `0x${string}`)}`;

      // Add transaction to queue with proper ERC4626 function parameters
      const transactionId = await addTransaction({
        title: transactionTitle,
        subtitle: transactionSubtitle,
        chainId: 1, // Ethereum mainnet
        type: withdrawMode === 'withdraw' ? 'withdraw' : 'redeem',
        contractAddress: vault.address,
        abi: erc4626ABI,
        functionName: withdrawMode === 'withdraw' ? 'withdraw' : 'redeem',
        args:
          withdrawMode === 'withdraw'
            ? [amountInWei, userAddress as `0x${string}`, userAddress as `0x${string}`] // assets, receiver, owner
            : [amountInWei, userAddress as `0x${string}`, userAddress as `0x${string}`], // shares, receiver, owner
        value: '0',
        gasLimit: '300000',
        // Token metadata for UI display
        tokenAddress: vault.asset.address,
        tokenDecimals: decimalsToUse,
        tokenAmount: amount,
        tokenSymbol: withdrawMode === 'withdraw' ? assetSymbol : vault.symbol,
        // Vault metadata
        tokenOutAddress: withdrawMode === 'withdraw' ? vault.asset.address : vault.address,
        tokenOutDecimals: withdrawMode === 'withdraw' ? assetDecimals : vault.decimals,
        tokenOutAmount: withdrawMode === 'withdraw' ? amount : calculateEstimatedAssets(),
        tokenOutSymbol: withdrawMode === 'withdraw' ? assetSymbol : vault.symbol,
      });

      // Trigger success callback if provided
      onSuccess();

      // Close modal after adding to queue
      onClose();
    } catch (error: unknown) {
      console.error('Failed to add transaction to queue:', error);
      setError('Failed to add transaction to queue');
    }
  };

  //to render in the preview
  const calculateEstimatedShares = () => {
    if (!amount || parseFloat(amount) <= 0) return '0';
    try {
      if (withdrawMode === 'withdraw') {
        // In withdraw mode, calculate shares needed from assets
        const amountInWei = parseUnits(amount, assetDecimals);
        const shares = calculateSharesFromAssets(amountInWei);
        return formatUnits(shares, vault.decimals);
      } else {
        // In redeem mode, the amount is already in shares
        return amount;
      }
    } catch {
      return '0';
    }
  };

  //to render in the preview
  const calculateEstimatedAssets = () => {
    if (!amount || parseFloat(amount) <= 0) return '0';
    try {
      if (withdrawMode === 'redeem') {
        // In redeem mode, calculate assets from shares
        const amountInWei = parseUnits(amount, vault.decimals);
        const assets = calculateAssetsFromShares(amountInWei);
        return formatUnits(assets, assetDecimals);
      } else {
        // In withdraw mode, the amount is already in assets
        return amount;
      }
    } catch {
      return '0';
    }
  };

  const getAvailableBalance = () => {
    return withdrawMode === 'withdraw' ? calculateAssetsFromShares(vaultBalance) : vaultBalance;
  };

  const handleMaxClick = () => {
    if (withdrawMode === 'redeem') {
      // In withdraw mode, use full asset balance
      const maxAmount = formatUnits(vaultBalance, vaultDecimals);
      setAmount(maxAmount);
    } else {
      // In redeem mode, use estimated shares from available assets
      try {
        const shares = calculateAssetsFromShares(vaultBalance);
        const maxAmount = formatUnits(shares, vault.decimals);
        setAmount(maxAmount);
      } catch {
        setAmount('0');
      }
    }
  };

  const getInputTitle = () => {
    return withdrawMode === 'withdraw' ? `Amount to Withdraw` : `Shares to Redeem`;
  };

  const getInputSymbol = () => {
    return withdrawMode === 'withdraw' ? assetSymbol : vault.symbol;
  };

  const getInputDecimals = () => {
    return withdrawMode === 'withdraw' ? assetDecimals : vault.decimals;
  };

  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setError('');
      setWithdrawMode('redeem');
    }
  }, [isOpen]);

  useEffect(() => {
    setError('');
    handleAmountChange(amount);
  }, [withdrawMode, amount, handleAmountChange]);

  if (!isOpen) return null;

  const isLoading = isWithdrawing || isRedeeming;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-xl p-6 w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Withdraw from {vault.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-text-secondary text-sm">{vault.symbol}</p>
              <ColoredBadge
                variant="risk"
                riskLevel={vault.riskLevel}
                text={vault.riskLevel.toUpperCase()}
                size="sm"
              />
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-white transition-colors p-2"
          >
            <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
          </button>
        </div>

        {/* Withdraw Mode Toggle */}
        <div className="mb-6">
          <label className="block text-text-secondary text-sm mb-2">Withdraw Mode</label>
          <div className="flex bg-dark-surface rounded-lg p-1">
            <button
              onClick={() => setWithdrawMode('withdraw')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                withdrawMode === 'withdraw'
                  ? 'bg-accent-orange text-white'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              Withdraw
            </button>
            <button
              onClick={() => setWithdrawMode('redeem')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                withdrawMode === 'redeem'
                  ? 'bg-accent-orange text-white'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              Redeem
            </button>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            {withdrawMode === 'withdraw'
              ? `Withdraw ${assetSymbol} tokens by burning ${vault.symbol} shares`
              : `Specify exact shares to redeem for ${assetSymbol} tokens`}
          </p>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <AmountInput
            amount={amount}
            onAmountChange={handleAmountChange}
            title={getInputTitle()}
            symbol={getInputSymbol()}
            decimals={getInputDecimals()}
            availableBalance={getAvailableBalance()}
            availableLabel={`Available`}
            onMaxClick={handleMaxClick}
            error={error}
            disabled={assetBalanceLoading}
          />
        </div>

        {/* Preview */}
        <div className="mb-6 p-4 bg-dark-surface/50 rounded-lg space-y-3">
          {withdrawMode === 'withdraw' ? (
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Estimated Shares:</span>
              <span className="text-white font-medium">
                {calculateEstimatedShares()} {vault.symbol}
              </span>
            </div>
          ) : (
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Estimated Assets:</span>
              <span className="text-white font-medium">
                {calculateEstimatedAssets()} {assetSymbol}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Current APY:</span>
            <span className="text-green-400 font-medium">
              {vaultLoading ? 'Loading...' : `${apy.toFixed(2)}%`}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Risk Level:</span>
            <ColoredBadge
              variant="risk"
              riskLevel={vault.riskLevel}
              text={vault.riskLevel.toUpperCase()}
              size="sm"
            />
          </div>
        </div>

        {/* Info Box */}
        <div className="mb-6 p-3 bg-blue-400/10 border border-blue-400/20 rounded-lg">
          <div className="flex items-start gap-2">
            <FontAwesomeIcon icon={faInfoCircle} className="w-4 h-4 text-blue-400 mt-0.5" />
            <div className="text-xs text-blue-400">
              <p className="font-medium mb-1">Important Information</p>
              <p>
                {withdrawMode === 'withdraw'
                  ? `You will withdraw ${assetSymbol} tokens by burning ${vault.symbol} shares based on the current exchange rate.`
                  : `You will redeem exact ${vault.symbol} shares for the corresponding amount of ${assetSymbol} tokens.`}{' '}
                Withdrawals may vary due to changes in the exchange rate while processing.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-dark-border text-white py-3 px-4 rounded-lg hover:bg-dark-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleWithdraw}
            disabled={isLoading || !amount || !!error || vaultBalance === 0n}
            className="flex-1 bg-accent-orange hover:bg-accent-orange/90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : withdrawMode === 'withdraw' ? (
              'Withdraw'
            ) : (
              'Redeem'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
