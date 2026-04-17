---
tags: [guide, authentication, security, telegram, wallet]
description: How the wallet-based login flow works, including Telegram 2FA approval and session management.
---

# Authentication

## Overview

Wrytes uses a **wallet-based authentication** system with **Telegram as a second factor**. There are no passwords. Your identity is proven by signing a cryptographic challenge with your wallet, and access is gated by a Telegram approval from a linked account.

---

## Login Flow

### Step 1 — Connect Wallet

Click **Connect Wallet** in the header. The Reown AppKit modal opens, giving you the option to connect via:

- MetaMask (browser extension)
- WalletConnect (mobile wallets)
- Coinbase Wallet
- Safe (multisig)

Once your wallet is connected the modal automatically advances to the next step.

### Step 2 — Sign Message

The backend issues a one-time challenge message containing a nonce. You are asked to sign this message with your connected wallet — this proves ownership of the address without sending a transaction.

The signing request is handled by your wallet (e.g. MetaMask will show a signature popup). No gas is required.

### Step 3 — Telegram Approval

After the signature is submitted, a request is sent to your linked Telegram account via the Wrytes bot. You will receive a message asking you to approve or deny the login attempt.

- Tap **Allow** to approve
- Tap **Deny** to reject

The app polls the backend every 2 seconds waiting for your response. The session expires after the timeout shown in the modal if no action is taken.

### Step 4 — Authenticated

Once approved, a JWT is issued and stored locally. The modal closes and you have full access to the platform.

---

## Wallet Not Linked?

If your wallet address is not yet associated with a Telegram account, you will see the **Link Wallet** flow instead:

1. Sign an ownership message to generate a link token
2. Copy the `/link <token>` command shown in the UI
3. Send it to the Wrytes Telegram bot
4. The bot confirms the link — the app detects this automatically
5. The normal sign-in flow then resumes

Link tokens expire after **15 minutes**.

---

## Session Management

| Detail | Value |
|---|---|
| Token storage | `localStorage` (`wrytes_auth_token`) |
| Token type | JWT |
| Expiry | Set by backend at login |
| On wallet disconnect | Session cleared automatically |
| On token expiry | Returned to Connect Wallet step |

---

## Signing Out

Click your wallet address in the header and select **Sign Out**, or disconnect your wallet. Your local token is removed immediately.

---

## Security Notes

- The challenge message includes a nonce — replay attacks are not possible
- Telegram approval is required on every new login
- Private keys never leave your wallet — only a signature is transmitted
- The platform never stores or has access to your private key
