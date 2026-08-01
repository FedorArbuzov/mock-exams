import { fetchJson, HttpError } from "./http.js";
import {
  HealthSchema,
  ItemListResponseSchema,
  ItemSchema,
  type Health,
  type Item,
} from "./schemas/item.js";

const API_BASE = "http://localhost:8090";

// TODO (lab 30): implement health, listItems, getItem
export async function health(): Promise<Health> {
  const json = await fetchJson(`${API_BASE}/health`);
  return HealthSchema.parse(json);
}

export async function listItems(): Promise<Item[]> {
  const json = await fetchJson(`${API_BASE}/api/v1/items`);
  const parsed = ItemListResponseSchema.parse(json);
  return parsed.items;
}

export async function getItem(id: number): Promise<Item> {
  const json = await fetchJson(`${API_BASE}/api/v1/items/${id}`);
  return ItemSchema.parse(json);
}

export { HttpError };
