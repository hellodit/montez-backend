import type { SubscriptionStatus } from "../../db/constants";

export interface MidtransNotificationPayload {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status:
    | "capture"
    | "settlement"
    | "pending"
    | "deny"
    | "cancel"
    | "expire"
    | "refund"
    | "partial_refund";
  fraud_status?: "accept" | "challenge" | "deny";
  transaction_id: string;
  payment_type: string;
}

/**
 * TODO(owner): implement the transaction_status (+ fraud_status) mapping.
 * This decides exactly when a paying user gets access to their plan — see
 * "Left for the owner" in docs/superpowers/specs/2026-08-11-billing-midtrans-design.md
 * for the trade-offs (challenge vs accept on card capture, whether deny/cancel/expire
 * collapse into one `failed` or stay distinct, what to do with refund/partial_refund).
 *
 * Whatever this returns, the caller (billing.service.ts) already handles:
 * idempotency (won't overwrite a terminal row), setting subscriptionExpiresAt
 * only when the result is "paid", and persisting the raw payload for audit.
 */
export function mapMidtransStatus(payload: MidtransNotificationPayload): SubscriptionStatus {
  throw new Error("mapMidtransStatus() is not implemented yet — see the TODO above.");
}
