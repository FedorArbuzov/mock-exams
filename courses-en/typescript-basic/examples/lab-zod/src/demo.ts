import { getHealth, listItems } from "./client.js";
import { ItemListResponseSchema } from "./schemas/item.js";
import { HealthSchema } from "./schemas/health.js";

async function main() {
  const healthJson = await getHealth();
  const health = HealthSchema.parse(healthJson);
  console.log("Health:", health);

  const itemsJson = await listItems();
  const parsed = ItemListResponseSchema.parse(itemsJson);
  console.table(
    parsed.items.map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description.slice(0, 40),
    }))
  );
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
