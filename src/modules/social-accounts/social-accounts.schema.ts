import { z } from "zod";
import { idParam } from "../../lib/validation";

export const socialAccountIdParamSchema = z.object({
  id: idParam("Social account ID"),
});

export const instagramPostParamSchema = z.object({
  id: idParam("Social account ID"),
  mediaId: z.string().trim().min(1, "Media ID is required."),
});

export const listInstagramPostsQuerySchema = z.object({
  after: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const instagramPostInsightsQuerySchema = z.object({
  // Comma-separated, mis. "reach,saved,likes" — kosong = pakai default di instagram-client.
  metrics: z
    .string()
    .trim()
    .min(1)
    .transform((value) => value.split(",").map((metric) => metric.trim()).filter(Boolean))
    .optional(),
});

export type SocialAccountIdParam = z.infer<typeof socialAccountIdParamSchema>;
export type InstagramPostParam = z.infer<typeof instagramPostParamSchema>;
export type ListInstagramPostsQuery = z.infer<typeof listInstagramPostsQuerySchema>;
export type InstagramPostInsightsQuery = z.infer<typeof instagramPostInsightsQuerySchema>;
