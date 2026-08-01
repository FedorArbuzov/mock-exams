import { z } from "zod";

export const ItemSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
});

export const ItemListResponseSchema = z.object({
  items: z.array(ItemSchema),
  total: z.number().int(),
});

export const HealthSchema = z.object({
  status: z.string(),
});

export type Item = z.infer<typeof ItemSchema>;
export type Health = z.infer<typeof HealthSchema>;
