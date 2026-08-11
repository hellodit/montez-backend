import { bigserial, index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { SUBSCRIPTION_STATUS } from "../constants";
import type { SubscriptionStatus } from "../constants";

/**
 * subscription_transactions — satu row per percobaan checkout plan (fake
 * catalog, lihat billing.constants.ts) lewat Midtrans Snap. "Plan aktif user"
 * tidak punya kolom/tabel state sendiri — di-derive dari row `paid` dengan
 * `subscription_expires_at` terjauh yang belum lewat (lihat billing.service.ts).
 */
export const subscriptionTransactions = pgTable(
  "subscription_transactions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Dikirim ke Midtrans sebagai order_id — unik, tidak pernah dipakai ulang.
    orderId: text("order_id").notNull().unique(),

    planId: text("plan_id").notNull(),
    periodId: text("period_id").notNull(),

    // Snapshot harga saat checkout dibuat — katalog constant bisa berubah
    // belakangan tanpa menulis ulang histori.
    amount: integer("amount").notNull(),

    status: text("status").$type<SubscriptionStatus>().notNull().default(SUBSCRIPTION_STATUS.pending),

    snapToken: text("snap_token"),
    midtransTransactionId: text("midtrans_transaction_id"),
    paymentType: text("payment_type"),
    subscriptionExpiresAt: timestamp("subscription_expires_at"),

    // Payload notification terakhir dari Midtrans, verbatim — jejak audit/debug.
    rawNotification: jsonb("raw_notification"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("subscription_transactions_user_id_idx").on(table.userId)],
);
