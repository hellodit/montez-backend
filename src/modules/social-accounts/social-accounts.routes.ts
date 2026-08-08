import { Hono } from "hono";
import { requireAuth } from "../../middlewares/auth.middleware";
import type { AuthVariables } from "../auth/auth.types";
import * as socialAccountsController from "./social-accounts.controller";
import * as instagramPostsController from "./instagram-posts.controller";

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

  router.get("/:id/instagram/posts", instagramPostsController.index);
  router.get("/:id/instagram/posts/:mediaId", instagramPostsController.show);
  router.get("/:id/instagram/posts/:mediaId/insights", instagramPostsController.insights);

  app.route("/social-accounts", router);
}
