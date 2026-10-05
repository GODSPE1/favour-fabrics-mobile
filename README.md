# Favour Fabrics — Mobile (Expo / React Native)

Companion app for the Favour Fabrics web store. It shares the **same Supabase
project** and the **same FastAPI backend** as the web app, so a user's account,
cart, orders and profile are identical across both.

## Shared backend (no duplicated data)

```
React Native (this app)
      ↓ @supabase/supabase-js + AsyncStorage
Supabase Auth          ← same project → same user.id as the web app
      ↓
Supabase Postgres      ← profiles, products, orders, carts, cart_items
      ↓ (only for Paystack verification / initialization)
FastAPI backend        ← https://favour-fabrics.onrender.com
```

There is **no mobile-specific auth or database**. Signing in with the same
Google account (or email/password) gives the same `user_id`, which is what makes
the **cart sync** between web and mobile work.

## Cart behaviour

- **Guest** → stored locally (`AsyncStorage`)
- **Signed in** → stored in Supabase `carts` / `cart_items` (RLS: owner-only)
- **On sign-in** → the guest cart is merged into the server cart

## Screens

| Route | Description |
|---|---|
| `/(tabs)` | Shop — products grid + category filter |
| `/product/[id]` | Product detail |
| `/(tabs)/cart` | Cart (synced) |
| `/checkout` | Checkout — Paystack (hosted) or bank transfer |
| `/order-confirmation` | Success |
| `/(tabs)/orders` | Order history |
| `/(tabs)/account` | Profile / sign out |
| `/login` | Google + email/password |

## Environment

`.env` (public values only — safe to ship):

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=
EXPO_PUBLIC_BANK_NAME=
EXPO_PUBLIC_ACCOUNT_NAME=
EXPO_PUBLIC_ACCOUNT_NUMBER=
```

## Run

```bash
npm install
npx expo start
```

## Deep link / OAuth

App scheme: `favourfabrics`. Add these to Supabase →
**Authentication → URL Configuration → Redirect URLs**:

```
favourfabrics://**
exp://**        # for Expo Go during development
```

## Getting a build

```bash
npx eas build --profile development --platform android   # dev build
npx eas build --profile production  --platform android   # store build
```

> Card checkout uses Paystack's **hosted checkout** (the app asks the backend to
> initialize a transaction with the secret key, then opens the returned URL) —
> no native Paystack SDK required.
