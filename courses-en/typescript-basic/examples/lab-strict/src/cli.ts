import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { TaskStore } from "./store.js";
import { parseArgv } from "./parse-args.js";
import { formatTask } from "./format.js";
import { NotFoundError, ValidationError } from "./errors.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, "..", "data", "tasks.json");

const store = new TaskStore();

async function main() {
  await store.load(dataPath);
  const cmd = parseArgv(process.argv.slice(2));

  switch (cmd.kind) {
    case "add": {
      const task = store.add(cmd.title, { tags: cmd.tags });
      await store.save(dataPath);
      console.log("Created:", formatTask(task));
      break;
    }
    case "list": {
      const tasks = store.list({ status: cmd.status, search: cmd.search });
      for (const t of tasks) {
        console.log(formatTask(t));
      }
      break;
    }
    case "done": {
      const task = store.markDone(cmd.id);
      await store.save(dataPath);
      console.log("Done:", formatTask(task));
      break;
    }
    case "remove": {
      store.remove(cmd.id);
      await store.save(dataPath);
      console.log("Removed:", cmd.id);
      break;
    }
    default:
      throw new Error("Unhandled command");
  }
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
  const code =
    err instanceof ValidationError || err instanceof NotFoundError ? 1 : 1;
  process.exit(code);
});
