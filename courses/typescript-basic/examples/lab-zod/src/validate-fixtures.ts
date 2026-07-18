import { ItemListResponseSchema } from "./schemas/item.js";

const broken = [
  { id: 1, title: "Keyboard", description: "From course stack", extra: true },
];

const result = ItemListResponseSchema.safeParse({
  items: broken,
  total: "1",
});

if (!result.success) {
  console.log("Expected failure:");
  for (const issue of result.error.issues) {
    console.log(`  ${issue.path.join(".")}: ${issue.message}`);
  }
} else {
  console.error("Fixture should have failed validation");
  process.exit(1);
}
