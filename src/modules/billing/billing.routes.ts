import { Hono } from "hono";
import { requireAuth } from "../../middlewares/auth.middleware";
import type { AuthVariables } from "../auth/auth.types";
import * as billingController from "./billing.controller";

/**
 * Top-up/upgrade plan via Midtrans, di `/api/billing`. Semua endpoint
 * `requireAuth` KECUALI `/midtrans/notification` — itu dipanggil Midtrans
 * sendiri (tak punya JWT kita), diamankan lewat verifikasi signature di
 * billing.service.ts, bukan lewat middleware auth.
 */
export function registerBillingRoutes(app: Hono) {
  // Router terpisah, TANPA requireAuth — Hono composes `.use("*", ...)` in
  // registration order, so a single shared router can't have one route skip
  // middleware registered for the rest. Two routers mounted at the same
  // prefix keeps that unambiguous.
  const publicRouter = new Hono();
  publicRouter.post("/midtrans/notification", billingController.notification);

  const authedRouter = new Hono<{ Variables: AuthVariables }>();
  authedRouter.use("*", requireAuth);
  authedRouter.get("/plans", billingController.plans);
  authedRouter.get("/current", billingController.current);
  authedRouter.post("/checkout", billingController.checkoutHandler);

  app.route("/billing", publicRouter);
  app.route("/billing", authedRouter);
}
