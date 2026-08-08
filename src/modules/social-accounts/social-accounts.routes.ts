import { Hono } from "hono";
import { requireAuth } from "../../middlewares/auth.middleware";
import type { AuthVariables } from "../auth/auth.types";
import * as socialAccountsController from "./social-accounts.controller";

/**
 * Akun sosial milik user (koneksi Instagram, dst.) di `/api/social-accounts`.
 * Semua endpoint: requireAuth.
 */
export function registerSocialAccountRoutes(app: Hono) {
  const router = new Hono<{ Variables: AuthVariables }>();
  router.use("*", requireAuth);

  router.get("/", socialAccountsController.index);
  router.post("/instagram/connect", socialAccountsController.connectInstagram);
  router.delete("/:id/instagram", socialAccountsController.disconnectInstagramAccount);

  app.route("/social-accounts", router);
}
