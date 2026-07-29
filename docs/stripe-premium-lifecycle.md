# Stripe Premium lifecycle

## Architecture and source of truth

Funkollection uses the Firebase **Run Payments with Stripe** extension. Stripe is the billing
source of truth; the extension verifies Stripe webhooks and projects customers, Checkout sessions,
products, prices, and subscriptions into Firestore.

The application reads `customers/{uid}/subscriptions/{subscriptionId}` and normalizes those
extension-managed records. Clients may read their own subscription records but cannot write them.
Clients also cannot create Checkout documents. The authenticated `createPremiumCheckout` callable
creates a server-controlled Checkout request using the configured Premium Price and application
origin. The extension then adds the Stripe-hosted Checkout URL to that document.

Backend Premium features independently evaluate the extension-managed subscription records. A
browser redirect or frontend variable is never sufficient to grant backend access.

## Entitlement policy

- `active`: access through `current_period_end`.
- `trialing`: access through `trial_end`, falling back to `current_period_end`.
- `active` or `trialing` with `cancel_at_period_end: true`: access remains until the applicable end
  timestamp.
- `past_due`: no Premium access. The Account page directs the user to billing management.
- `incomplete`, `incomplete_expired`, `canceled`, `unpaid`, `paused`, missing, unknown, expired, or
  malformed records: no Premium access.
- Backend checks additionally require the configured `PREMIUM_PRICE_ID`.
- The existing administrator bypass remains intentional and separate from paid subscription state.

This is a fail-closed policy. If a temporary payment-failure grace period is desired later, define
its duration explicitly before changing `past_due`.

## Required configuration

Copy `functions/.env.example` to `functions/.env` and set non-secret, environment-specific values:

```text
PREMIUM_PRICE_ID=price_...
APP_URL=http://localhost:5173
```

For production, `APP_URL` should be the canonical HTTPS origin. Never pair a test Price with a live
extension secret key, or a live Price with a test extension secret key.

Stripe secret keys and webhook signing secrets belong in the installed extension's secret
configuration. Do not put them in repository `.env` files or frontend `VITE_` variables. The
Anthropic key is unrelated and remains a Firebase Functions secret.

## Stripe and extension configuration checklist

In the Stripe Dashboard and Firebase Extensions console, verify separately for test and live mode:

1. The Premium Product and recurring Price exist, are active, and have the expected currency,
   amount, and interval.
2. The extension is configured with the matching mode's secret key and products/prices collection.
3. The extension webhook endpoint is active and uses the matching endpoint signing secret.
4. The Customer Portal permits subscription cancellation and payment-method updates for the
   Premium Product.
5. The extension syncs at least:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
6. The extension version and configured Stripe API version are recorded before production changes.

Webhook signature verification, event retries, and Stripe-object synchronization are owned by the
extension. Do not add a second webhook endpoint unless ownership is deliberately migrated.

## Local and test-mode procedure

The Firestore emulator can test local rules, but it does not emulate Stripe or the installed
extension. A real hosted Checkout lifecycle requires a Firebase staging project with the extension
configured using Stripe test-mode resources.

1. Confirm the selected Firebase project is staging:

   ```powershell
   firebase use
   ```

2. Configure the staging function values in `functions/.env` with a Stripe test Price and staging
   application URL.
3. Deploy the callable, rules, and affected Premium functions to staging:

   ```powershell
   firebase deploy --only "functions:createPremiumCheckout,functions:funkoChat,functions:getCollectionLeaderboard,functions:setLeaderboardParticipation"
   firebase deploy --only firestore:rules
   ```

4. In Stripe's test-mode Dashboard, confirm the extension webhook has no failing deliveries.
5. Sign in with a dedicated staging Firebase user. Start Checkout from Account and use a
   Stripe-documented test payment method.
6. On return to `/account?checkout=success`, verify the page waits for the extension-managed
   subscription document. Direct navigation to this URL must leave a free user free.
7. Refresh, sign out/in, and open a new browser session. Access must still derive from Firestore.
8. Open **Manage subscription**, schedule cancellation, and verify:
   - `cancel_at_period_end` becomes true;
   - Account says access remains through the displayed date;
   - Premium gates remain open.
9. Reverse cancellation in the Portal and verify the flag and presentation clear.
10. Use a Stripe test clock where supported by the extension-created Customer. Advance through
    period end and verify the deleted/canceled projection removes access.
11. Use Stripe's documented failing-payment test methods and verify `past_due` removes access under
    the current policy while Portal management remains available.

Do not perform these steps against the production Firebase project or live Stripe mode.

## Duplicate, stale, and delayed events

The application performs only idempotent reads and projections; it does not increment benefits from
webhook events. Stripe webhook idempotency and stale-event handling remain extension-owned. Verify
duplicate and reordered deliveries against the exact installed extension version before declaring
the lifecycle production-ready.

The success return page observes Firestore and never grants access itself. If synchronization is
delayed, it continues to show the current trusted plan. The user can safely refresh the Account
page. A future reconciliation callable would require direct server-side Stripe API ownership; do
not accept customer or subscription IDs from the client.

## Deployment and rollback

Deploy backend authorization before relying on a new Premium feature:

```powershell
firebase deploy --only "functions:createPremiumCheckout,functions:funkoChat,functions:getCollectionLeaderboard,functions:setLeaderboardParticipation"
firebase deploy --only firestore:rules
```

After deployment, test one free user and one active test subscriber. If Checkout fails, restore the
previous function version or temporarily hide upgrade actions; do not re-enable client writes to
Checkout documents. If entitlement checks fail, inspect only event IDs, event types, function error
categories, and document status/timestamps. Never log complete Stripe objects or secret values.

## Common failures

- `Premium checkout is not configured`: `PREMIUM_PRICE_ID` or `APP_URL` is missing from the
  deployed Functions environment.
- Checkout document never receives a URL: extension trigger/configuration failure; inspect the
  extension function logs and the document's safe `error.message`.
- Account remains Free after payment: confirm the test-mode webhook delivery and resulting
  subscription document rather than trusting the success redirect.
- Portal cannot open: verify the extension Customer mapping and Portal configuration.
- Valid subscription denied by backend: verify the subscription contains the configured Price ID
  and a future billing-period timestamp.
- Firestore trigger deployment fails: verify the Eventarc service-agent role and API propagation.
