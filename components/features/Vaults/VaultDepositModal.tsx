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
import { erc4626ABI } from '@/lib/vaults/abi';
import { useAppKitAccount } from '@reown/appkit/react';
import { formatCompactNumber } from '@/lib/utils/format-number';
import { shortenAddress } from '@/lib/utils/format-string';

interface VaultDepositModalProps {
  vault: Vault;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const VaultDepositModal: React.FC<VaultDepositModalProps> = ({
  vault,
  isOpen,
  onClose,
  onSuccess, // when added to the queue
}) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [depositMode, setDepositMode] = useState<'deposit' | 'mint'>('deposit');

  const { isDepositing, isMinting, calculateSharesFromAssets, calculateAssetsFromShares } =
    useVaultActions(vault.address);
  const {
    assetBalance,
    assetSymbol,
    assetDecimals,
    loading: assetBalanceLoading,
  } = useVaultUserData(vault);
  const { apy, loading: vaultLoading } = useVaultData(vault);
  const { address: userAddress } = useAppKitAccount();
  const { addTransaction } = useTransactionQueue();

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setError('');

    // Validate amount
    if (value && parseFloat(value) > 0) {
      const numValue = parseFloat(value);
      const maxDecimals = depositMode === 'deposit' ? assetDecimals : vault.decimals;
      const availableBalance = getAvailableBalance();
      const availableBalanceFormatted = parseFloat(formatUnits(availableBalance, maxDecimals));

      if (numValue > availableBalanceFormatted) {
        const balanceSymbol = depositMode === 'deposit' ? assetSymbol : vault.symbol;
        setError(
          `Insufficient balance. You have ${formatUnits(availableBalance, maxDecimals)} ${balanceSymbol}`
        );
      }
    } else if (value && parseFloat(value) <= 0) {
      setError('Amount must be greater than 0');
    }
  };

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (error) return;

    try {
      const decimalsToUse = depositMode === 'deposit' ? assetDecimals : vault.decimals;
      const amountInWei = parseUnits(amount, decimalsToUse);

      // approve tx
      const approveTitle = `Approve ${formatCompactNumber(amount)} ${assetSymbol} to ${vault.name}`;
      const approveSubtitle = `Receiver is ${shortenAddress(userAddress as `0x${string}`)}`;

      // vault action tx
      const transactionTitle =
        depositMode === 'deposit'
          ? `Deposit ${formatCompactNumber(amount)} ${assetSymbol} to ${vault.name}`
          : `Mint ${formatCompactNumber(amount)} ${vault.symbol} shares from ${vault.name}`;
      const transactionSubtitle = `Receiver is ${shortenAddress(userAddress as `0x${string}`)}`;

      // Add transaction to queue
      const queueTransactions = await addTransaction([
        {
          title: approveTitle,
          subtitle: approveSubtitle,
          chainId: 1, // Ethereum mainnet
          type: 'approve',
          contractAddress: vault.asset.address,
          abi: erc4626ABI,
          functionName: 'approve',
          args: [vault.address, amountInWei],
          value: '0',
          // Token metadata for UI display
          tokenAddress: vault.asset.address,
          tokenDecimals: decimalsToUse,
          tokenAmount: amount,
          tokenSymbol: depositMode === 'deposit' ? assetSymbol : vault.symbol,
        },
        {
          title: transactionTitle,
          subtitle: transactionSubtitle,
          chainId: 1, // Ethereum mainnet
          type: depositMode === 'deposit' ? 'deposit' : 'mint',
          contractAddress: vault.address,
          abi: erc4626ABI,
          functionName: depositMode === 'deposit' ? 'deposit' : 'mint',
          args: [amountInWei, userAddress as `0x${string}`],
          value: '0',
          // Token metadata for UI display
          tokenAddress: vault.asset.address,
          tokenDecimals: decimalsToUse,
          tokenAmount: amount,
          tokenSymbol: depositMode === 'deposit' ? assetSymbol : vault.symbol,
          // Vault metadata
          tokenOutAddress: depositMode === 'deposit' ? vault.address : vault.asset.address,
          tokenOutDecimals: depositMode === 'deposit' ? vault.decimals : assetDecimals,
          tokenOutAmount: depositMode === 'deposit' ? calculateEstimatedShares() : amount,
          tokenOutSymbol: depositMode === 'deposit' ? vault.symbol : assetSymbol,
        },
      ]);

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
      if (depositMode === 'deposit') {
        // In deposit mode, calculate shares from assets
        const amountInWei = parseUnits(amount, assetDecimals);
        const shares = calculateSharesFromAssets(amountInWei);
        return formatUnits(shares, vault.decimals);
      } else {
        // In mint mode, the amount is already in shares
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
      if (depositMode === 'mint') {
        // In mint mode, calculate assets needed from shares
        const amountInWei = parseUnits(amount, vault.decimals);
        const assets = calculateAssetsFromShares(amountInWei);
        return formatUnits(assets, assetDecimals);
      } else {
        // In deposit mode, the amount is already in assets
        return amount;
      }
    } catch {
      return '0';
    }
  };

  const getAvailableBalance = () => {
    return depositMode === 'deposit' ? assetBalance : calculateSharesFromAssets(assetBalance);
  };

  const handleMaxClick = () => {
    if (depositMode === 'deposit') {
      // In deposit mode, use full asset balance
      const maxAmount = formatUnits(assetBalance, assetDecimals);
      setAmount(maxAmount);
    } else {
      // In mint mode, use estimated shares from available assets
      try {
        const shares = calculateSharesFromAssets(assetBalance);
        const maxAmount = formatUnits(shares, vault.decimals);
        setAmount(maxAmount);
      } catch {
        setAmount('0');
      }
    }
  };

  const getInputTitle = () => {
    return depositMode === 'deposit'
      ? `Amount to Deposit (${assetSymbol})`
      : `Shares to Mint (${vault.symbol})`;
  };

  const getInputSymbol = () => {
    return depositMode === 'deposit' ? assetSymbol : vault.symbol;
  };

  const getInputDecimals = () => {
    return depositMode === 'deposit' ? assetDecimals : vault.decimals;
  };

  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setError('');
      setDepositMode('deposit');
    }
  }, [isOpen]);

  useEffect(() => {
    setError('');
    handleAmountChange(amount);
  }, [depositMode, amount, handleAmountChange]);

  if (!isOpen) return null;

  const isLoading = isDepositing || isMinting;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-xl p-6 w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Deposit to {vault.name}</h2>
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

        {/* Deposit Mode Toggle */}
        <div className="mb-6">
          <label className="block text-text-secondary text-sm mb-2">Deposit Mode</label>
          <div className="flex bg-dark-surface rounded-lg p-1">
            <button
              onClick={() => setDepositMode('deposit')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                depositMode === 'deposit'
                  ? 'bg-accent-orange text-white'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              Deposit
            </button>
            <button
              onClick={() => setDepositMode('mint')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                depositMode === 'mint'
                  ? 'bg-accent-orange text-white'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              Mint
            </button>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            {depositMode === 'deposit'
              ? `Deposit ${assetSymbol} tokens to receive vault shares`
              : `Specify exact shares to mint (requires ${assetSymbol} tokens)`}
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
          {depositMode === 'deposit' ? (
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Estimated Shares:</span>
              <span className="text-white font-medium">
                {calculateEstimatedShares()} {vault.symbol}
              </span>
            </div>
          ) : (
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Needed Assets:</span>
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
                {depositMode === 'deposit'
                  ? `You will deposit ${assetSymbol} tokens and receive ${vault.symbol} shares based on the current exchange rate.`
                  : `You will mint exact ${vault.symbol} shares by depositing the required amount of ${assetSymbol} tokens.`}{' '}
                APY rates are variable and may change over time.
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
            onClick={handleDeposit}
            disabled={isLoading || !amount || !!error || assetBalance === 0n}
            className="flex-1 bg-accent-orange hover:bg-accent-orange/90 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : depositMode === 'deposit' ? (
              'Deposit'
            ) : (
              'Mint'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
