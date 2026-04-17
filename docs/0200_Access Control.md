---
tags: [access-control, scopes, permissions, admin, security]
description: How roles and scopes control feature access across the platform.
---

# Access Control

## Overview

Wrytes uses a **scope-based permission system** encoded in the JWT issued at login. Scopes are assigned to user accounts and determine which features and actions are available after authentication.

---

## Scopes

Each user account holds an array of scope strings. When you log in, your JWT contains these scopes and the frontend enforces them at the component and page level.

### ADMIN

The `ADMIN` scope grants full access to all features and bypasses all other scope checks. Admins can see and interact with every section of the platform.

### Feature Scopes

Individual features may require a specific named scope. If your account does not hold the required scope, the protected content is hidden or replaced with an access-denied message.

Your current scopes are visible on the **Profile** page after logging in.

---

## How Enforcement Works

### Component-level — `<RequireScope>`

Wraps any UI element. Children are only rendered if the authenticated user holds the required scope (or `ADMIN`).

```tsx
<RequireScope scope="ACCOUNTS_WRITE" active={true}>
  <AddAccountButton />
</RequireScope>
```

### Page-level — `withScopeProtection`

A higher-order component that protects entire pages. Users without the required scope are redirected or shown an access-denied view.

### `<UserBadge>`

Displays a small badge next to the user's name showing their highest-privilege scope for quick reference.

---

## Requesting Access

Scopes are assigned by an administrator. If you need access to a feature that is currently unavailable, contact the platform admin via Telegram.

---

## Security Model

- Scopes are embedded in the signed JWT — they cannot be modified client-side
- Every session re-issues a fresh JWT via the Telegram approval step
- Disconnecting your wallet immediately invalidates the local session
- Backend endpoints enforce scope requirements independently of the frontend
