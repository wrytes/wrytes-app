---
tags: [guide, dashboard, navigation, overview]
description: What the dashboard contains, how navigation works, and where to find each feature.
---

# Dashboard

## Overview

The Dashboard is the main workspace of the Wrytes platform. It is accessible after authentication and provides access to all platform features via the left-hand sidebar.

---

## Layout

```
┌─────────────────────────────────────────┐
│  Header (logo · wallet address)         │
├──────────────┬──────────────────────────┤
│              │                          │
│   Sidebar    │   Main content area      │
│   (nav)      │                          │
│              │                          │
└──────────────┴──────────────────────────┘
```

On mobile, the sidebar collapses into a top navigation menu toggled by the hamburger icon.

---

## Navigation Sections

### Overview `/dashboard`

The landing page after login. Shows a stats grid with key portfolio metrics and serves as the component library reference for developers.

### Accounts `/dashboard/accounts`

Manage bank accounts used for off-ramp operations. Add, verify, and remove accounts associated with your profile.

### Routes `/dashboard/routes`

Configure and monitor on-ramp and off-ramp conversion routes. View available conversion paths and their current status.

### Profile `/dashboard/profile`

Manage your user profile including:

- Display name and personal details
- Telegram handle (read-only — set during wallet link)
- Linked wallet addresses
- Scope and permission overview

---

## Header

The header is fixed at the top of every dashboard page and contains:

- **Wrytes logo** — links back to the home page
- **Wallet address / display name** — click to open the wallet management modal
- **Connect Wallet button** — shown when no wallet is connected

On mobile, the **hamburger menu** opens an inline navigation panel.

---

## Docs `/docs`

The documentation library (where you are now) is accessible from the sidebar of the Docs section, which uses its own layout separate from the Dashboard. Navigate back using the **Back to Dashboard** link in the docs sidebar.
