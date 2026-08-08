import { z } from "zod";
import { idParam } from "../../lib/validation";

export const socialAccountIdParamSchema = z.object({
  id: idParam("Social account ID"),
});

export type SocialAccountIdParam = z.infer<typeof socialAccountIdParamSchema>;
