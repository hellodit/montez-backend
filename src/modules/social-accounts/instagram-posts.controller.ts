import type { Context } from "hono";
import { currentUserId } from "../../lib/auth";
import { successResponse, validationFailed } from "../../lib/response";
import { parseParam, parseQueryParams } from "../../lib/validation";
import type { AuthVariables } from "../auth/auth.types";
import {
  instagramPostInsightsQuerySchema,
  instagramPostParamSchema,
  listInstagramPostsQuerySchema,
  socialAccountIdParamSchema,
} from "./social-accounts.schema";
import { getPostForAccount, getPostInsightsForAccount, listPostsForAccount } from "./instagram-posts.service";

type Ctx = Context<{ Variables: AuthVariables }>;

export async function index(c: Ctx) {
  const param = parseParam(c, socialAccountIdParamSchema);
  if (!param.ok) return validationFailed(c, param.errors);
  const query = parseQueryParams(c, listInstagramPostsQuerySchema);
  if (!query.ok) return validationFailed(c, query.errors);

  const result = await listPostsForAccount(currentUserId(c), param.data.id, query.data);
  return successResponse(c, result, "Instagram posts.");
}

export async function show(c: Ctx) {
  const param = parseParam(c, instagramPostParamSchema);
  if (!param.ok) return validationFailed(c, param.errors);

  const result = await getPostForAccount(currentUserId(c), param.data.id, param.data.mediaId);
  return successResponse(c, result, "Instagram post detail.");
}

export async function insights(c: Ctx) {
  const param = parseParam(c, instagramPostParamSchema);
  if (!param.ok) return validationFailed(c, param.errors);
  const query = parseQueryParams(c, instagramPostInsightsQuerySchema);
  if (!query.ok) return validationFailed(c, query.errors);

  const result = await getPostInsightsForAccount(currentUserId(c), param.data.id, param.data.mediaId, query.data.metrics);
  return successResponse(c, result, "Instagram post insights.");
}
