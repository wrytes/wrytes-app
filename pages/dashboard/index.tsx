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
import { RoleBadge } from '@/components/auth/RequireRole';
import { PageHeader } from '@/components/ui/Layout';
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

// ─── Mock data ────────────────────────────────────────────────────────────────

const SEARCHABLE_HEADERS = ['Asset', 'Balance', 'Value (USD)', 'APY'];

const MOCK_POSITIONS = [
  { asset: 'DAI', balance: '0.42', value: '$28,140', apy: '4.2%' },
  { asset: 'SUI', balance: '0.42', value: '$28,140', apy: '4.2%' },
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

  // Sort state (shared across both tables for demo)
  const [sortTab, setSortTab] = useState('Asset');
  const [sortReverse, setSortReverse] = useState(false);

  const handleSortChange = (col: string) => {
    if (col === sortTab) setSortReverse(r => !r);
    else {
      setSortTab(col);
      setSortReverse(false);
    }
  };

  const filteredPositions = MOCK_POSITIONS.filter(p =>
    p.asset.toLowerCase().includes(search.toLowerCase())
  );

  const ethPrice = 3_000; // mock price for receive estimate
  const receiveOutput = sendAmount
    ? `≈ ${((Number(sendAmount) / 1e18) * ethPrice).toFixed(2)}`
    : undefined;

  return (
    <>
      <Head>
        <title>Dashboard - Wrytes</title>
        <meta name="description" content="Dashboard overview" />
      </Head>

      <div className="space-y-10">
        {/* ── Page header ───────────────────────────────────────────────── */}
        <PageHeader
          title="Dashboard Overview"
          description={`Welcome back${
            user?.walletAddress
              ? `, ${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
              : ''
          }! Here's what's happening with your portfolio.`}
          icon={faLightbulb}
          userInfo={user && <RoleBadge />}
        />

        {/* ── Stats ─────────────────────────────────────────────────────── */}
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

        {/* ── Button demos ──────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-primary">Button Components</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Variants */}
            <Card hover={false}>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-5">
                Variants
              </p>
              <div className="flex flex-wrap gap-3">
                <ButtonInput label="Primary"   variant="primary"   />
                <ButtonInput label="Secondary" variant="secondary" />
                <ButtonInput label="Outline"   variant="outline"   />
                <ButtonInput label="Ghost"     variant="ghost"     />
              </div>
            </Card>

            {/* Sizes */}
            <Card hover={false}>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-5">
                Sizes
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <ButtonInput label="Small"  variant="primary" size="sm" />
                <ButtonInput label="Medium" variant="primary" size="md" />
                <ButtonInput label="Large"  variant="primary" size="lg" />
              </div>
            </Card>

            {/* With icons */}
            <Card hover={false}>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-5">
                With icons
              </p>
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
            <Card hover={false}>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-5">
                States &amp; paired buttons
              </p>
              <div className="space-y-3">
                <ButtonInput
                  label="Disabled"
                  variant="primary"
                  disabled
                />
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
        </section>

        {/* ── Input demos ───────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-primary">Input Components</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TokenInput */}
            <Card hover={false}>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">
                TokenInput
              </p>
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
            <Card hover={false}>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">
                NormalInput &amp; AddressInput
              </p>
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
            <Card hover={false}>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">
                LiquidationSlider
              </p>
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
            <Card hover={false}>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">
                TabInput &amp; PageTabInput
              </p>
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
        </section>

        {/* ── Searchable table ──────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-primary">TableHeadSearchable</h2>

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
                  <TableRow key={pos.asset} headers={SEARCHABLE_HEADERS} tab={sortTab} colSpan={4}>
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
        </section>

        {/* ── Sortable table ────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-text-primary">TableHead (sortable)</h2>

          <Table>
            <TableHead
              headers={PROTOCOL_HEADERS}
              tab={sortTab}
              reverse={sortReverse}
              tabOnChange={handleSortChange}
              colSpan={4}
            />
            <TableBody>
              {PROTOCOL_ROWS.map(row => (
                <TableRow key={row.protocol} headers={PROTOCOL_HEADERS} tab={sortTab} colSpan={4}>
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
        </section>
      </div>
    </>
  );
}
