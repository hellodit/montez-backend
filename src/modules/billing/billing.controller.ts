import type { Context } from "hono";
import { currentUser } from "../../lib/auth";
import { successResponse, validationFailed } from "../../lib/response";
import { parseBody } from "../../lib/validation";
import type { AuthVariables } from "../auth/auth.types";
import { PLAN_NAMES, PLAN_PRICING } from "./billing.constants";
import { checkout, getCurrentSubscription, handleNotification } from "./billing.service";
import { checkoutSchema } from "./billing.schema";
import type { MidtransNotificationPayload } from "./midtrans-status";

type Ctx = Context<{ Variables: AuthVariables }>;

export function plans(c: Ctx) {
  return successResponse(c, { pricing: PLAN_PRICING, names: PLAN_NAMES }, "Plan catalog.");
}

export async function current(c: Ctx) {
  const result = await getCurrentSubscription(currentUser(c).id);
  return successResponse(c, result, "Current subscription.");
}

export async function checkoutHandler(c: Ctx) {
  const body = await parseBody(c, checkoutSchema);
  if (!body.ok) return validationFailed(c, body.errors);

  const user = currentUser(c);
  const result = await checkout(user.id, body.data, { email: user.email, name: user.name });
  return successResponse(c, result, "Checkout created.");
}

export async function notification(c: Context) {
  const payload = await c.req.json<MidtransNotificationPayload>();
  await handleNotification(payload);
  return successResponse(c, null, "Notification processed.");
}
