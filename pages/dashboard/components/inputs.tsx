import Head from 'next/head';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { parseUnits } from 'viem';
import Card from '@/components/ui/Card';
import AddressInput from '@/components/ui/Input/AddressInput';
import LiquidationSlider from '@/components/ui/Input/LiquidationSlider';
import NormalInput from '@/components/ui/Input/NormalInput';
import TextInput from '@/components/ui/Input/TextInput';
import TokenInput from '@/components/ui/Input/TokenInput';

const COMPONENT_PAGES = [
  { label: 'Display', href: '/dashboard/components/display' },
  { label: 'Inputs', href: '/dashboard/components/inputs' },
];

function ComponentsSubNav() {
  const { pathname } = useRouter();
  return (
    <div className="flex gap-1 mb-8 border-b border-input-border">
      {COMPONENT_PAGES.map(({ label, href }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              active
                ? 'border-text-primary text-text-primary'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-text-primary text-lg font-semibold mb-4 pb-2 border-b border-input-border">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">{children}</div>
    </div>
  );
}

function Example({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card>
      <p className="text-text-muted text-xs mb-3 font-medium uppercase tracking-wide">{label}</p>
      {children}
    </Card>
  );
}

export default function InputsComponentPage() {
  const [textDefault, setTextDefault] = useState('');
  const [textFilled, setTextFilled] = useState('hello@example.com');
  const [textWarning, setTextWarning] = useState('hello@example');

  const [addressDefault, setAddressDefault] = useState('');
  const [addressFilled, setAddressFilled] = useState('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
  const [addressWarning, setAddressWarning] = useState('0xabc123');

  const [normalDefault, setNormalDefault] = useState('');
  const [normalFilled, setNormalFilled] = useState('1500');
  const [normalWarning, setNormalWarning] = useState('9999');

  const [tokenDefault, setTokenDefault] = useState('');
  const [tokenFilled, setTokenFilled] = useState('500000000000000000000');
  const [tokenWarning, setTokenWarning] = useState('50000000000000000000000');

  const sliderMin = parseUnits('1000', 18);
  const sliderMax = parseUnits('5000', 18);
  const sliderSource = parseUnits('2500', 18);
  const [sliderDefault, setSliderDefault] = useState(parseUnits('2000', 18));
  const [sliderWarning, setSliderWarning] = useState(parseUnits('4500', 18));
  const [sliderDisabled] = useState(parseUnits('3000', 18));

  return (
    <>
      <Head>
        <title>Input Components – Wrytes</title>
      </Head>

      <ComponentsSubNav />
      <div className="mb-8">
        <h1 className="text-text-primary text-2xl font-bold">Input Components</h1>
        <p className="text-text-muted mt-1">
          All input variants — default, error, warning, disabled, and with notes.
        </p>
      </div>

      {/* TextInput */}
      <Section title="TextInput">
        <Example label="Default">
          <TextInput
            label="Email"
            placeholder="you@example.com"
            value={textDefault}
            onChange={setTextDefault}
          />
        </Example>
        <Example label="With value + error">
          <TextInput
            label="Email"
            value={textFilled}
            onChange={setTextFilled}
            error="Please enter a valid email address."
          />
        </Example>
        <Example label="Warning">
          <TextInput
            label="Email"
            value={textWarning}
            onChange={setTextWarning}
            warning="Looks like the domain is incomplete."
          />
        </Example>
        <Example label="Disabled + note">
          <TextInput
            label="Username"
            value="sam.wrytes"
            disabled
            note="Username cannot be changed."
          />
        </Example>
      </Section>

      {/* AddressInput */}
      <Section title="AddressInput">
        <Example label="Default">
          <AddressInput
            label="Recipient"
            placeholder="0x..."
            value={addressDefault}
            onChange={setAddressDefault}
            isTextLeft
          />
        </Example>
        <Example label="With value + error">
          <AddressInput
            label="Recipient"
            value={addressFilled}
            onChange={setAddressFilled}
            isTextLeft
            own="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
            limitLabel="0xd8dA6BF...96045"
            error="Address does not match expected owner."
          />
        </Example>
        <Example label="Warning">
          <AddressInput
            label="Recipient"
            value={addressWarning}
            onChange={setAddressWarning}
            isTextLeft
            warning="This does not look like a full EVM address."
          />
        </Example>
        <Example label="Disabled + note">
          <AddressInput
            label="Recipient"
            value="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
            disabled
            isTextLeft
            note="Address is locked to contract owner."
          />
        </Example>
      </Section>

      {/* NormalInput */}
      <Section title="NormalInput">
        <Example label="Default">
          <NormalInput
            label="Amount"
            symbol="ZCHF"
            value={normalDefault}
            onChange={setNormalDefault}
          />
        </Example>
        <Example label="With value + error">
          <NormalInput
            label="Amount"
            symbol="ZCHF"
            value={normalFilled}
            onChange={setNormalFilled}
            error="Amount exceeds available balance."
          />
        </Example>
        <Example label="Warning">
          <NormalInput
            label="Amount"
            symbol="ZCHF"
            value={normalWarning}
            onChange={setNormalWarning}
            warning="Amount is above the recommended limit."
          />
        </Example>
        <Example label="Disabled + output">
          <NormalInput
            label="You receive"
            symbol="USDC"
            value=""
            output="1,500.00"
            disabled
            note="Estimated value, subject to slippage."
          />
        </Example>
      </Section>

      {/* TokenInput */}
      <Section title="TokenInput">
        <Example label="Default">
          <TokenInput
            label="Deposit"
            symbol="WETH"
            value={tokenDefault}
            onChange={setTokenDefault}
            limitLabel="Balance"
            limit={parseUnits('2.5', 18)}
            max={parseUnits('2.5', 18)}
            digit={18n}
          />
        </Example>
        <Example label="With value + error">
          <TokenInput
            label="Deposit"
            symbol="WETH"
            value={tokenFilled}
            onChange={setTokenFilled}
            limitLabel="Balance"
            limit={parseUnits('2.5', 18)}
            max={parseUnits('2.5', 18)}
            digit={18n}
            error="Exceeds your wallet balance."
          />
        </Example>
        <Example label="Warning">
          <TokenInput
            label="Deposit"
            symbol="WETH"
            value={tokenWarning}
            onChange={setTokenWarning}
            limitLabel="Balance"
            limit={parseUnits('2.5', 18)}
            max={parseUnits('2.5', 18)}
            digit={18n}
            warning="Amount is very large — double check before submitting."
          />
        </Example>
        <Example label="Disabled + output">
          <TokenInput
            label="You receive"
            symbol="ZCHF"
            output="500.00"
            value=""
            disabled
            note="Calculated from current exchange rate."
          />
        </Example>
      </Section>

      {/* LiquidationSlider */}
      <Section title="LiquidationSlider">
        <Example label="Default">
          <LiquidationSlider
            label="Liquidation price"
            value={sliderDefault}
            onChange={setSliderDefault}
            sliderMin={sliderMin}
            sliderMax={sliderMax}
            sliderSource={sliderSource}
            min={sliderMin}
            max={sliderMax}
            limitLabel="Current price"
            limit={sliderSource}
            symbol="ZCHF"
          />
        </Example>
        <Example label="With error">
          <LiquidationSlider
            label="Liquidation price"
            value={sliderMin}
            onChange={() => {}}
            sliderMin={sliderMin}
            sliderMax={sliderMax}
            sliderSource={sliderSource}
            symbol="ZCHF"
            error="Liquidation price is at or below the minimum."
          />
        </Example>
        <Example label="Warning">
          <LiquidationSlider
            label="Liquidation price"
            value={sliderWarning}
            onChange={setSliderWarning}
            sliderMin={sliderMin}
            sliderMax={sliderMax}
            sliderSource={sliderSource}
            symbol="ZCHF"
            warning="Price is very close to the liquidation threshold."
          />
        </Example>
        <Example label="Disabled + note">
          <LiquidationSlider
            label="Liquidation price"
            value={sliderDisabled}
            onChange={() => {}}
            sliderMin={sliderMin}
            sliderMax={sliderMax}
            sliderSource={sliderSource}
            symbol="ZCHF"
            disabled
            note="Locked while position is active."
          />
        </Example>
      </Section>
    </>
  );
}
