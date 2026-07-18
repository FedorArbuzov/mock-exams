import { health, listItems } from "./shop-client.js";

async function main() {
  const h = await health();
  console.log("Health:", h);

  const items = await listItems();
  console.table(items);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
