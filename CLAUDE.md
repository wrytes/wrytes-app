# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with the **Wrytes AG** platform repository.

## 🎯 **Application / Repository Philosophy & Vision**

**Wrytes AG** is a Swiss-based R&D company specializing in **Software Development for Distributed Ledger Technologies and AI**. Our technical platform creates cutting-edge tools, protocol adapters, and full-stack applications that serve our broader mission of technology innovation and research.

The platform combines **independent asset management funding** with **cutting-edge software development** to create sustainable, self-funded research and development capabilities.

### **Core Business Principles:**

1. **💻 Software Development Focus** - Primary focus on Distributed Ledger Technology solutions and AI
2. **🔬 Research-Driven Innovation** - Every tool serves our development and innovation goals
3. **🧩 Component Reusability** - Maximize reuse of existing components before building new ones
4. **📱 Mobile-First Responsive** - Consistent patterns across all features
5. **🏢 Swiss Precision** - Built with meticulous attention to detail and quality
6. **🔧 Feature-Based Structure** - Each major feature is self-contained and pluggable

### **Platform Vision & Business Model:**
- **💻 Software Development** (Core) - Full-stack solutions for Distributed Ledger Technologies and AI
- **🛠️ Technical Services** (Revenue) - Development services for clients and partners
- **🚀 Platform Development** (Innovation) - Proprietary tools and research prototyping
- **🤝 Strategic Partnerships** (Growth) - Technology sharing and collaboration agreements
- **🔗 Protocol Integrations** (Current) - Multi-protocol adapters and system integrations
- **🔄 Transaction Management Systems** (Current) - Advanced deployment and monitoring tools
- **⚙️ Platform Operations Tools** (Future) - Enhanced infrastructure and automation systems
- **🔍 R&D Innovation Tools** (Future) - Cutting-edge technology research and development

## 🏗️ **Architecture Overview**

### **Technology Stack Philosophy:**
- **Next.js 15** with Pages Router - Optimal Web3 compatibility
- **React 19** with TypeScript - Type-safe, modern development
- **Wagmi 2.x + Viem + Reown AppKit** - Modern Web3 stack
- **Redux Toolkit + Persist** - Centralized state with persistence
- **Apollo Client** - GraphQL for protocol data
- **Tailwind CSS + Framer Motion** - Consistent, performant styling
- **React Hook Form + Zod** - Robust form handling

### **State Management Strategy:**
- **Redux** - Global application state (transactions, user preferences)
- **Apollo Cache** - GraphQL data caching and synchronization
- **React Context** - Authentication and theme management

## 📁 **Project Structure Philosophy**

```
/wrytes/
├── components/              # 🧩 Reusable UI Components
│   ├── ui/                 # Generic UI primitives (ALWAYS REUSE THESE)
│   │   ├── Input/ButtonInput.tsx  # Multi-variant button system
│   │   ├── Card.tsx        # Flexible card component
│   │   ├── Toast.tsx       # Flexible toast component
│   │   ├── Modal/          # Modal system with variants
│   │   ├── Stats/          # Metric display components
│   │   └── TransactionQueue/ # Generic transaction management
│   ├── features/           # 🚀 Feature-specific components
│   │   ├── Dashboard/      # Dashboard feature module
│   │   ├── Routes/         # On/off-ramp routes feature
│   │   ├── Vaults/         # Vault management
│   │   └── [Future]/       # Future feature modules
│   ├── layout/             # 📐 Layout components
│   │   ├── AppLayout.tsx   # ⭐ Generic layout shell — use for ALL new sections
│   │   ├── WalletButton.tsx # Shared wallet connect/display (no visibility classes)
│   │   ├── NavbarWallet.tsx # hidden md:flex wrapper around WalletButton
│   │   ├── Layout.tsx      # Route → layout dispatcher
│   │   ├── DashboardLayout.tsx
│   │   ├── DeribitAgentLayout.tsx
│   │   ├── DocsLayout.tsx
│   │   ├── RoutesLayout.tsx
│   │   ├── HomeLayout.tsx
│   │   ├── SimpleLayout.tsx
│   │   ├── CenterLayout.tsx
│   │   ├── FooterSimple.tsx
│   │   └── Footer.tsx
│   └── sections/           # 🏠 Landing page sections
├── hooks/                  # 🔗 Custom React hooks
│   ├── adapter/            # Protocol adapter hooks (Falcon, Morpho)
│   ├── redux/              # Redux state hooks
│   │   ├── useTransactionQueue.ts
│   │   └── useKrakenCredentials.ts
│   ├── ui/                 # Generic UI hooks
│   ├── vaults/             # Vault-specific hooks
│   ├── web3/               # Web3 interaction hooks
│   └── [feature]/          # Feature-specific hooks
├── lib/                    # 🛠️ Business logic & integrations
│   ├── navigation/         # ⭐ Nav configs — one file per section
│   │   ├── types.ts        # Shared NavItem interface (single source of truth)
│   │   ├── dashboard.ts    # DASHBOARD_NAVIGATION
│   │   ├── deribit.ts      # DERIBIT_NAVIGATION
│   │   ├── docs.ts         # DOCS_NAVIGATION
│   │   ├── home.ts         # HOME_NAVIGATION
│   │   └── routes.ts       # ROUTES_NAVIGATION
│   ├── vaults/             # Vault configurations (extensible)
│   ├── web3/               # Web3 configuration
│   ├── graphql/            # GraphQL client & queries
│   └── utils/              # Utility functions
├── logs/                   # 📋 Project Documentation & Change History
│   └── CHANGELOG-YYYY.MM.DD.md # Dated changelog files for version tracking
├── redux/                  # 📊 Global state management
│   └── slices/             # Feature-specific slices
│       ├── transactionQueue.slice.ts
│       └── krakenCredentials.slice.ts  # Kraken API key + secret (persisted)
└── pages/                  # 🚀 Next.js pages
    ├── dashboard/
    ├── deribit-agent/
    ├── routes/             # On/off-ramp section
    │   ├── index.tsx       # Overview (setup shortcuts if no Kraken credentials)
    │   ├── onramp.tsx
    │   ├── offramp.tsx
    │   └── settings.tsx    # Kraken API credentials form
    └── ...
```

## 🧩 **Component Reusability Strategy**

### **CRITICAL: Always Reuse Existing Components**

**Before building new components, check these locations:**

1. **`components/ui/`** - Generic UI primitives
   - `Input/ButtonInput.tsx` - Variants: `primary | secondary | outline | ghost | error`
   - `Card.tsx` - Flexible card component
   - `Toast.tsx` + `showToast` - `success | error | info | warning | custom`
   - `Modal/` - Complete modal system with confirm variants
   - `Stats/` - Metric display with various layouts
   - `TransactionQueue/` - Generic transaction management

2. **`components/layout/`** - Shared layout pieces
   - `AppLayout.tsx` - **Generic layout shell** — inject `logo`, `navItems`, `isActive`, `headerRight`, `mobileExtra`. Use this for every new section layout.
   - `WalletButton.tsx` - Self-contained wallet connect/display with no visibility classes. Pass to `headerRight` and `mobileExtra` for consistent wallet UX across all sections.
   - `NavbarWallet.tsx` - Thin `hidden md:flex` wrapper around `WalletButton`. Used where only desktop wallet display is needed.
   - `FooterSimple.tsx` - Minimal footer strip (copyright + version), rendered by `AppLayout` automatically.

2. **`components/features/[existing-feature]/`** - Feature-specific patterns
   - Reuse patterns from `Vaults/` for similar data management
   - Adapt `Dashboard/` patterns for analytics features

3. **`hooks/ui/`** - Generic UI hooks
   - `useModal.ts` - Modal state management

4. **`hooks/adapter/`** - Protocol-specific data fetching hooks
   - `useFalconData.ts` - Falcon protocol integration
   - `useMorphoVaultData.ts` - Enhanced Morpho vault data fetching

5. **`hooks/redux/`** - Redux state management hooks
   - `useTransactionQueue.ts` - Transaction queue management
   - `useKrakenCredentials.ts` - Kraken API key/secret (read, save, clear)

### **Component Composition Patterns:**
```typescript
// ✅ GOOD: Reuse existing components
<Card>
  <CardHeader>
    <h3>New Feature</h3>
  </CardHeader>
  <CardContent>
    <StatGrid>
      <StatCard title="Metric" value={value} />
    </StatGrid>
  </CardContent>
</Card>

// ❌ AVOID: Building from scratch
<div className="custom-card">
  <div className="custom-header">...</div>
</div>
```

## 🚀 **Feature Development Guidelines**

### **New Feature Implementation Pattern:**

1. **Create Feature Directory:**
   ```
   components/features/[FeatureName]/
   ├── index.ts              # Feature exports
   ├── types.ts              # Feature-specific types
   ├── [FeatureName].tsx     # Main feature component
   └── [sub-components].tsx  # Feature sub-components
   ```

2. **Create Feature Hooks:**
   ```
   hooks/[feature]/
   ├── index.ts              # Hook exports
   ├── use[Feature]Data.ts   # Data fetching
   └── use[Feature]Actions.ts # Feature actions
   ```

   **OR use Protocol Adapters:**
   ```
   hooks/adapter/
   ├── use[Protocol]Data.ts  # Protocol-specific data fetching
   ```

3. **Add to Navigation:**
   ```
   lib/navigation/[section].ts   # NavItem[] using the shared NavItem type from types.ts
   ```

4. **Follow Existing Patterns:**
   - Use `Vaults/` as reference for data-heavy features
   - Use `Dashboard/` as reference for analytics features
   - Reuse `ui/` components extensively

### **Feature Integration Checklist:**
- [ ] Reuse existing UI components from `components/ui/`
- [ ] Create feature-specific hooks in `hooks/[feature]/` or protocol adapters in `hooks/adapter/`
- [ ] Add to navigation system
- [ ] Implement proper loading states
- [ ] Add error boundaries
- [ ] Include proper TypeScript types
- [ ] Add to Redux if global state needed
- [ ] Integrate with transaction queue system if transactions required

## 🔗 **Web3 Integration Philosophy**

### **Multi-Protocol Support:**
- **Current:** Morpho (with enhanced GraphQL), Curve, TermMax, Frankencoin, USDU Finance, Deribit
- **Architecture:** Protocol adapter pattern for standardized interfaces
- **Future:** Any Distributed Ledger Technology protocol with standardized interfaces

### **Wallet Integration:**
- **Reown AppKit** - Modern wallet connection
- **Multi-wallet support** - MetaMask, WalletConnect, Coinbase, Safe
- **Network switching** - Ethereum Mainnet, Base L2

### **Contract Interaction Patterns:**
```typescript
// ✅ Use existing patterns from vaults/
const { data, isLoading, error } = useContractRead({
  address: vaultAddress,
  abi: vaultABI,
  functionName: 'balanceOf',
  args: [userAddress]
});

// ✅ Use protocol adapters for enhanced data fetching
const { vaultData, isLoading } = useMorphoVaultData(vaultAddress);
const { falconData } = useFalconData();

// ✅ Use transaction queue for batch operations
const { addTransaction, clearQueue } = useTransactionQueue();
```

## 📊 **Data Management Strategy**

### **GraphQL Integration:**
- **Apollo Client** - Centralized GraphQL management
- **Protocol-specific queries** - Morpho, future protocols
- **Caching strategy** - 5-minute cache for performance

### **Real-time Updates:**
- **WebSocket subscriptions** - For live data updates
- **Polling fallbacks** - When WebSocket unavailable
- **Optimistic updates** - For better UX

## 🎨 **Design System Philosophy**

### **Light Theme — Warm Off-White Palette:**
- **Professional aesthetic** - Clean, institutional feel with warm off-white base
- **Accessibility first** - WCAG 2.1 AA compliance
- **Responsive design** - Mobile-first approach
- **Brand orange** - `#ff6b35` is the primary accent, preserved across all surfaces

### **Tailwind Custom Color Tokens (`tailwind.config.ts`):**
```
Surfaces:      base (#f2f0ec)  surface (#f8f7f5)  card (#ffffff)
Brand:         brand (#ff6b35)
Text:          text-primary (#0c0c0c)  text-secondary (#374151)  text-muted (#6b7280)
Input:         input-border  input-label  input-empty
Table:         table-header  table-alt
Status:        error / error-bg / error-border
               success / success-bg / success-border
               info (#60a5fa)  warning (#f59e0b)
Misc:          gold  disabled
```

**Rule:** Always use custom tokens. Never use hardcoded Tailwind color classes (`red-400`, `green-500`, `gray-600`, etc.) — add a new token to `tailwind.config.ts` if a semantic one doesn't exist.

### **Component Variants:**
```typescript
// ButtonInput variants
<ButtonInput variant="primary" />    // brand orange fill
<ButtonInput variant="secondary" />  // card bg, bordered
<ButtonInput variant="outline" />    // brand border
<ButtonInput variant="ghost" />      // text only
<ButtonInput variant="error" />      // error-colored outline

// Toast
showToast.success('msg')
showToast.error('msg')
showToast.info('msg')
showToast.warning('msg')
```

## 🔧 **Development Workflow**

### **Code Quality Standards:**
- **TypeScript Strict Mode** - No `any` types
- **Component Composition** - Prefer composition over inheritance
- **Custom Hooks** - Extract business logic
- **Error Boundaries** - Graceful error handling
- **Accessibility** - ARIA labels and semantic HTML

### **Performance Standards:**
- **Core Web Vitals** - LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Bundle Size** - Monitor with analyzer
- **Code Splitting** - Automatic by route
- **Image Optimization** - Next.js Image component

### **Security Best Practices:**
- **No Private Key Storage** - Never store private keys
- **Signature Verification** - All auth via message signing
- **Input Sanitization** - Zod schemas for validation
- **XSS Protection** - Proper escaping

## 🚀 **Future Development Roadmap**

### **R&D and Platform Expansion:**
1. **Advanced Trading Tools** - Enhanced Bitcoin option strategy platforms
2. **Blockchain Research Tools** - Cutting-edge protocol development and experimentation
3. **Portfolio Analytics** - Cross-protocol performance tracking for internal operations
4. **Strategy Builder** - Custom trading and DeFi strategy creation tools
5. **Risk Management** - Professional risk assessment for trading operations
6. **Institutional Services** - Client-facing tools for technical services business

### **Extensibility Patterns:**
```typescript
// Protocol integration pattern
interface ProtocolConfig {
  name: string;
  type: 'lending' | 'dex' | 'yield';
  endpoints: {
    graphql?: string;
    rpc?: string;
  };
  vaults: VaultConfig[];
}

// Feature module pattern
interface FeatureModule {
  name: string;
  route: string;
  component: React.ComponentType;
  permissions: string[];
  navigation: NavItem; // from lib/navigation/types.ts
}
```

## 📈 **Business Context**

### **Wrytes AG Profile:**
- **Swiss AG** - Based in Zug, Switzerland (Crypto Valley)
- **Core Business** - Proprietary Bitcoin option trading strategies funding R&D operations
- **Focus Areas** - Blockchain Technology R&D, Software Development, Bitcoin Trading
- **Independence** - 100% company-owned assets, no external clients for trading
- **Revenue Model** - Trading profits fund continuous research and development

### **Business Goals:**
1. **Software Development Excellence** - Leading full-stack solutions for Distributed Ledger Technologies
2. **Technical Services Revenue** - Client development and consulting services
3. **Platform Development** - Proprietary tools for internal operations and research
4. **Strategic Partnerships** - Technology sharing and collaboration agreements
5. **Innovation Leadership** - Cutting-edge technology development and R&D
6. **Independent Funding** - Sustainable research through proprietary asset management
7. **Swiss Excellence** - Maintaining highest standards of precision and quality

## 🛠️ **Development Commands**

```bash
# Development
yarn dev          # Start development server (with Turbopack)
yarn build        # Build for production
yarn start        # Start production server

# Code Quality
yarn lint         # Run ESLint
yarn lint:fix     # Fix ESLint errors automatically
yarn type-check   # TypeScript checking
yarn format       # Format with Prettier
yarn format:check # Check code formatting

# Analysis
yarn analyze      # Bundle analysis
```

## 🎯 **Key Development Principles**

### **1. Component Reusability First**
- Always check `components/ui/` before building new components
- Adapt existing patterns from `features/` directories
- Use composition over custom implementation

### **2. Generic Architecture**
- Design features to be protocol-agnostic
- Use standardized interfaces for data structures
- Implement feature modules that can be easily extended

### **3. Type Safety**
- Comprehensive TypeScript coverage
- No `any` types allowed
- Proper interface definitions for all data structures

### **4. Performance Focus**
- Optimize for Core Web Vitals
- Implement proper loading states
- Use code splitting and lazy loading

### **5. Error Handling**
- Graceful degradation when APIs fail
- Comprehensive error boundaries
- User-friendly error messages

## 📋 **Documentation & Change Management**

### **Logs Folder Structure:**
The `logs/` folder contains project documentation and change history:

```
logs/
└── CHANGELOG-YYYY.MM.DD.md    # Dated changelog files for major updates
```

### **Changelog Management Guidelines:**
- **Date-based naming** - Use `CHANGELOG-YYYY.MM.DD.md` format for major changes
- **Comprehensive documentation** - Include technical details, business impact, and architectural changes
- **Version tracking** - Document all significant updates, feature additions, and refactoring
- **Future reference** - Maintain detailed records for historical context and decision tracking

### **When to Create New Changelogs:**
- Major feature implementations or removals
- Significant business positioning changes
- Architecture overhauls or technology stack updates
- Legal document updates or compliance changes
- Large-scale UI/UX modifications

## 🗺️ **Adding a New Section Layout**

Every section (Dashboard, Deribit, Routes, Docs…) follows the same three-step pattern:

### 1. Nav config — `lib/navigation/[section].ts`
```typescript
import { faIcon } from '@fortawesome/free-solid-svg-icons';
import type { NavItem } from './types';

export const MY_NAVIGATION: NavItem[] = [
  { label: 'Overview', path: '/my-section', icon: faIcon, description: '...' },
  { label: 'Settings', path: '/my-section/settings', icon: faSliders, description: '...' },
];
```

### 2. Layout — `components/layout/MySectionLayout.tsx`
```typescript
import { faIcon } from '@fortawesome/free-solid-svg-icons';
import { MY_NAVIGATION } from '@/lib/navigation/my-section';
import { useActiveNavigation } from '@/hooks/useActiveNavigation';
import WalletButton from '@/components/layout/WalletButton';
import AppLayout from '@/components/layout/AppLayout';

export default function MySectionLayout({ children }) {
  const { isActive } = useActiveNavigation();
  return (
    <AppLayout
      logo={{ icon: faIcon, subtitle: 'My Section' }}
      navItems={MY_NAVIGATION}
      isActive={isActive}
      headerRight={<WalletButton />}
      mobileExtra={<div className="flex justify-end"><WalletButton /></div>}
    >
      {children}
    </AppLayout>
  );
}
```

### 3. Wire into Layout.tsx dispatcher
```typescript
// components/layout/Layout.tsx
if (pathname.startsWith('/my-section')) {
  return <MySectionLayout>{children}</MySectionLayout>;
}
```

### 4. Register index path for exact active-link matching
```typescript
// hooks/useActiveNavigation.ts
if (path === '/dashboard' || path === '/deribit-agent' || path === '/routes' || path === '/my-section') {
  return router.pathname === path;
}
```

### AppLayout props reference
| Prop | Type | Purpose |
|---|---|---|
| `logo` | `{ icon, brand?, subtitle, href? }` | Header branding. `href` defaults to `'/'` |
| `navItems` | `NavItem[]` | Nav links. Supports `badge`, `disabled`, `adminOnly` |
| `isActive` | `(path) => boolean` | Active link detection. Inject from `useActiveNavigation()` or custom |
| `headerRight` | `ReactNode` | Desktop-only slot (hidden on mobile). Pass `<WalletButton />` |
| `mobileExtra` | `ReactNode` | Shown below nav in mobile panel; any click auto-closes it |
| `centerContent` | `boolean` | Centers main content vertically (SimpleLayout style) |

## 🔍 **Troubleshooting Guide**

### **Common Issues:**
- **Build Errors** → Run `yarn type-check` first
- **Wallet Issues** → Check `REOWN_PROJECT_ID` configuration
- **GraphQL Errors** → Verify API endpoints and keys
- **Performance Issues** → Use `yarn analyze` for bundle analysis

### **Architecture Decisions:**
- **Page Router** over App Router - Better Web3 compatibility
- **Apollo** over React Query - Better GraphQL integration
- **Wagmi** over Web3.js - Modern React-first approach
- **Tailwind** over Styled Components - Better performance

---

## 🎯 **Remember: This is an R&D Platform for Profit-Driven Innovation**

This platform serves **Wrytes AG's core mission**: using proprietary Bitcoin trading strategies to fund continuous blockchain research and development. Every technical decision should consider:

1. **How does this serve our R&D and trading operations?**
2. **Can this pattern be reused for future research tools?**
3. **Is this component generic enough for multiple business functions?**
4. **Does this maintain Swiss precision and quality standards?**
5. **How will this scale as our research and business operations grow?**

**Think software-development-first, research-driven-innovation, technical-excellence-always.**