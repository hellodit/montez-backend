import type { Context } from "hono";
import { currentUserId } from "../../lib/auth";
import { successResponse, validationFailed } from "../../lib/response";
import { parseParam } from "../../lib/validation";
import type { AuthVariables } from "../auth/auth.types";
import { socialAccountIdParamSchema } from "./social-accounts.schema";
import { disconnectInstagram, getInstagramConnectUrl, listSocialAccounts } from "./social-accounts.service";

type Ctx = Context<{ Variables: AuthVariables }>;

export async function connectInstagram(c: Ctx) {
  const result = await getInstagramConnectUrl(currentUserId(c));
  return successResponse(c, result, "Instagram authorization URL generated.");
}

export async function index(c: Ctx) {
  const accounts = await listSocialAccounts(currentUserId(c));
  return successResponse(c, accounts, "Connected social accounts.");
}

export async function disconnectInstagramAccount(c: Ctx) {
  const param = parseParam(c, socialAccountIdParamSchema);
  if (!param.ok) return validationFailed(c, param.errors);

  await disconnectInstagram(currentUserId(c), param.data.id);
  return successResponse(c, null, "Instagram account disconnected.");
}
