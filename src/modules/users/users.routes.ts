import { Hono } from "hono";
import { requireAdmin } from "../../middlewares/admin.middleware";
import { requireAuth } from "../../middlewares/auth.middleware";
import type { AuthVariables } from "../auth/auth.types";
import * as usersController from "./users.controller";

/**
 * Manajemen user (admin). Semua endpoint: requireAuth → requireAdmin.
 * Create mendelegasikan pembuatan kredensial ke Better Auth `signUpEmail`
 * (hash password + record account yang benar) — bukan insert mentah.
 */
export function registerUserRoutes(app: Hono) {
  const router = new Hono<{ Variables: AuthVariables }>();
  router.use("*", requireAuth);
  router.use("*", requireAdmin);

  router.post("/", usersController.create); // create (delegasi Better Auth signup)
  router.get("/", usersController.index); // list + pagination + search
  router.get("/:id", usersController.show); // detail
  router.put("/:id", usersController.update); // update profile/flags
  router.delete("/:id", usersController.destroy); // delete

  // Path bare: prefix `/api` dipasang sekali di src/routes.ts.
  app.route("/users", router);
}
