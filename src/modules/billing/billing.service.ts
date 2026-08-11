import { and, desc, eq, gt } from "drizzle-orm";
import { env } from "../../config";
import { SUBSCRIPTION_STATUS } from "../../db/constants";
import { db } from "../../db/client";
import { subscriptionTransactions } from "../../db/schema";
import { ownedBy } from "../../db/helpers";
import { AppError } from "../../lib/errors";
import { createSnapTransaction, verifyNotificationSignature } from "../../thirdparty/midtrans/midtrans";
import { PERIOD_MONTHS, PLAN_NAMES, PLAN_PRICING } from "./billing.constants";
import type { PeriodId, PlanId } from "./billing.constants";
import { mapMidtransStatus } from "./midtrans-status";
import type { MidtransNotificationPayload } from "./midtrans-status";
import type { CheckoutResult, CurrentSubscription } from "./billing.types";

function assertMidtransConfigured() {
  if (!env.MIDTRANS_SERVER_KEY || !env.MIDTRANS_CLIENT_KEY) {
    throw new AppError("Billing is not configured.", 503);
  }
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/** "Plan aktif" di-derive: row `paid` dengan expiry terjauh yang belum lewat. */
export async function getCurrentSubscription(userId: string): Promise<CurrentSubscription | null> {
  const [row] = await db
    .select()
    .from(subscriptionTransactions)
    .where(
      and(
        ownedBy(subscriptionTransactions, userId),
        eq(subscriptionTransactions.status, SUBSCRIPTION_STATUS.paid),
        gt(subscriptionTransactions.subscriptionExpiresAt, new Date()),
      ),
    )
    .orderBy(desc(subscriptionTransactions.subscriptionExpiresAt))
    .limit(1);

  if (!row || !row.subscriptionExpiresAt) return null;

  return {
    planId: row.planId as PlanId,
    periodId: row.periodId as PeriodId,
    status: row.status,
    subscriptionExpiresAt: row.subscriptionExpiresAt.toISOString(),
  };
}

export async function checkout(
  userId: string,
  input: { planId: PlanId; periodId: PeriodId },
  customer: { email: string; name: string },
): Promise<CheckoutResult> {
  assertMidtransConfigured();

  const amount = PLAN_PRICING[input.planId][input.periodId];
  const orderId = `SUB-${crypto.randomUUID()}`;

  await db.insert(subscriptionTransactions).values({
    userId,
    orderId,
    planId: input.planId,
    periodId: input.periodId,
    amount,
    status: SUBSCRIPTION_STATUS.pending,
  });

  const { token } = await createSnapTransaction({
    orderId,
    grossAmount: amount,
    customerEmail: customer.email,
    customerName: customer.name,
    itemName: `${PLAN_NAMES[input.planId]} — ${input.periodId}`,
  });

  await db
    .update(subscriptionTransactions)
    .set({ snapToken: token, updatedAt: new Date() })
    .where(eq(subscriptionTransactions.orderId, orderId));

  return { orderId, snapToken: token };
}

const TERMINAL_STATUSES: string[] = [
  SUBSCRIPTION_STATUS.paid,
  SUBSCRIPTION_STATUS.failed,
  SUBSCRIPTION_STATUS.expired,
  SUBSCRIPTION_STATUS.cancelled,
];

/**
 * Webhook Midtrans. Signature tidak valid → AppError(401), tidak menyentuh DB.
 * order_id tidak dikenal, atau row sudah di status terminal → no-op (idempotent),
 * bukan error — dianggap "sudah diproses", pemanggil (controller) tetap balas 200.
 */
export async function handleNotification(payload: MidtransNotificationPayload): Promise<void> {
  if (!env.MIDTRANS_SERVER_KEY || !verifyNotificationSignature(payload, env.MIDTRANS_SERVER_KEY)) {
    throw new AppError("Invalid Midtrans signature.", 401);
  }

  const [row] = await db
    .select()
    .from(subscriptionTransactions)
    .where(eq(subscriptionTransactions.orderId, payload.order_id));

  if (!row) {
    console.warn("[billing-notification] unknown order_id", payload.order_id);
    return;
  }

  if (TERMINAL_STATUSES.includes(row.status)) return;

  const status = mapMidtransStatus(payload);
  const subscriptionExpiresAt =
    status === SUBSCRIPTION_STATUS.paid
      ? addMonths(new Date(), PERIOD_MONTHS[row.periodId as PeriodId])
      : row.subscriptionExpiresAt;

  await db
    .update(subscriptionTransactions)
    .set({
      status,
      midtransTransactionId: payload.transaction_id,
      paymentType: payload.payment_type,
      subscriptionExpiresAt,
      rawNotification: payload,
      updatedAt: new Date(),
    })
    .where(eq(subscriptionTransactions.orderId, payload.order_id));
}
