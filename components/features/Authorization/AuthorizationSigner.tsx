import React from 'react';
import { useAccount, useSignTypedData, useChainId } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { AmountInput } from '@/components/ui/AmountInput';
import { DateTimeInput } from '@/components/ui/DateTimeInput';
import {
  useAuthorizationForm,
  OperationKind,
  useAuthorizationBalance,
} from '@/hooks/authorization';
import { useBalance } from '@/hooks/web3/useBalance';
import { useCowTokenList } from '@/hooks/tokens';

interface AuthorizationSignerProps {
  selectedAddress?: string;
  onAddressChange?: (address: string) => void;
  selectedToken: string;
  selectedTokenDecimals: number;
  selectedOperation?: OperationKind;
}

export const AuthorizationSigner: React.FC<AuthorizationSignerProps> = ({
  selectedAddress,
  onAddressChange,
  selectedToken,
  selectedTokenDecimals,
  selectedOperation,
}) => {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { signTypedData, data: signature, isPending, error } = useSignTypedData();
  const { getTokenByAddress } = useCowTokenList(chainId);

  const { authorization, verifyingContract, errors, updateField, validateForm, resetForm } =
    useAuthorizationForm();

  // Fetch wallet balance for TRANSFER and DEPOSIT operations
  const { balance: walletBalance, loading: walletLoading } = useBalance({
    address: selectedAddress,
    token: selectedToken,
    chainId,
    enabled: !!selectedAddress && !!selectedToken,
  });

  // Fetch processor balance for PROCESS and CLAIM operations
  const { balance: processorBalance, loading: processorLoading } = useAuthorizationBalance({
    processorAddress: verifyingContract,
    owner: selectedAddress,
    token: selectedToken,
    chainId,
    enabled: !!selectedAddress && !!selectedToken && !!verifyingContract,
  });

  // Update from address when selectedAddress changes
  React.useEffect(() => {
    if (selectedAddress && selectedAddress !== authorization.from) {
      updateField('from', selectedAddress);
    }
  }, [selectedAddress, authorization.from, updateField]);

  // Update token when selectedToken changes
  React.useEffect(() => {
    if (selectedToken && selectedToken !== authorization.token) {
      updateField('token', selectedToken);
    }
  }, [selectedToken, authorization.token, updateField]);

  // Update operation when selectedOperation changes
  React.useEffect(() => {
    if (selectedOperation !== undefined && selectedOperation !== authorization.kind) {
      updateField('kind', selectedOperation);
    }
  }, [selectedOperation, authorization.kind, updateField]);

  // Determine which balance to use based on operation type
  const getAvailableBalance = (): bigint => {
    switch (selectedOperation) {
      case OperationKind.TRANSFER:
        return walletBalance; // Use wallet balance for outbound operations
      case OperationKind.DEPOSIT:
        return walletBalance; // Use wallet balance for outbound operations
      case OperationKind.PROCESS:
        return processorBalance; // Use processor balance for processor operations
      case OperationKind.CLAIM:
        return processorBalance; // Use processor balance for processor operations
      default:
        return 0n;
    }
  };

  const availableBalance = getAvailableBalance();
  const isBalanceLoading = walletLoading || processorLoading;

  const handleMaxClick = () => {
    if (availableBalance > 0n) {
      const maxAmount = formatUnits(availableBalance, selectedTokenDecimals);
      updateField('amount', maxAmount);
    }
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
    selectedOperation !== undefined &&
    Object.entries(errors).filter(i => i[1] != undefined).length === 0;

  const getTokenSymbol = () => {
    const token = getTokenByAddress(selectedToken);
    return token?.symbol ?? 'TOKEN';
  };

  return (
    <Card>
      <div className="space-y-6">
        {!isConnected && (
          <div className="p-4 bg-yellow-500/10 border border-gray-600 rounded-lg">
            <p className="text-yellow-400 text-sm">Please connect your wallet to continue</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* To Address */}
          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">To Address</label>
            <input
              type="text"
              value={authorization.to}
              onChange={e => updateField('to', e.target.value)}
              placeholder="0x... (destination address)"
              className={`
                w-full bg-dark-surface border rounded-lg px-4 py-3 text-white placeholder-text-secondary 
                focus:outline-none transition-colors
                ${
                  errors.to
                    ? 'border-red-400 focus:border-red-400'
                    : 'border-gray-600 focus:border-accent-orange'
                }
              `}
            />
            {errors.to && <p className="text-red-400 text-xs mt-1">{errors.to}</p>}
          </div>

          {/* Amount Input */}
          <AmountInput
            title="Amount"
            amount={authorization.amount}
            onAmountChange={value => updateField('amount', value)}
            symbol={getTokenSymbol()}
            decimals={selectedTokenDecimals}
            availableBalance={availableBalance}
            onMaxClick={handleMaxClick}
            placeholder="0.0"
            error={errors.amount}
          />

          {/* Nonce Input */}
          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">
              Security Nonce
            </label>
            <input
              type="text"
              value={authorization.nonce}
              onChange={e => updateField('nonce', e.target.value)}
              placeholder="Auto-generated secure nonce"
              className={`
                w-full bg-dark-surface border rounded-lg px-4 py-3 text-white placeholder-text-secondary font-mono text-sm
                focus:outline-none transition-colors
                ${
                  errors.nonce
                    ? 'border-red-400 focus:border-red-400'
                    : 'border-gray-600 focus:border-accent-orange'
                }
              `}
            />
            {errors.nonce && <p className="text-red-400 text-xs mt-1">{errors.nonce}</p>}
            <p className="text-text-secondary text-xs mt-1">
              Cryptographically secure random nonce to prevent replay attacks
            </p>
          </div>

          {/* Validity Period Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DateTimeInput
              title="Valid After"
              value={authorization.validAfter}
              onChange={value => updateField('validAfter', value)}
              error={errors.validAfter}
            />
            <DateTimeInput
              title="Valid Before"
              value={authorization.validBefore}
              onChange={value => updateField('validBefore', value)}
              error={errors.validBefore}
            />
          </div>

          {/* Security Info */}
          <div className="p-4 bg-blue-500/10 border border-gray-600 rounded-lg">
            <h4 className="text-blue-400 font-medium mb-2">Security Features</h4>
            <div className="text-sm text-blue-300 space-y-1">
              <p>• Auto-generated secure nonce prevents replay attacks</p>
              <p>• EIP-712 typed data signing for maximum security</p>
              <p>• Time-bounded authorization with custom validity period</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="primary"
            onClick={handleSign}
            disabled={!isConnected || !isFormValid || isPending}
            className="flex-1"
            loading={isPending}
          >
            {isPending ? 'Signing Authorization...' : 'Sign Authorization (EIP-712)'}
          </Button>

          <Button variant="secondary" onClick={resetForm} disabled={isPending}>
            Reset
          </Button>
        </div>

        {/* Form Validation Status */}
        {!isFormValid && selectedOperation !== undefined && (
          <div className="p-3 bg-yellow-500/10 border border-gray-600 rounded-lg">
            <p className="text-yellow-400 text-sm">
              {!authorization.to ? '• Please enter a destination address' : ''}
              {!authorization.amount ? '• Please enter an amount' : ''}
              {!isConnected ? '• Please connect your wallet' : ''}
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-gray-600 rounded-lg">
            <p className="text-red-400 text-sm">Error: {error.message}</p>
          </div>
        )}

        {/* Signature Display */}
        {signature && (
          <div className="p-4 bg-green-500/10 border border-gray-600 rounded-lg">
            <h4 className="text-green-400 font-semibold mb-3">
              ✓ Authorization Signed Successfully!
            </h4>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-green-300 font-medium">Operation Details:</p>
                  <p className="text-green-200">
                    {selectedOperation === OperationKind.TRANSFER && 'TRANSFER'}
                    {selectedOperation === OperationKind.DEPOSIT && 'DEPOSIT'}
                    {selectedOperation === OperationKind.PROCESS && 'PROCESS'}
                    {selectedOperation === OperationKind.CLAIM && 'CLAIM'}
                  </p>
                  <p className="text-green-200">
                    Amount: {authorization.amount} {getTokenSymbol()}
                  </p>
                </div>
                <div>
                  <p className="text-green-300 font-medium">Validity:</p>
                  <p className="text-green-200">Valid for 3 days</p>
                  <p className="text-green-200">Ready for submission</p>
                </div>
              </div>

              <div>
                <p className="text-green-300 font-medium mb-1">Signature:</p>
                <p className="text-green-200 text-xs font-mono break-all bg-green-500/5 p-2 rounded border border-green-500/20">
                  {signature}
                </p>
              </div>

              <div className="text-green-300 text-sm space-y-1">
                <p>✓ EIP-712 signature generated</p>
                <p>✓ Can be submitted to AuthorizationProcessor contract</p>
                <p>✓ Signature includes all necessary authorization data</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
