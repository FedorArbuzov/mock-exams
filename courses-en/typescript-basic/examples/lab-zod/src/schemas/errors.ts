import { z } from "zod";

export const NotFoundSchema = z.object({
  detail: z.string(),
});

export const ValidationErrorSchema = z.object({
  detail: z.array(
    z.object({
      loc: z.array(z.union([z.string(), z.number()])),
      msg: z.string(),
      type: z.string(),
    })
  ),
});

export type NotFoundBody = z.infer<typeof NotFoundSchema>;
