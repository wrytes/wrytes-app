import React from 'react';
import { useAccount, useSignTypedData, useChainId } from 'wagmi';
import { parseUnits } from 'viem';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { AmountInput } from '@/components/ui/AmountInput';
import { DateTimeInput } from '@/components/ui/DateTimeInput';
import { TokenSelector } from '@/components/ui/TokenSelector';
import { AddressSelector } from '@/components/ui/AddressSelector';
import {
  useAuthorizationForm,
  useAuthorizationAddresses,
  OperationKind,
} from '@/hooks/authorization';
import { useCowTokenList } from '@/hooks/tokens';

interface AuthorizationFormProps {
  selectedAddress?: string;
  onAddressChange?: (address: string) => void;
}

export const AuthorizationForm: React.FC<AuthorizationFormProps> = ({
  selectedAddress,
  onAddressChange,
}) => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { signTypedData, data: signature, isPending, error } = useSignTypedData();
  const { addresses } = useAuthorizationAddresses();
  const { getTokenByAddress } = useCowTokenList(chainId);

  const {
    authorization,
    verifyingContract,
    selectedTokenDecimals,
    errors,
    updateField,
    updateVerifyingContract,
    updateTokenDecimals,
    generateFormNonce,
    validateForm,
    resetForm,
  } = useAuthorizationForm();

  // Update from address when selectedAddress changes
  React.useEffect(() => {
    if (selectedAddress && selectedAddress !== authorization.from) {
      updateField('from', selectedAddress);
    }
  }, [selectedAddress, authorization.from, updateField]);

  const handleTokenChange = (tokenAddress: string, tokenConfig: any) => {
    updateField('token', tokenAddress);
    updateTokenDecimals(tokenConfig.decimals);
  };

  const handleAddressChange = (address: string) => {
    updateField('from', address);
    onAddressChange?.(address);
  };

  const handleMaxClick = () => {
    updateField('amount', '1000'); // Mock max amount
  };

  const getCurrentTimestamp = () => {
    return Math.floor(Date.now() / 1000).toString();
  };

  const getOneHourFromNow = () => {
    return Math.floor((Date.now() + 3600000) / 1000).toString();
  };

  const handleQuickSetTimes = () => {
    updateField('validAfter', getCurrentTimestamp());
    updateField('validBefore', getOneHourFromNow());
  };

  const handleSign = async () => {
    if (!isConnected || !validateForm()) return;

    try {
      // EIP-712 domain
      const domain = {
        name: 'AuthorizationProcessor',
        version: '1',
        chainId: chainId,
        verifyingContract: verifyingContract as `0x${string}`,
      };

      // EIP-712 types
      const types = {
        Authorization: [
          { name: 'kind', type: 'uint8' },
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'nonce', type: 'bytes32' },
          { name: 'validAfter', type: 'uint256' },
          { name: 'validBefore', type: 'uint256' },
        ],
      };

      // Message data
      const message = {
        kind: authorization.kind,
        from: authorization.from as `0x${string}`,
        to: authorization.to as `0x${string}`,
        token: authorization.token as `0x${string}`,
        amount: parseUnits(authorization.amount || '0', selectedTokenDecimals),
        nonce: authorization.nonce as `0x${string}`,
        validAfter: BigInt(authorization.validAfter || '0'),
        validBefore: BigInt(authorization.validBefore || '0'),
      };

      await signTypedData({
        domain,
        types,
        primaryType: 'Authorization',
        message,
      });
    } catch (err) {
      console.error('Failed to sign typed data:', err);
    }
  };

  const isFormValid =
    authorization.from &&
    authorization.to &&
    authorization.token &&
    authorization.amount &&
    authorization.nonce &&
    authorization.validAfter &&
    authorization.validBefore &&
    verifyingContract &&
    Object.keys(errors).length === 0;

  return (
    <Card>
      <div className="p-6 space-y-6">
        <h3 className="text-lg font-semibold text-white">Authorization Parameters</h3>

        {!isConnected && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-400 text-sm">Please connect your wallet to continue</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Verifying Contract */}
          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">
              AuthorizationProcessor Contract
            </label>
            <input
              type="text"
              value={verifyingContract}
              onChange={e => updateVerifyingContract(e.target.value)}
              placeholder="0x... (AuthorizationProcessor contract address)"
              className={`
                w-full bg-dark-surface border rounded-lg px-4 py-3 text-white placeholder-text-secondary 
                focus:outline-none transition-colors
                ${
                  errors.verifyingContract
                    ? 'border-red-400 focus:border-red-400'
                    : 'border-dark-border focus:border-accent-orange'
                }
              `}
            />
            {errors.verifyingContract && (
              <p className="text-red-400 text-xs mt-1">{errors.verifyingContract}</p>
            )}
          </div>

          {/* Operation Kind */}
          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">
              Operation Kind
            </label>
            <select
              value={authorization.kind}
              onChange={e => updateField('kind', Number(e.target.value) as OperationKind)}
              className="w-full bg-dark-surface border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent-orange"
            >
              <option value={OperationKind.TRANSFER}>TRANSFER</option>
              <option value={OperationKind.DEPOSIT}>DEPOSIT</option>
              <option value={OperationKind.PROCESS}>PROCESS (Internal Transfer)</option>
              <option value={OperationKind.CLAIM}>CLAIM (Withdrawal)</option>
            </select>
          </div>

          {/* From Address Selector */}
          <AddressSelector
            selectedAddress={authorization.from}
            onChange={handleAddressChange}
            addresses={addresses}
            title="From Address"
            placeholder="Select source address"
            error={errors.from}
          />

          {/* To Address */}
          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">To Address</label>
            <input
              type="text"
              value={authorization.to}
              onChange={e => updateField('to', e.target.value)}
              placeholder="0x..."
              className={`
                w-full bg-dark-surface border rounded-lg px-4 py-3 text-white placeholder-text-secondary 
                focus:outline-none transition-colors
                ${
                  errors.to
                    ? 'border-red-400 focus:border-red-400'
                    : 'border-dark-border focus:border-accent-orange'
                }
              `}
            />
            {errors.to && <p className="text-red-400 text-xs mt-1">{errors.to}</p>}
          </div>

          {/* Token Selector */}
          <TokenSelector
            selectedToken={authorization.token}
            onChange={handleTokenChange}
            title="Token"
            error={errors.token}
          />

          {/* Amount Input */}
          <AmountInput
            title="Amount"
            amount={authorization.amount}
            onAmountChange={value => updateField('amount', value)}
            symbol={getTokenByAddress(authorization.token)?.symbol ?? 'TOKEN'}
            decimals={selectedTokenDecimals}
            availableBalance={BigInt('1000000000000000000000')} // Mock balance
            onMaxClick={handleMaxClick}
            placeholder="0.0"
            error={errors.amount}
          />

          {/* Nonce Generation */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-text-secondary text-sm font-medium">
                Nonce (bytes32)
              </label>
              <Button variant="outline" onClick={generateFormNonce} className="!py-1 !px-3 text-xs">
                <FontAwesomeIcon icon={faWandMagicSparkles} className="w-3 h-3 mr-1" />
                Generate
              </Button>
            </div>
            <input
              type="text"
              value={authorization.nonce}
              onChange={e => updateField('nonce', e.target.value)}
              placeholder="0x0000000000000000000000000000000000000000000000000000000000000000"
              className={`
                w-full bg-dark-surface border rounded-lg px-4 py-3 text-white placeholder-text-secondary 
                focus:outline-none transition-colors font-mono text-xs
                ${
                  errors.nonce
                    ? 'border-red-400 focus:border-red-400'
                    : 'border-dark-border focus:border-accent-orange'
                }
              `}
            />
            {errors.nonce && <p className="text-red-400 text-xs mt-1">{errors.nonce}</p>}
          </div>

          {/* Time Range Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateTimeInput
              value={authorization.validAfter}
              onChange={value => updateField('validAfter', value)}
              title="Valid After"
              error={errors.validAfter}
            />

            <DateTimeInput
              value={authorization.validBefore}
              onChange={value => updateField('validBefore', value)}
              title="Valid Before"
              error={errors.validBefore}
            />
          </div>

          {/* Quick Time Set */}
          <div className="flex justify-center">
            <Button variant="outline" onClick={handleQuickSetTimes} className="text-sm">
              <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 mr-2" />
              Set: Now → 1 Hour
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="primary"
            onClick={handleSign}
            disabled={!isConnected || isPending}
            className="flex-1"
          >
            {isPending ? 'Signing...' : 'Sign Authorization (EIP-712)'}
          </Button>

          <Button variant="secondary" onClick={resetForm} disabled={isPending}>
            Reset
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">Error: {error.message}</p>
          </div>
        )}

        {/* Signature Display */}
        {signature && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <h4 className="text-green-400 font-semibold mb-2">Signature Generated:</h4>
            <p className="text-green-300 text-xs font-mono break-all">{signature}</p>
          </div>
        )}
      </div>
    </Card>
  );
};
