import { z } from "zod";
import { PERIOD_IDS, PLAN_IDS } from "./billing.constants";

export const checkoutSchema = z.object({
  planId: z.enum(PLAN_IDS),
  periodId: z.enum(PERIOD_IDS),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
