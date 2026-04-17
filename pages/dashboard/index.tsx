import Head from 'next/head';
import { useState } from 'react';
import {
  faLightbulb,
  faWallet,
  faChartLine,
  faArrowRightArrowLeft,
  faShield,
  faArrowRight,
  faPlus,
  faTrash,
  faDownload,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuth } from '@/hooks/useAuth';
import { UserBadge } from '@/components/auth/RequireScope';
import { Breadcrumb, PageHeader, Section } from '@/components/ui/Layout';
import { StatGrid } from '@/components/ui/Stats';
import Card from '@/components/ui/Card';
import {
  ButtonInput,
  NormalInput,
  TokenInput,
  AddressInput,
  LiquidationSlider,
  TabInput,
  PageTabInput,
} from '@/components/ui/Input';
import {
  Table,
  TableBody,
  TableHead,
  TableHeadSearchable,
  TableRow,
  TableRowEmpty,
} from '@/components/ui/Table';
import { TokenLogo, ChainLogo } from '@/components/ui/logo';
import { Badge, CardTitle, Modal, ConfirmModal, showToast, IconLogo } from '@/components/ui';
import HeroSteps from '@/components/ui/HeroSteps';

// ─── Mock data ────────────────────────────────────────────────────────────────

const SEARCHABLE_HEADERS = ['Asset', 'Balance', 'Value (USD)', 'APY'];

const MOCK_POSITIONS = [
  { asset: 'WBNB', balance: '0.42', value: '$28,140', apy: '4.2%' },
  { asset: 'GHO', balance: '0.42', value: '$28,140', apy: '4.2%' },
  { asset: 'WETH', balance: '3.80', value: '$11,400', apy: '3.8%' },
  { asset: 'USDC', balance: '5,000', value: '$5,000', apy: '6.1%' },
  { asset: 'ZCHF', balance: '2,200', value: '$2,530', apy: '2.9%' },
];

const PROTOCOL_ROWS = [
  { protocol: 'Morpho Blue', chain: 'Ethereum', tvl: '$1.2B', yield: '5.4%' },
  { protocol: 'Frankencoin', chain: 'Ethereum', tvl: '$48M', yield: '2.9%' },
  { protocol: 'Aerodrome', chain: 'Base', tvl: '$620M', yield: '8.1%' },
];

const PROTOCOL_HEADERS = ['Protocol', 'Chain', 'TVL', 'Yield'];

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();

  // Input demo state
  const [sendAmount, setSendAmount] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [liqPrice, setLiqPrice] = useState(50_000n * 10n ** 18n);
  const [activeTab, setActiveTab] = useState('Deposit');

  // Searchable table state
  const [search, setSearch] = useState('');
  const [inWallet, setInWallet] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Modal state
  const [basicModalOpen, setBasicModalOpen] = useState(false);
  const [footerModalOpen, setFooterModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [dangerModalOpen, setDangerModalOpen] = useState(false);

  const [sortTab, setSortTab] = useState('Asset');
  const [sortReverse, setSortReverse] = useState(false);
  const handleSortChange = (col: string) => {
    if (col === sortTab) setSortReverse(r => !r);
    else {
      setSortTab(col);
      setSortReverse(false);
    }
  };

  const [protocolSortTab, setProtocolSortTab] = useState('Protocol');
  const [protocolSortReverse, setProtocolSortReverse] = useState(false);
  const handleProtocolSortChange = (col: string) => {
    if (col === protocolSortTab) setProtocolSortReverse(r => !r);
    else {
      setProtocolSortTab(col);
      setProtocolSortReverse(false);
    }
  };

  const filteredPositions = MOCK_POSITIONS.filter(p =>
    p.asset.toLowerCase().includes(search.toLowerCase())
  );

  const ethPrice = 3_000; // mock price for receive estimate
  const receiveOutput = sendAmount
    ? `≈ ${((Number(sendAmount) / 1e18) * ethPrice).toFixed(2)}`
    : undefined;

  const displayName = user?.telegramHandle
    ? `@${user.telegramHandle}`
    : user?.profile
      ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
      : user?.walletAddress
        ? `${user.walletAddress.slice(0, 6)}…${user.walletAddress.slice(-4)}`
        : null;

  return (
    <>
      <Head>
        <title>Dashboard - Wrytes</title>
        <meta name="description" content="Dashboard overview" />
      </Head>

      <Section>
        <PageHeader
          title="Dashboard Overview"
          description={`Welcome back${displayName ? `, ${displayName}` : ''}! Here's what's happening with your portfolio.`}
          icon={faLightbulb}
          userInfo={user && <UserBadge />}
        />
        <StatGrid
          stats={[
            {
              icon: faWallet,
              label: 'Total Value',
              value: '$47,070',
              color: 'orange',
              trend: { value: 3.4, direction: 'up', label: '24h' },
            },
            {
              icon: faChartLine,
              label: 'Avg. APY',
              value: '4.25%',
              color: 'green',
              trend: { value: 0.2, direction: 'up', label: 'vs last week' },
            },
            {
              icon: faArrowRightArrowLeft,
              label: 'Transactions',
              value: '38',
              color: 'blue',
              trend: { value: 5, direction: 'up', label: 'this month' },
            },
            {
              icon: faShield,
              label: 'Health Factor',
              value: '2.41',
              color: 'purple',
              trend: { value: 0.1, direction: 'down', label: 'vs entry' },
            },
          ]}
          columns={{ base: 1, md: 2, lg: 4 }}
        />
      </Section>

      {/* ── Button demos ──────────────────────────────────────────────── */}
      <Section title="Button Components">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Variants */}
          <Card>
            <CardTitle title="Variants" />
            <div className="flex flex-wrap gap-3">
              <ButtonInput label="Primary" variant="primary" />
              <ButtonInput label="Secondary" variant="secondary" />
              <ButtonInput label="Outline" variant="outline" />
              <ButtonInput label="Ghost" variant="ghost" />
            </div>
          </Card>

          {/* Sizes */}
          <Card>
            <CardTitle title="Sizes" />
            <div className="flex flex-wrap items-center gap-3">
              <ButtonInput label="Small" variant="primary" size="sm" />
              <ButtonInput label="Medium" variant="primary" size="md" />
              <ButtonInput label="Large" variant="primary" size="lg" />
            </div>
          </Card>

          {/* With icons */}
          <Card>
            <CardTitle title="With icons" />
            <div className="flex flex-wrap gap-3">
              <ButtonInput
                label="New Position"
                variant="primary"
                icon={<FontAwesomeIcon icon={faPlus} />}
              />
              <ButtonInput
                label="Export"
                variant="secondary"
                icon={<FontAwesomeIcon icon={faDownload} />}
              />
              <ButtonInput
                label="Continue"
                variant="outline"
                icon={<FontAwesomeIcon icon={faArrowRight} />}
              />
              <ButtonInput
                label="Delete"
                variant="ghost"
                icon={<FontAwesomeIcon icon={faTrash} />}
                className="text-red-400 hover:text-red-300"
              />
            </div>
          </Card>

          {/* States + second button */}
          <Card>
            <CardTitle title="States & paired buttons" />
            <div className="space-y-3">
              <ButtonInput label="Disabled" variant="primary" disabled />
              <ButtonInput
                label="Loading…"
                variant="primary"
                loading
                icon={<FontAwesomeIcon icon={faSpinner} />}
              />
              <ButtonInput
                label="Confirm"
                variant="primary"
                second={{ label: 'Cancel', variant: 'secondary' }}
              />
              <ButtonInput
                label="Deposit"
                variant="primary"
                className="flex-1"
                second={{ label: 'Withdraw', variant: 'outline', className: 'flex-1' }}
              />
            </div>
          </Card>
        </div>
      </Section>

      {/* ── Badge demos ───────────────────────────────────────────────── */}
      <Section title="Badge Components">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Risk variants */}
          <Card>
            <CardTitle title="Risk levels" />
            <div className="flex flex-wrap gap-3">
              <Badge text="Low Risk" variant="risk" riskLevel="low" />
              <Badge text="Medium Risk" variant="risk" riskLevel="medium" />
              <Badge text="High Risk" variant="risk" riskLevel="high" />
            </div>
          </Card>

          {/* Sizes */}
          <Card>
            <CardTitle title="Sizes" />
            <div className="flex flex-wrap items-center gap-3">
              <Badge text="Small" variant="risk" riskLevel="low" size="sm" />
              <Badge text="Medium" variant="risk" riskLevel="low" size="md" />
              <Badge text="Large" variant="risk" riskLevel="low" size="lg" />
            </div>
          </Card>

          {/* Custom colors */}
          <Card>
            <CardTitle title="Custom colors" />
            <div className="flex flex-wrap gap-3">
              <Badge
                text="Active"
                variant="custom"
                customColor="text-orange-400"
                customBgColor="bg-orange-400/20"
              />
              <Badge
                text="Pending"
                variant="custom"
                customColor="text-blue-400"
                customBgColor="bg-blue-400/20"
              />
              <Badge
                text="Paused"
                variant="custom"
                customColor="text-purple-400"
                customBgColor="bg-purple-400/20"
              />
              <Badge
                text="Closed"
                variant="custom"
                customColor="text-gray-400"
                customBgColor="bg-gray-400/20"
              />
            </div>
          </Card>

          {/* In context */}
          <Card>
            <CardTitle title="In context" />
            <div className="space-y-3 text-sm">
              {[
                {
                  label: 'Morpho Blue',
                  chain: 'Ethereum',
                  status: 'Active',
                  risk: 'low' as const,
                },
                {
                  label: 'Frankencoin',
                  chain: 'Ethereum',
                  status: 'Pending',
                  risk: 'medium' as const,
                },
                { label: 'Aerodrome', chain: 'Base', status: 'High Risk', risk: 'high' as const },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-text-primary font-medium">{row.label}</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      text={row.chain}
                      variant="custom"
                      customColor="text-blue-400"
                      customBgColor="bg-blue-400/10"
                      size="sm"
                    />
                    <Badge text={row.status} variant="risk" riskLevel={row.risk} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Section>

      {/* ── Input demos ───────────────────────────────────────────────── */}
      <Section title="Input Components">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* TokenInput */}
          <Card>
            <CardTitle title="TokenInput" />
            <TokenInput
              label="You send"
              symbol="ETH"
              digit={18n}
              value={sendAmount}
              onChange={setSendAmount}
              max={3_800n * 10n ** 15n}
              limitLabel="Balance"
              limit={3_800n * 10n ** 15n}
              limitDigit={18n}
              note="Enter the amount of ETH to send."
            />
            <div className="mt-4">
              <TokenInput
                label="You receive"
                symbol="ZCHF"
                digit={18n}
                value=""
                output={receiveOutput}
                disabled
                note="Estimated output at current rate."
              />
            </div>
          </Card>

          {/* NormalInput + AddressInput */}
          <Card>
            <CardTitle title="NormalInput & AddressInput" />
            <NormalInput
              label="Collateral amount"
              symbol="WBTC"
              digit={8}
              value={sendAmount}
              onChange={setSendAmount}
              note="Collateral to lock in the position."
            />
            <div className="mt-4">
              <AddressInput
                label="Recipient address"
                placeholder="0x…"
                value={toAddress}
                onChange={setToAddress}
                own="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
                note="Paste an address or use your own wallet."
                isTextLeft
              />
            </div>
          </Card>

          {/* LiquidationSlider */}
          <Card>
            <CardTitle title="LiquidationSlider" />
            <LiquidationSlider
              label="Liquidation price"
              value={liqPrice}
              digit={18}
              sliderMin={30_000n * 10n ** 18n}
              sliderMax={80_000n * 10n ** 18n}
              sliderSource={67_200n * 10n ** 18n}
              min={30_000n * 10n ** 18n}
              max={67_000n * 10n ** 18n}
              reset={50_000n * 10n ** 18n}
              symbol="USD"
              onChange={setLiqPrice}
              note="Drag to set your liquidation threshold. Reference = current market price."
            />
          </Card>

          {/* TabInput + PageTabInput */}
          <Card>
            <CardTitle title="TabInput & PageTabInput" />
            <TabInput
              tabs={['Deposit', 'Withdraw', 'Borrow']}
              tab={activeTab}
              setTab={setActiveTab}
            />
            <PageTabInput
              tabs={[
                {
                  label: 'Overview',
                  content: (
                    <div className="pt-2 text-sm space-y-2">
                      <div className="flex justify-between text-text-secondary">
                        <span>Active tab</span>
                        <span className="text-text-primary font-medium">{activeTab}</span>
                      </div>
                      <div className="flex justify-between text-text-secondary">
                        <span>Protocol</span>
                        <span className="text-text-primary font-medium">Morpho Blue</span>
                      </div>
                      <div className="flex justify-between text-text-secondary">
                        <span>Network</span>
                        <span className="text-text-primary font-medium">Ethereum</span>
                      </div>
                    </div>
                  ),
                },
                {
                  label: 'History',
                  badge: 3,
                  content: (
                    <div className="pt-2 text-sm text-text-secondary">
                      Recent transactions will appear here.
                    </div>
                  ),
                },
                {
                  label: 'Settings',
                  content: (
                    <div className="pt-2 text-sm text-text-secondary">
                      Advanced position settings.
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      </Section>

      {/* ── Searchable table ──────────────────────────────────────────── */}
      <Section title="TableHeadSearchable">
        <Table>
          <TableHeadSearchable
            searchPlaceholder="Search assets…"
            searchValue={search}
            onSearchChange={setSearch}
            inMyWallet={inWallet}
            onInMyWalletChange={setInWallet}
            filterOptions={[
              { label: 'Stablecoins', value: 'stable' },
              { label: 'BTC derivatives', value: 'btc' },
              { label: 'ETH derivatives', value: 'eth' },
            ]}
            activeFilters={activeFilters}
            onFiltersChange={setActiveFilters}
            headers={SEARCHABLE_HEADERS}
            tab={sortTab}
            reverse={sortReverse}
            tabOnChange={handleSortChange}
            colSpan={4}
            // logoPadding={true}
          />
          <TableBody>
            {filteredPositions.length === 0 ? (
              <TableRowEmpty>No assets match your search.</TableRowEmpty>
            ) : (
              filteredPositions.map(pos => (
                <TableRow
                  key={pos.asset}
                  headers={SEARCHABLE_HEADERS}
                  tab={sortTab}
                  colSpan={4}
                  rawHeader
                >
                  <div className="text-left font-semibold text-text-primary flex items-center gap-2">
                    <TokenLogo currency={pos.asset} size={6} />
                    {pos.asset}
                  </div>
                  <div className="text-right text-text-primary">{pos.balance}</div>
                  <div className="text-right text-text-primary">{pos.value}</div>
                  <div className="text-right text-green-400 font-medium">{pos.apy}</div>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Section>

      {/* ── Searchable table ──────────────────────────────────────────── */}
      <Section title="TableHeadSearchable - No Logo Adjustment">
        <Table>
          <TableHeadSearchable
            searchPlaceholder="Search assets…"
            searchValue={search}
            onSearchChange={setSearch}
            inMyWallet={inWallet}
            onInMyWalletChange={setInWallet}
            filterOptions={[
              { label: 'Stablecoins', value: 'stable' },
              { label: 'BTC derivatives', value: 'btc' },
              { label: 'ETH derivatives', value: 'eth' },
            ]}
            activeFilters={activeFilters}
            onFiltersChange={setActiveFilters}
            headers={SEARCHABLE_HEADERS}
            tab={sortTab}
            reverse={sortReverse}
            tabOnChange={handleSortChange}
            colSpan={4}
          />
          <TableBody>
            {filteredPositions.length === 0 ? (
              <TableRowEmpty>No assets match your search.</TableRowEmpty>
            ) : (
              filteredPositions.map(pos => (
                <TableRow
                  key={pos.asset}
                  headers={SEARCHABLE_HEADERS}
                  tab={sortTab}
                  colSpan={4}
                  rawHeader={true}
                >
                  <div className="text-left font-semibold text-text-primary flex items-center gap-2">
                    {pos.asset}
                  </div>
                  <div className="text-right text-text-primary">{pos.balance}</div>
                  <div className="text-right text-text-primary">{pos.value}</div>
                  <div className="text-right text-green-400 font-medium">{pos.apy}</div>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Section>

      {/* ── Sortable table ────────────────────────────────────────────── */}
      <Section title="TableHead (sortable)">
        <Table>
          <TableHead
            headers={PROTOCOL_HEADERS}
            tab={protocolSortTab}
            reverse={protocolSortReverse}
            tabOnChange={handleProtocolSortChange}
            colSpan={4}
            // logoPadding={true}
          />
          <TableBody>
            {PROTOCOL_ROWS.map(row => (
              <TableRow
                key={row.protocol}
                headers={PROTOCOL_HEADERS}
                tab={protocolSortTab}
                colSpan={4}
                rawHeader
              >
                <div className="text-left font-semibold text-text-primary flex items-center gap-2">
                  <ChainLogo chain={row.chain} size={6} />
                  {row.protocol}
                </div>
                <div className="text-right text-text-secondary flex items-center justify-end gap-2">
                  <ChainLogo chain={row.chain} size={4} />
                  {row.chain}
                </div>
                <div className="text-right text-text-primary">{row.tvl}</div>
                <div className="text-right text-green-400 font-medium">{row.yield}</div>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <Section title="TableHead (sortable) - No Logo Adjustments">
        <Table>
          <TableHead
            headers={PROTOCOL_HEADERS}
            tab={protocolSortTab}
            reverse={protocolSortReverse}
            tabOnChange={handleProtocolSortChange}
            colSpan={4}
          />
          <TableBody>
            {PROTOCOL_ROWS.map(row => (
              <TableRow
                key={row.protocol}
                headers={PROTOCOL_HEADERS}
                tab={protocolSortTab}
                colSpan={4}
                rawHeader={true}
              >
                <div className="text-left font-semibold text-text-primary flex items-center gap-2">
                  {row.protocol}
                </div>
                <div className="text-right text-text-secondary flex items-center justify-end gap-2">
                  <ChainLogo chain={row.chain} size={4} />
                  {row.chain}
                </div>
                <div className="text-right text-text-primary">{row.tvl}</div>
                <div className="text-right text-green-400 font-medium">{row.yield}</div>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>
      {/* ── IconLogo demos ────────────────────────────────────────────── */}
      <Section title="IconLogo">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sizes */}
          <Card>
            <CardTitle title="Sizes" />
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col items-center gap-2">
                <IconLogo
                  icon={<FontAwesomeIcon icon={faWallet} className="text-orange-400 text-xs" />}
                  size={6}
                />
                <span className="text-xs text-text-secondary">size 6</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <IconLogo
                  icon={<FontAwesomeIcon icon={faWallet} className="text-orange-400 text-sm" />}
                  size={8}
                />
                <span className="text-xs text-text-secondary">size 8</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <IconLogo
                  icon={<FontAwesomeIcon icon={faWallet} className="text-orange-400 text-base" />}
                  size={10}
                />
                <span className="text-xs text-text-secondary">size 10</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <IconLogo
                  icon={<FontAwesomeIcon icon={faWallet} className="text-orange-400 text-xl" />}
                  size={14}
                />
                <span className="text-xs text-text-secondary">size 14</span>
              </div>
            </div>
          </Card>

          {/* In context */}
          <Card>
            <CardTitle title="With icons" />
            <div className="flex flex-wrap gap-4">
              <IconLogo
                icon={<FontAwesomeIcon icon={faWallet} className="text-orange-400" />}
                size={10}
              />
              <IconLogo
                icon={<FontAwesomeIcon icon={faChartLine} className="text-green-400" />}
                size={10}
              />
              <IconLogo
                icon={<FontAwesomeIcon icon={faShield} className="text-blue-400" />}
                size={10}
              />
              <IconLogo
                icon={<FontAwesomeIcon icon={faArrowRightArrowLeft} className="text-purple-400" />}
                size={10}
              />
              <IconLogo
                icon={<FontAwesomeIcon icon={faLightbulb} className="text-yellow-400" />}
                size={10}
              />
            </div>
          </Card>
        </div>
      </Section>

      {/* ── HeroSteps demo ────────────────────────────────────────────── */}
      <Section title="HeroSteps">
        <CardTitle title="3-step flow" />
        <HeroSteps
          steps={[
            {
              icon: '1',
              title: 'Connect wallet',
              description: 'Link your MetaMask, WalletConnect, or Coinbase wallet to get started.',
            },
            {
              icon: '2',
              title: 'Select a vault',
              description:
                'Browse available lending vaults and pick the one that fits your risk profile.',
            },
            {
              icon: '3',
              title: 'Deposit & earn',
              description: 'Supply assets to start earning yield. Withdraw at any time.',
            },
          ]}
        />

        <CardTitle title="2-step flow" />
        <HeroSteps
          steps={[
            {
              icon: '1',
              title: 'Approve token',
              description:
                'Grant the protocol permission to move your tokens. One-time transaction.',
            },
            {
              icon: '2',
              title: 'Confirm deposit',
              description: 'Sign the deposit transaction to lock collateral and mint ZCHF.',
            },
          ]}
        />
      </Section>

      {/* ── Toast demos ───────────────────────────────────────────────── */}
      <Section title="Toast Notifications">
        <Card>
          <CardTitle title="Trigger toasts" />
          <div className="flex flex-wrap gap-3">
            <ButtonInput
              label="Success"
              variant="primary"
              onClick={() => showToast.success('Transaction confirmed. Funds are now deposited.')}
            />
            <ButtonInput
              label="Error"
              variant="error"
              onClick={() =>
                showToast.error('Transaction failed. Insufficient balance for gas fees.')
              }
            />
            <ButtonInput
              label="Info"
              variant="secondary"
              onClick={() => showToast.info('Signature required. Please check your wallet.')}
            />
            <ButtonInput
              label="Warning"
              variant="ghost"
              onClick={() => showToast.warning('Health factor approaching liquidation threshold.')}
            />
          </div>
        </Card>
      </Section>

      {/* ── Breadcrumb demos ──────────────────────────────────────────── */}
      <Section title="Breadcrumb">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardTitle title="Static path" />
            <Breadcrumb
              items={[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Vaults', href: '/vaults' },
                { label: 'Morpho Blue' },
              ]}
            />
          </Card>

          <Card>
            <CardTitle title="Deep path" />
            <Breadcrumb
              items={[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Protocols', href: '/protocols' },
                { label: 'Ethereum', href: '/protocols/ethereum' },
                { label: 'Frankencoin', href: '/protocols/ethereum/frankencoin' },
                { label: 'Position #3' },
              ]}
            />
          </Card>

          <Card>
            <CardTitle title="With onClick" />
            <Breadcrumb
              items={[
                { label: 'Overview', onClick: () => {} },
                { label: 'Strategies', onClick: () => {} },
                { label: 'BTC Covered Call' },
              ]}
            />
          </Card>

          <Card>
            <CardTitle title="Single item" />
            <Breadcrumb items={[{ label: 'Dashboard' }]} />
          </Card>
        </div>
      </Section>

      {/* ── Section demos ─────────────────────────────────────────────── */}
      <Section title="Section Component">
        {/* Default — no wrapper */}
        <Section
          title="Default variant"
          description="Children render directly with no background or card wrapper."
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Alpha', 'Beta', 'Gamma'].map(name => (
              <Card key={name}>
                <p className="text-text-primary font-semibold">{name}</p>
                <p className="text-sm text-text-secondary mt-1">Placeholder content block.</p>
              </Card>
            ))}
          </div>
        </Section>

        {/* Card variant */}
        <Section title="Card variant" description="Wraps children in a single Card." variant="card">
          <p className="text-text-secondary text-sm">
            All content sits inside one Card container — useful for grouped settings or detail
            panels.
          </p>
        </Section>

        {/* Filled variant */}
        <Section
          title="Filled variant"
          description="Subtle dark background, no card border."
          variant="filled"
        >
          <p className="text-text-secondary text-sm">
            Great for secondary areas or inline callouts that need visual separation without a full
            card.
          </p>
        </Section>

        {/* With actions */}
        <Section
          title="With actions"
          description="Actions slot renders to the right of the header."
          actions={
            <>
              <ButtonInput
                label="Export"
                variant="secondary"
                icon={<FontAwesomeIcon icon={faDownload} />}
              />
              <ButtonInput label="New" variant="primary" icon={<FontAwesomeIcon icon={faPlus} />} />
            </>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['Position A', 'Position B'].map(name => (
              <Card key={name}>
                <p className="text-text-primary font-semibold">{name}</p>
                <p className="text-sm text-text-secondary mt-1">Mock position data.</p>
              </Card>
            ))}
          </div>
        </Section>

        {/* Spacing variants */}
        <Section title="Spacing — sm" spacing="sm">
          <Card>
            <p className="text-text-secondary text-sm">Tight spacing between header and content.</p>
          </Card>
        </Section>

        <Section title="Spacing — lg" spacing="lg">
          <Card>
            <p className="text-text-secondary text-sm">Loose spacing between header and content.</p>
          </Card>
        </Section>
      </Section>

      {/* ── Modal demos ───────────────────────────────────────────────── */}
      <Section title="Modal Components">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic modal */}
          <Card>
            <CardTitle title="Basic modal" />
            <ButtonInput
              label="Open modal"
              variant="primary"
              onClick={() => setBasicModalOpen(true)}
            />
          </Card>

          {/* Modal with footer */}
          <Card>
            <CardTitle title="With footer" />
            <ButtonInput
              label="Open modal with footer"
              variant="secondary"
              onClick={() => setFooterModalOpen(true)}
            />
          </Card>

          {/* ConfirmModal */}
          <Card>
            <CardTitle title="ConfirmModal" />
            <ButtonInput
              label="Confirm action"
              variant="outline"
              onClick={() => setConfirmModalOpen(true)}
            />
          </Card>

          {/* Danger ConfirmModal */}
          <Card>
            <CardTitle title="ConfirmModal — danger" />
            <ButtonInput
              label="Delete position"
              variant="ghost"
              className="text-red-400 hover:text-red-300"
              onClick={() => setDangerModalOpen(true)}
            />
          </Card>
        </div>
      </Section>

      {/* ── Modals (portaled) ─────────────────────────────────────────── */}
      <Modal
        isOpen={basicModalOpen}
        onClose={() => setBasicModalOpen(false)}
        title="Vault Details"
        size="md"
      >
        <div className="space-y-4 text-sm text-text-secondary">
          <div className="flex justify-between">
            <span>Protocol</span>
            <span className="text-text-primary font-medium">Morpho Blue</span>
          </div>
          <div className="flex justify-between">
            <span>Network</span>
            <span className="text-text-primary font-medium">Ethereum</span>
          </div>
          <div className="flex justify-between">
            <span>TVL</span>
            <span className="text-text-primary font-medium">$1.2B</span>
          </div>
          <div className="flex justify-between">
            <span>Current APY</span>
            <span className="text-green-400 font-medium">5.4%</span>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={footerModalOpen}
        onClose={() => setFooterModalOpen(false)}
        title="Confirm Deposit"
        size="md"
        footer={
          <ButtonInput
            label="Confirm"
            variant="primary"
            onClick={() => {
              setFooterModalOpen(false);
              showToast.success('Deposit submitted successfully.');
            }}
            second={{
              label: 'Cancel',
              variant: 'secondary',
              onClick: () => setFooterModalOpen(false),
            }}
          />
        }
      >
        <div className="space-y-4 text-sm text-text-secondary">
          <p>
            You are about to deposit{' '}
            <span className="text-text-primary font-semibold">3.8 ETH</span> into the Morpho Blue
            vault.
          </p>
          <div className="flex justify-between border-t border-surface pt-4">
            <span>You will receive</span>
            <span className="text-text-primary font-medium">≈ 11,400 ZCHF</span>
          </div>
          <div className="flex justify-between">
            <span>Estimated APY</span>
            <span className="text-green-400 font-medium">5.4%</span>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Withdraw Position"
        message="Are you sure you want to withdraw your full position from this vault? This action cannot be undone."
        confirmText="Withdraw"
        cancelText="Keep position"
        onConfirm={() => {
          setConfirmModalOpen(false);
          showToast.success('Withdrawal submitted.');
        }}
      />

      <ConfirmModal
        isOpen={dangerModalOpen}
        onClose={() => setDangerModalOpen(false)}
        title="Delete Position"
        message={
          <span>
            This will <span className="text-red-400 font-semibold">permanently close</span> your
            position and return collateral to your wallet. Proceed?
          </span>
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={() => {
          setDangerModalOpen(false);
          showToast.error('Position deleted.');
        }}
      />
    </>
  );
}
