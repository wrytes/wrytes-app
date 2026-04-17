---
tags: [wallets, accounts, linking, management]
description: How to link, view, and unlink wallet addresses from your account.
---

# Wallet Management

## Overview

A user account on Wrytes can have multiple wallet addresses linked to it. Each wallet is associated via a Telegram-verified ownership proof. You can link additional wallets, view all linked addresses, and unlink wallets you no longer use.

---

## Linking a New Wallet

1. Connect the new wallet address using the **Connect Wallet** button in the header
2. If the address is not yet registered, the authentication modal will show the **Link Wallet** step
3. Sign the ownership message when prompted — this generates a link token
4. Copy the `/link <token>` command displayed in the UI
5. Send the command to the **Wrytes Telegram bot**
6. The bot confirms ownership; the app detects the confirmation automatically
7. Sign in normally with the newly linked wallet

Link tokens are single-use and expire after **15 minutes**.

---

## Viewing Linked Wallets

Navigate to **Profile** (`/dashboard/profile`) to see all wallet addresses currently linked to your account. Each entry shows:

- Full wallet address
- Network association
- Link date

---

## Unlinking a Wallet

From the Profile page, click the unlink icon next to any wallet address you want to remove. You will be asked to confirm the action.

> **Note:** You cannot unlink the wallet address you are currently authenticated with. Switch to a different wallet first, or sign out before unlinking.

---

## Multi-Wallet Behaviour

- Any linked wallet can be used to log in — all share the same account and scopes
- The wallet address used for the current session is shown in the header
- The JWT issued at login is tied to the specific wallet address used in that session

---

## Supported Wallet Types

| Wallet | Connection Method |
|---|---|
| MetaMask | Browser extension |
| WalletConnect | QR code / mobile deep link |
| Coinbase Wallet | Browser extension or mobile |
| Safe | Smart contract multisig |
