# Wrytes - Software Development Platform for Distributed Ledger Technologies

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.1.4-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?logo=tailwind-css)
![Wagmi](https://img.shields.io/badge/Wagmi-2.16.1-purple?logo=wagmi)

**A software development platform specializing in Distributed Ledger Technology solutions and AI**

[Live Demo](https://wrytes.io) • [AI Agent Guide](./CLAUDE.md) • [In-App Docs](https://wrytes.io/docs) • [API Docs](https://api.wrytes.io)

</div>

---

## 🎯 **Platform Vision**

**Wrytes** is a Swiss R&D company specializing in **software development for Distributed Ledger Technologies and AI**. We create cutting-edge tools, protocol adapters, and full-stack applications. Our proprietary Bitcoin option trading strategies provide **independent funding** for continuous innovation and research.

### **🏗️ Core Business Philosophy:**
- **💰 Profit-Driven Independence** - Operating exclusively with company assets, trading profits fund R&D
- **🔬 Research-First Development** - Every tool serves our research and innovation goals
- **🧩 Component Reusability** - Maximize reuse of existing components before building new ones
- **📱 Mobile-First Responsive** - Consistent patterns across all features
- **🏢 Swiss Precision** - Built with meticulous attention to detail and quality
- **🔧 Feature-Based Structure** - Each major feature is self-contained and pluggable

### **🚀 Business & Technology Roadmap:**
- **💻 Software Development** (Core) - Full-stack solutions for Distributed Ledger Technologies and AI
- **🛠️ Technical Services** (Revenue) - Development services for clients and partners
- **🚀 Platform Development** (Innovation) - Proprietary tools and research prototyping
- **🤝 Strategic Partnerships** (Growth) - Technology sharing and collaboration agreements
- **🔗 Protocol Integrations** (Current) - Multi-protocol adapters and system integrations
- **🔄 Transaction Management Systems** (Current) - Advanced deployment and monitoring tools
- **⚙️ Platform Operations Tools** (Future) - Enhanced infrastructure and automation systems
- **🔍 R&D Innovation Tools** (Future) - Cutting-edge technology research and development

## 🏢 About Wrytes AG

**Wrytes AG** is a Swiss company based in Zug, Switzerland (Crypto Valley), specializing in:
- **Software Development & Distributed Ledger Technologies** - Full-stack solutions from smart contracts to applications
- **Protocol Adapters & System Integrations** - Advanced tools for Distributed Ledger ecosystems
- **Technical Consulting & Development Services** - Expert development services for clients and partners
- **Platform Development & Innovation** - Cutting-edge technology research and prototyping
- **Proprietary Asset Management** - Independent revenue through Bitcoin option trading strategies funding R&D
- **Strategic Partnerships** - Technology sharing and collaboration agreements

## ✨ Current Features

### 🔐 **Wallet + Telegram Authentication**
- **No Passwords** - Identity proven by signing a cryptographic challenge with a connected wallet
- **Telegram 2FA** - Every login is approved or denied from a linked Telegram account
- **Multi-Wallet Support** - MetaMask, WalletConnect, Coinbase Wallet, Safe (multisig)
- **Scope-Based Access Control** - JWT-encoded scopes gate features at the component and page level (`ADMIN` bypasses all checks)

### 🤖 **Deribit Agent**
- **RL Trading Agents** - Train and run PPO/DQN/A2C reinforcement-learning agents for Bitcoin options
- **Backtest, Paper & Live Runs** - Promote a trained model from historical replay to live Deribit orders
- **Training Sessions & Model Registry** - Track hyperparameters, rewards, and model artifacts per run

### 📊 **Coin Tracking / Accounting**
- **Token Transfer Classification** - Categorize on-chain transfers against a chart of accounts
- **Journal Templates** - Configurable accounting templates per quarter
- **Native Browser Export** - Print/export reports without a PDF dependency

### 🧾 **Invoices / Bills**
- **AI Document Extraction** - Upload a bill; the platform extracts line items and assigns a payment address
- **Payment Tracking** - Manage bills end-to-end from upload to settlement

### 💱 **Routes (On/Off-Ramp)**
- **Kraken Integration** - Convert between fiat and crypto using linked Kraken API credentials
- **Execution History** - Full audit trail of on-ramp and off-ramp conversions

### 🎨 **User Experience**
- **Warm Off-White Light Theme** - Professional Swiss design aesthetic with a consistent brand-orange accent
- **Responsive Design** - Mobile-first, works on all devices
- **Loading States** - Skeleton components and smooth transitions
- **Error Handling** - Graceful fallbacks and user-friendly messages
- **Transaction Queue** - Redux-powered batch transaction management UI

## 🛠️ Technology Stack

### **Core Framework**
- **[Next.js 16.1.4](https://nextjs.org/)** - React framework with Pages Router
- **[React 19.1.0](https://react.dev/)** - Latest React with concurrent features
- **[TypeScript 5.8.2](https://www.typescriptlang.org/)** - Full type safety

### **Web3 & Blockchain**
- **[Wagmi 2.16.1](https://wagmi.sh/)** - React hooks for Ethereum
- **[Viem 2.33.2](https://viem.sh/)** - TypeScript Ethereum library
- **[Reown AppKit 1.6.4](https://reown.com/)** - Multi-wallet connection
- **[Apollo Client 3.13.9](https://www.apollographql.com/)** - GraphQL state management

### **UI & Styling**
- **[Tailwind CSS 3.4.17](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Framer Motion 12.23.12](https://www.framer.com/motion/)** - Advanced animations
- **[Headless UI 2.2.7](https://headlessui.com/)** - Accessible UI components
- **[FontAwesome 7.0.0](https://fontawesome.com/)** - Professional icon system

### **State Management**
- **[Redux Toolkit 2.8.2](https://redux-toolkit.js.org/)** - Global state management
- **[React Redux 9.2.0](https://react-redux.js.org/)** - React bindings for Redux
- **[Redux Persist 6.0.0](https://github.com/rt2zz/redux-persist)** - State persistence

### **Forms & Validation**
- **[React Hook Form 7.61.1](https://react-hook-form.com/)** - Performant forms
- **[Zod 4.0.14](https://zod.dev/)** - Schema validation
- **[React Hot Toast 2.5.2](https://react-hot-toast.com/)** - Toast notifications

### **Development Tools**
- **[Turbopack](https://turbo.build/)** - Fast development bundler
- **[ESLint](https://eslint.org/)** - Code linting and formatting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[GraphQL Codegen](https://the-guild.dev/graphql/codegen)** - Type-safe GraphQL

## 📁 Project Structure

```
wrytes/
├── components/              # 🧩 Reusable UI Components
│   ├── ui/                 # Generic UI primitives (ALWAYS REUSE THESE)
│   │   ├── input/          # ButtonInput, TextInput, TokenInput, SelectInput, ...
│   │   ├── layout/          # PageHeader, Section, Breadcrumb
│   │   ├── modal/           # Modal system with confirm variants
│   │   ├── stats/           # Metric display components
│   │   └── table/           # Table, TableRow, TableHeadSearchable, ...
│   ├── features/           # 🚀 Feature-specific components
│   │   ├── accounting/      # Coin-tracking / accounting feature module
│   │   ├── routes/          # On/off-ramp routes feature
│   │   ├── deribitAgent/    # Deribit Agent shared components
│   │   └── [feature]/       # Other feature modules
│   ├── layouts/             # 📐 Layout components (AppLayout, section variants)
│   └── landing/             # 🏠 Landing page sections
├── hooks/                  # 🔗 Custom React hooks
│   ├── redux/              # Redux state hooks
│   ├── ui/                 # Generic UI hooks
│   ├── web3/               # Web3 interaction hooks
│   └── [feature]/          # Feature-specific hooks
├── lib/                    # 🛠️ Business logic & integrations
│   ├── navigation/         # Nav configs — one file per section
│   ├── web3/               # Web3 configuration
│   ├── graphql/             # GraphQL client & queries
│   ├── deribit-agent/       # Deribit Agent API client
│   └── utils/               # Utility functions
├── redux/                  # 📊 Global state management
│   └── slices/             # Feature-specific slices
├── docs/                   # 📖 In-app documentation content (rendered at /docs)
└── pages/                  # 🚀 Next.js pages (dashboard, deribit-agent, routes,
                             #    invoices, coin-tracking, legal, docs, auth)
```

See [CLAUDE.md](./CLAUDE.md) for the full, actively-maintained structure reference.

## 🧩 **Component Reusability Strategy**

### **CRITICAL: Always Reuse Existing Components**

**Before building new components, check these locations:**

1. **`components/ui/`** - Generic UI primitives
   - `input/ButtonInput.tsx` - Variants: `primary | secondary | outline | ghost | error`
   - `Card.tsx` - Flexible card with header, content, footer
   - `modal/` - Complete modal system with confirm variants
   - `stats/` - Metric display with various layouts
   - `table/` - Generic table/row components with searchable headers

2. **`components/layouts/`** - Shared layout pieces
   - `AppLayout.tsx` - Generic layout shell — inject `logo`, `navItems`, `isActive`, `headerRight`, `mobileExtra`
   - `actions/WalletButton.tsx` - Self-contained wallet connect/display
   - `footers/FooterSimple.tsx` - Minimal footer strip rendered by `AppLayout` automatically

3. **`components/features/[existing-feature]/`** - Feature-specific patterns
   - Reuse patterns from `routes/` or `tokenTransfers/` for data-heavy features

4. **`hooks/ui/`** - Generic UI hooks
   - `useModal.ts` - Modal state management

5. **`hooks/redux/`** - Redux state management hooks
   - `useTransactionQueue.ts` - Transaction queue management

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **Yarn** (required, not npm)
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/wrytes/wrytes-app.git
cd wrytes-app

# Install dependencies
yarn install

# Copy environment variables
cp .env.example .env.local

# Configure your environment variables
# Edit .env.local with your API keys and endpoints

# Start development server
yarn dev
```

### Environment Setup

Create `.env.local` from `.env.example` and configure:

```bash
# API Configuration
NEXT_PUBLIC_APP_URL=https://wrytes.io
NEXT_PUBLIC_API_URL=https://api.wrytes.io
NEXT_PUBLIC_INDEXER_URL=https://indexer.wrytes.io
NEXT_PUBLIC_DERIBIT_AGENT_URL=https://deribit-agent.api.wrytes.io

# Web3 Configuration
NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_RPC_URL=your_alchemy_api_key

# Optional: App Analytics
NEXT_PUBLIC_UMAMI_URL=https://analytics.wrytes.io
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your_umami_website_id
```

## 📜 Available Scripts

### **Development**
```bash
yarn dev          # Start development server (with Turbopack)
yarn build        # Build for production
yarn start        # Start production server
yarn type-check   # TypeScript type checking
```

### **Code Quality**
```bash
yarn lint         # Run ESLint
yarn lint:fix     # Fix ESLint errors automatically
yarn format       # Format code with Prettier
yarn format:check # Check code formatting
```

### **Analysis**
```bash
yarn analyze      # Analyze bundle size
```

## 🏗️ Architecture Overview

### **Component Architecture**
- **Feature-Based Organization** - Components grouped by business domain
- **Composition Pattern** - Reusable component composition
- **Custom Hooks** - Business logic extraction from components
- **TypeScript Interfaces** - Comprehensive type definitions

### **State Management**
- **Redux Toolkit** - Global application state (transactions, user preferences, queue management)
- **Apollo Client Cache** - GraphQL data caching and normalization
- **React Context** - Authentication and namespace management
- **Local State** - Component-level UI state

### **Data Flow**
```
User Action → Component → Custom Hook/Adapter → API/Contract → Apollo Cache/Redux → UI Update
```

## 🔐 Authentication System

Wrytes uses **wallet-based authentication with Telegram as a second factor** — there are no passwords.

### **Login Flow**
1. User connects a wallet (MetaMask, WalletConnect, Coinbase, Safe)
2. Backend issues a one-time challenge message with a nonce
3. User signs the message with their wallet (no gas required)
4. A request is sent to the user's linked Telegram account for approval; the app polls until it's approved, denied, or times out
5. Once approved, the backend issues a JWT (scopes included) and the frontend stores it locally

### **Scope-Based Access Control**
- Each account holds an array of **scopes** encoded in its JWT
- `ADMIN` bypasses all scope checks and grants full access
- Named feature scopes gate individual sections via `<RequireScope>` at the component level

See the in-app [Authentication](https://wrytes.io/docs/0002_Authentication) and [Access Control](https://wrytes.io/docs/0200_Access%20Control) docs for full detail.

## 🚀 **Feature Development Guidelines**

### **New Feature Implementation Pattern:**

1. **Create Feature Directory:**
   ```
   components/features/[featureName]/
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

3. **Add to Navigation:**
   ```
   lib/navigation/[section].ts
   ```

4. **Follow Existing Patterns:**
   - Use `routes/` or `tokenTransfers/` as reference for data-heavy features
   - Reuse `ui/` components extensively

### **Feature Integration Checklist:**
- [ ] Reuse existing UI components from `components/ui/`
- [ ] Create feature-specific hooks in `hooks/[feature]/`
- [ ] Add to navigation system
- [ ] Implement proper loading states
- [ ] Add error boundaries
- [ ] Include proper TypeScript types
- [ ] Add to Redux if global state needed
- [ ] Integrate with transaction queue system if transactions required

## 🤝 Contributing

We welcome contributions from the community! Please read our contributing guidelines:

### **Development Setup**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`yarn type-check && yarn lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### **Code Standards**
- **TypeScript strict mode** - No `any` types
- **ESLint + Prettier** - Consistent code formatting
- **Comprehensive type definitions** - Full type safety
- **Component testing** - Test critical functionality
- **Component reusability** - Always check existing components first

## 📄 License

This project is proprietary software of **Wrytes AG**. All rights reserved.

## 📞 Contact & Support

### **Wrytes AG**
- **🏢 Address**: Zug, Switzerland
- **🌐 Website**: [wrytes.io](https://wrytes.io)
- **📧 Contact**: [hello@wrytes.io](mailto:hello@wrytes.io)

### **Development Team**
- **🔧 Technical Issues**: Create an issue on GitHub
- **💡 Feature Requests**: Create an issue on GitHub
- **🐛 Bug Reports**: [hello@wrytes.io](mailto:hello@wrytes.io)

---

<div align="center">

**Built with 🇨🇭 Swiss precision by [Wrytes AG](https://wrytes.io)**

*Software Development & Distributed Ledger Technologies & AI*

**Remember: This is an R&D Platform for Profit-Driven Innovation**

This platform serves **Wrytes AG's core mission**: using proprietary Bitcoin trading strategies to fund continuous blockchain research and development. Every technical decision should consider:

1. **How does this serve our R&D and trading operations?**
2. **Can this pattern be reused for future research tools?**
3. **Is this component generic enough for multiple business functions?**
4. **Does this maintain Swiss precision and quality standards?**
5. **How will this scale as our research and business operations grow?**

**Think software-development-first, research-driven-innovation, technical-excellence-always.**

</div>
