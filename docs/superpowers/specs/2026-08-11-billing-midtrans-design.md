# Subscription plan top-up via Midtrans — Design (backend)

Date: 2026-08-11
Status: Approved

## Goal

Let a logged-in user upgrade their subscription plan (Standard / Premium /
Gold / Enterprise) from the profile page and pay via Midtrans. This spec
covers the backend: pricing catalog, checkout, and payment-status webhook.

Companion spec (frontend page, tabs, plan-picker UI):
`montez-fe/docs/superpowers/specs/2026-08-11-billing-plan-page-design.md`.

## Non-goals

- The "AI" and "Addon" tabs shown alongside "Plan" in the reference UI —
  placeholder-only on the frontend, no backend support.
- A real plan catalog in the database. Plans/prices are intentionally fake for
  now (owner's call) — see "Pricing catalog" below for why it's still a
  backend constant rather than a purely frontend one.
- Enterprise-specific "contact sales" flow — Enterprise is just a fourth plan
  with a (fake) price and goes through the same checkout as the others.
- Plan downgrade, cancellation, proration, or stacking a renewal on top of an
  unexpired plan. Every successful checkout simply sets
  `subscriptionExpiresAt = now + period`, overwriting whatever was active.

## Pricing catalog

Plans and per-period prices are a **hardcoded constant**, duplicated in both
frontend (`montez-fe/app/utils/plans.ts`, source of truth for what renders)
and backend (`src/modules/billing/billing.constants.ts`, source of truth for
what gets charged). The backend never trusts a client-supplied amount — the
frontend sends `planId` + `periodId`, and `checkout` looks up the price
server-side. This is the one piece of real security hygiene worth keeping
even though the catalog itself is fake: without it, a user could tamper the
amount before it reaches Midtrans.

```ts
export const PLAN_IDS = ["standard", "premium", "gold", "enterprise"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export const PERIOD_IDS = ["1m", "3m", "6m", "12m"] as const;
export type PeriodId = (typeof PERIOD_IDS)[number];

export const PERIOD_MONTHS: Record<PeriodId, number> = { "1m": 1, "3m": 3, "6m": 6, "12m": 12 };

// IDR. Mirrors montez-fe/app/utils/plans.ts — keep both in sync by hand until
// a real plan catalog exists.
export const PLAN_PRICING: Record<PlanId, Record<PeriodId, number>> = {
  standard:   { "1m": 19_000, "3m": 49_000,  "6m": 89_000,  "12m": 159_000 },
  premium:    { "1m": 29_000, "3m": 79_000,  "6m": 139_000, "12m": 249_000 },
  gold:       { "1m": 49_000, "3m": 129_000, "6m": 229_000, "12m": 399_000 },
  enterprise: { "1m": 99_000, "3m": 269_000, "6m": 469_000, "12m": 799_000 },
};
```

## Data model

New table `subscription_transactions` (`src/db/schema/subscription-transactions.ts`,
added to `src/db/schema/index.ts`), following the `agent_webhooks` pattern:

```ts
export const SUBSCRIPTION_STATUS = {
  pending: "pending",
  paid: "paid",
  failed: "failed",
  expired: "expired",
  cancelled: "cancelled",
} as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];
// ^ lives in src/db/constants.ts, per that file's existing convention.

export const subscriptionTransactions = pgTable(
  "subscription_transactions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),

    // Sent to Midtrans as order_id. "SUB-<uuid>" — unique, never reused.
    orderId: text("order_id").notNull().unique(),

    planId: text("plan_id").notNull(),
    periodId: text("period_id").notNull(),

    // Snapshot of PLAN_PRICING at checkout time — the catalog constant can
    // change later without rewriting history.
    amount: integer("amount").notNull(),

    status: text("status").$type<SubscriptionStatus>().notNull().default(SUBSCRIPTION_STATUS.pending),

    snapToken: text("snap_token"),
    midtransTransactionId: text("midtrans_transaction_id"),
    paymentType: text("payment_type"), // "qris" | "bank_transfer" | ... — from notification
    subscriptionExpiresAt: timestamp("subscription_expires_at"), // set when status becomes "paid"

    // Last Midtrans notification payload, verbatim — audit/debug trail.
    rawNotification: jsonb("raw_notification"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("subscription_transactions_user_id_idx").on(table.userId)],
);
```

**No separate "current subscription" table.** The active plan is derived:

```sql
select * from subscription_transactions
where user_id = :userId and status = 'paid' and subscription_expires_at > now()
order by subscription_expires_at desc
limit 1
```

One table, one source of truth — avoids keeping a second state column in sync
with transaction history.

## Third-party client: `src/thirdparty/midtrans/midtrans.ts`

Follows the `instagram.ts` template (wraps `outboundRequest`):

```ts
const MIDTRANS_BASE_URL = env.MIDTRANS_IS_PRODUCTION
  ? "https://app.midtrans.com"
  : "https://app.sandbox.midtrans.com";

function authHeader(): Record<string, string> {
  // Midtrans Snap API auth: HTTP Basic with the server key as username, empty password.
  const token = Buffer.from(`${env.MIDTRANS_SERVER_KEY}:`).toString("base64");
  return { Authorization: `Basic ${token}`, "Content-Type": "application/json" };
}

export function createSnapTransaction(input: {
  orderId: string;
  grossAmount: number;
  customerEmail: string;
  customerName: string;
  itemName: string;
}): Promise<{ token: string; redirect_url: string }> {
  return outboundRequest(`${MIDTRANS_BASE_URL}/snap/v1/transactions`, {
    method: "POST",
    headers: authHeader(),
    body: {
      transaction_details: { order_id: input.orderId, gross_amount: input.grossAmount },
      customer_details: { email: input.customerEmail, first_name: input.customerName },
      item_details: [{ id: input.orderId, price: input.grossAmount, quantity: 1, name: input.itemName }],
    },
  });
}
```

`MIDTRANS_SERVER_KEY` unset → `checkout` returns `503`, same pattern as
`GOOGLE_CLIENT_ID`/`META_APP_ID`.

## New module: `src/modules/billing/`

Same `routes/controller/service/schema/types` split as `social-accounts`.
Mounted at `/api/billing`.

| Endpoint | Auth | Behavior |
|---|---|---|
| `GET /billing/plans` | `requireAuth` | Returns `PLAN_PRICING` — lets the frontend cross-check its own constant; not the primary render path. |
| `GET /billing/current` | `requireAuth` | Runs the derive query above; returns the active row (plan, period, expiry) or `null`. |
| `POST /billing/checkout` | `requireAuth` | Body `{ planId, periodId }` (Zod, must be one of `PLAN_IDS`/`PERIOD_IDS`, else `422`). Looks up `amount` from `PLAN_PRICING` server-side, inserts a `pending` row with a fresh `orderId`, calls `createSnapTransaction`, stores `snapToken`, returns `{ orderId, snapToken }`. |
| `POST /billing/midtrans/notification` | **public**, no JWT | Midtrans calls this directly. See below. |

### Checkout flow

1. Frontend `POST /billing/checkout { planId, periodId }`.
2. Backend validates ids, computes `amount`, inserts `subscription_transactions`
   row (`status: pending`), calls Midtrans (`customer_details` pulled from the
   authenticated user's own `name`/`email` on the `user` table — no new input
   needed from the request body), persists `snapToken`.
3. Frontend receives `{ orderId, snapToken }`, calls Snap.js's
   `window.snap.pay(snapToken, { onSuccess, onPending, onError, onClose })`.
4. `onSuccess`/`onPending` trigger exactly one `GET /billing/current` refetch
   plus a toast — not a polling loop. The row only actually flips to `paid` via
   the webhook below; this refetch is just UX responsiveness for the common
   case where the webhook already landed by the time the popup closes.

### Notification (webhook) flow

`POST /billing/midtrans/notification` is unauthenticated by design (Midtrans
has no way to send our JWT) and instead trusts Midtrans's own signature:

```
signature_key ==? sha512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)
```

If the computed hash doesn't match the payload's `signature_key`, respond
`401` and touch nothing.

If it matches:

1. Look up the row by `order_id`. Not found → log and respond `200` anyway
   (Midtrans retries on any non-2xx; a row we don't recognize will never
   start existing just by getting retried, so returning `200` stops the noise
   without us claiming to have processed it).
2. If the row's `status` is already terminal (`paid`, `failed`, `expired`,
   `cancelled`), respond `200` without writing — Midtrans redelivers
   notifications, and a terminal status must never be overwritten by a stale
   or duplicate one.
3. Otherwise, map `transaction_status` (+ `fraud_status` for card payments) to
   one of our `SubscriptionStatus` values via `mapMidtransStatus()` — see
   "Left for the owner" below — and update the row: `status`,
   `midtransTransactionId` (Midtrans's `transaction_id`), `paymentType`,
   `rawNotification` (the full payload), and — only when the mapped status is
   `paid` — `subscriptionExpiresAt = now + PERIOD_MONTHS[periodId] months`.
4. Always respond `200` once signature verification passed and the row was
   found, regardless of what status it mapped to — Midtrans only cares that
   we acknowledged receipt.

## Left for the owner: `mapMidtransStatus()`

Everything above is scaffolded (signature check, lookup, idempotency, DB
write) — the one real business decision is the status mapping itself, because
it decides exactly when a paying user gets access:

```ts
// src/modules/billing/midtrans-status.ts
export interface MidtransNotificationPayload {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: "capture" | "settlement" | "pending" | "deny" | "cancel" | "expire" | "refund" | "partial_refund";
  fraud_status?: "accept" | "challenge" | "deny";
  transaction_id: string;
  payment_type: string;
}

/**
 * TODO(owner): decide the transaction_status (+ fraud_status) → SubscriptionStatus
 * mapping. Things to weigh:
 * - `capture` + fraud_status "challenge" (card payments flagged by Midtrans's
 *   fraud detection): treat as `pending` until a human reviews it in the
 *   Midtrans dashboard, or trust Midtrans and auto-mark `paid`?
 * - `capture` + fraud_status "accept", and `settlement` (non-card methods have
 *   no fraud_status at all): these are the uncontroversial `paid` cases.
 * - `deny`, `cancel`, `expire`: three different reasons a payment didn't go
 *   through. Collapse all three into `failed`, or keep `expire` as its own
 *   status so the UI can say "your payment window closed" instead of
 *   "payment failed"?
 * - `refund` / `partial_refund`: out of scope for this feature (no refund UI
 *   exists yet) — pick whatever the type system requires without over-building.
 */
export function mapMidtransStatus(payload: MidtransNotificationPayload): SubscriptionStatus {
  // TODO(owner): implement.
}
```

## Config

`.env.example` (new block, following the existing "optional, feature replies
503 when blank" convention) and `src/config/index.ts` (Zod):

```
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false
```

## Error handling

- `MIDTRANS_SERVER_KEY` unset → `checkout` returns `503`.
- `checkout` with an unknown `planId`/`periodId` → `422` (Zod enum failure).
- Notification with a bad signature → `401`, no DB write.
- Notification for an unknown `order_id` → `200` (see webhook flow step 1),
  logged.
- Notification for an already-terminal row → `200`, no overwrite (idempotency).

## Testing

- Unit test `mapMidtransStatus()` against sample sandbox payloads for each
  `transaction_status`/`fraud_status` combination once the owner fills it in.
- Unit test signature verification (valid signature passes, tampered
  `gross_amount` or `signature_key` fails).
- Unit test the price lookup (`PLAN_PRICING[planId][periodId]`) and the
  derive-current-plan query logic.
- Route tests (`billing.test.ts`, pattern from `social-accounts.test.ts`):
  `checkout` requires auth and returns `503` when unconfigured; `notification`
  rejects bad signatures with `401` and never requires auth.
- No live call to Midtrans in tests — the HTTP boundary is mocked, same as
  the Instagram client tests.

## Out of scope for this feature

- Real plan catalog / pricing table in the database.
- Renewal reminders, expiry notifications, dunning.
- Refund handling in the notification handler.
- Wiring the existing `dashboard/transaction.vue` (currently mock data) to
  read from `subscription_transactions` — natural follow-up, not required
  for the checkout flow to work.
