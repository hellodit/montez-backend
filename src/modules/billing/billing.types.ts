import type { SubscriptionStatus } from "../../db/constants";
import type { PeriodId, PlanId } from "./billing.constants";

export interface CurrentSubscription {
  planId: PlanId;
  periodId: PeriodId;
  status: SubscriptionStatus;
  subscriptionExpiresAt: string;
}

export interface CheckoutResult {
  orderId: string;
  snapToken: string;
}
