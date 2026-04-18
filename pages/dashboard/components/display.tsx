import Head from 'next/head';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
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
import { Breadcrumb, Section } from '@/components/ui/Layout';
import { StatGrid } from '@/components/ui/Stats';
import Card from '@/components/ui/Card';
import { ButtonInput, TabInput, PageTabInput } from '@/components/ui/Input';
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

// ─── Sub-nav ──────────────────────────────────────────────────────────────────

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

// ─── Mock data ────────────────────────────────────────────────────────────────

const POSITION_HEADERS = ['Asset', 'Balance', 'Value (USD)', 'APY'];
const MOCK_POSITIONS = [
  { asset: 'WBNB', balance: '0.42', value: '$28,140', apy: '4.2%' },
  { asset: 'WETH', balance: '3.80', value: '$11,400', apy: '3.8%' },
  { asset: 'USDC', balance: '5,000', value: '$5,000', apy: '6.1%' },
  { asset: 'ZCHF', balance: '2,200', value: '$2,530', apy: '2.9%' },
];

const PROTOCOL_HEADERS = ['Protocol', 'Chain', 'TVL', 'Yield'];
const PROTOCOL_ROWS = [
  { protocol: 'Morpho Blue', chain: 'Ethereum', tvl: '$1.2B', yield: '5.4%' },
  { protocol: 'Frankencoin', chain: 'Ethereum', tvl: '$48M', yield: '2.9%' },
  { protocol: 'Aerodrome', chain: 'Base', tvl: '$620M', yield: '8.1%' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DisplayComponentPage() {
  const [activeTab, setActiveTab] = useState('Deposit');

  const [search, setSearch] = useState('');
  const [inWallet, setInWallet] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const [sortTab, setSortTab] = useState('Asset');
  const [sortReverse, setSortReverse] = useState(false);
  const [protocolSortTab, setProtocolSortTab] = useState('Protocol');
  const [protocolSortReverse, setProtocolSortReverse] = useState(false);

  const [basicModalOpen, setBasicModalOpen] = useState(false);
  const [footerModalOpen, setFooterModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [dangerModalOpen, setDangerModalOpen] = useState(false);

  const handleSortChange = (col: string) => {
    if (col === sortTab) setSortReverse(r => !r);
    else {
      setSortTab(col);
      setSortReverse(false);
    }
  };

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

  return (
    <>
      <Head>
        <title>UI Components – Wrytes</title>
      </Head>

      <ComponentsSubNav />
      <div className="mb-8">
        <h1 className="text-text-primary text-2xl font-bold">UI Components</h1>
        <p className="text-text-muted mt-1">
          Buttons, badges, stats, modals, tables, toasts, and layout primitives.
        </p>
      </div>

      {/* ── Buttons ─────────────────────────────────────────────────── */}
      <Section title="ButtonInput">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardTitle title="Variants" />
            <div className="flex flex-wrap gap-3">
              <ButtonInput label="Primary" variant="primary" />
              <ButtonInput label="Secondary" variant="secondary" />
              <ButtonInput label="Outline" variant="outline" />
              <ButtonInput label="Ghost" variant="ghost" />
              <ButtonInput label="Error" variant="error" />
            </div>
          </Card>

          <Card>
            <CardTitle title="Sizes" />
            <div className="flex flex-wrap items-center gap-3">
              <ButtonInput label="Small" variant="primary" size="sm" />
              <ButtonInput label="Medium" variant="primary" size="md" />
              <ButtonInput label="Large" variant="primary" size="lg" />
            </div>
          </Card>

          <Card>
            <CardTitle title="With icons" />
            <div className="flex flex-wrap gap-3">
              <ButtonInput
                label="New position"
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
                className="text-error hover:text-error/70"
              />
            </div>
          </Card>

          <Card>
            <CardTitle title="States & paired" />
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

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <Section title="TabInput & PageTabInput">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardTitle title="TabInput" />
            <TabInput
              tabs={['Deposit', 'Withdraw', 'Borrow']}
              tab={activeTab}
              setTab={setActiveTab}
            />
            <p className="mt-3 text-sm text-text-secondary">
              Active: <span className="text-text-primary font-medium">{activeTab}</span>
            </p>
          </Card>

          <Card>
            <CardTitle title="PageTabInput" />
            <PageTabInput
              tabs={[
                {
                  label: 'Overview',
                  content: (
                    <div className="pt-2 text-sm space-y-2">
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

      {/* ── Badges ──────────────────────────────────────────────────── */}
      <Section title="Badge">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardTitle title="Risk levels" />
            <div className="flex flex-wrap gap-3">
              <Badge text="Low Risk" variant="risk" riskLevel="low" />
              <Badge text="Medium Risk" variant="risk" riskLevel="medium" />
              <Badge text="High Risk" variant="risk" riskLevel="high" />
            </div>
          </Card>

          <Card>
            <CardTitle title="Sizes" />
            <div className="flex flex-wrap items-center gap-3">
              <Badge text="Small" variant="risk" riskLevel="low" size="sm" />
              <Badge text="Medium" variant="risk" riskLevel="low" size="md" />
              <Badge text="Large" variant="risk" riskLevel="low" size="lg" />
            </div>
          </Card>

          <Card>
            <CardTitle title="Custom colors" />
            <div className="flex flex-wrap gap-3">
              <Badge
                text="Active"
                variant="custom"
                customColor="text-brand"
                customBgColor="bg-brand/20"
              />
              <Badge
                text="Pending"
                variant="custom"
                customColor="text-info"
                customBgColor="bg-info/20"
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
                customColor="text-text-muted"
                customBgColor="bg-surface"
              />
            </div>
          </Card>

          <Card>
            <CardTitle title="In context" />
            <div className="space-y-3 text-sm">
              {[
                { label: 'Morpho Blue', chain: 'Ethereum', status: 'Active', risk: 'low' as const },
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
                      customColor="text-info"
                      customBgColor="bg-info/10"
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

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <Section title="StatGrid">
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
        <div className="mt-6">
          <StatGrid
            stats={[
              { icon: faWallet, label: 'Loading state', value: '—', loading: true },
              { icon: faChartLine, label: 'Loading state', value: '—', loading: true },
            ]}
            columns={{ base: 1, md: 2 }}
            loading
          />
        </div>
      </Section>

      {/* ── IconLogo ────────────────────────────────────────────────── */}
      <Section title="IconLogo">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardTitle title="Sizes" />
            <div className="flex flex-wrap items-end gap-6">
              {[
                { size: 6 as const, label: 'size 6', textSize: 'text-xs' },
                { size: 8 as const, label: 'size 8', textSize: 'text-sm' },
                { size: 10 as const, label: 'size 10', textSize: 'text-base' },
                { size: 14 as const, label: 'size 14', textSize: 'text-xl' },
              ].map(({ size, label, textSize }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <IconLogo
                    icon={<FontAwesomeIcon icon={faWallet} className={`text-brand ${textSize}`} />}
                    size={size}
                  />
                  <span className="text-xs text-text-secondary">{label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle title="Color variants" />
            <div className="flex flex-wrap gap-4">
              <IconLogo
                icon={<FontAwesomeIcon icon={faWallet} className="text-brand" />}
                size={10}
              />
              <IconLogo
                icon={<FontAwesomeIcon icon={faChartLine} className="text-success" />}
                size={10}
              />
              <IconLogo
                icon={<FontAwesomeIcon icon={faShield} className="text-info" />}
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

      {/* ── Toast ───────────────────────────────────────────────────── */}
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

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <Section title="Modal Components">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardTitle title="Basic modal" />
            <ButtonInput
              label="Open modal"
              variant="primary"
              onClick={() => setBasicModalOpen(true)}
            />
          </Card>

          <Card>
            <CardTitle title="With footer" />
            <ButtonInput
              label="Open modal with footer"
              variant="secondary"
              onClick={() => setFooterModalOpen(true)}
            />
          </Card>

          <Card>
            <CardTitle title="ConfirmModal" />
            <ButtonInput
              label="Confirm action"
              variant="outline"
              onClick={() => setConfirmModalOpen(true)}
            />
          </Card>

          <Card>
            <CardTitle title="ConfirmModal — danger" />
            <ButtonInput
              label="Delete position"
              variant="ghost"
              className="text-error hover:text-error/70"
              onClick={() => setDangerModalOpen(true)}
            />
          </Card>
        </div>
      </Section>

      {/* ── Tables ──────────────────────────────────────────────────── */}
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
            headers={POSITION_HEADERS}
            tab={sortTab}
            reverse={sortReverse}
            tabOnChange={handleSortChange}
            colSpan={4}
            logoPadding={true}
          />
          <TableBody>
            {filteredPositions.length === 0 ? (
              <TableRowEmpty>No assets match your search.</TableRowEmpty>
            ) : (
              filteredPositions.map(pos => (
                <TableRow
                  key={pos.asset}
                  headers={POSITION_HEADERS}
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
                  <div className="text-right text-success font-medium">{pos.apy}</div>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Section>

      <Section title="TableHead (sortable)">
        <Table>
          <TableHead
            headers={PROTOCOL_HEADERS}
            tab={protocolSortTab}
            reverse={protocolSortReverse}
            tabOnChange={handleProtocolSortChange}
            colSpan={4}
            logoPadding={true}
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
                <div className="text-right text-success font-medium">{row.yield}</div>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      {/* ── HeroSteps ───────────────────────────────────────────────── */}
      <Section title="HeroSteps">
        <div className="space-y-6">
          <div>
            <CardTitle title="3-step flow" />
            <HeroSteps
              steps={[
                {
                  icon: '1',
                  title: 'Connect wallet',
                  description: 'Link MetaMask, WalletConnect, or Coinbase to get started.',
                },
                {
                  icon: '2',
                  title: 'Select a vault',
                  description: 'Browse lending vaults and pick one that fits your risk profile.',
                },
                {
                  icon: '3',
                  title: 'Deposit & earn',
                  description: 'Supply assets to start earning yield. Withdraw at any time.',
                },
              ]}
            />
          </div>
          <div>
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
          </div>
        </div>
      </Section>

      {/* ── Breadcrumb ──────────────────────────────────────────────── */}
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
                { label: 'Frankencoin' },
              ]}
            />
          </Card>

          <Card>
            <CardTitle title="With onClick handlers" />
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

      {/* ── Section variants ────────────────────────────────────────── */}
      <Section title="Section Component">
        <Section
          title="Default variant"
          description="Children render directly with no background wrapper."
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

        <Section title="Card variant" description="Wraps children in a single Card." variant="card">
          <p className="text-text-secondary text-sm">
            All content sits inside one Card container — useful for grouped settings or detail
            panels.
          </p>
        </Section>

        <Section
          title="Filled variant"
          description="Subtle background, no card border."
          variant="filled"
        >
          <p className="text-text-secondary text-sm">
            Great for secondary areas or inline callouts that need visual separation without a full
            card.
          </p>
        </Section>

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
      </Section>

      {/* ── Portaled modals ─────────────────────────────────────────────── */}
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
            <span className="text-success font-medium">5.4%</span>
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
            <span className="text-success font-medium">5.4%</span>
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
            This will <span className="text-error font-semibold">permanently close</span> your
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
