import { z } from "zod";

// deploy/fastapi: { "id", "title", "description" }
export const ItemSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
});

export const ItemListResponseSchema = z.object({
  items: z.array(ItemSchema),
  total: z.number().int(),
});

export type Item = z.infer<typeof ItemSchema>;
export type ItemListResponse = z.infer<typeof ItemListResponseSchema>;
