import { readFile, writeFile } from "node:fs/promises";
import { createTask } from "./task.js";
import { NotFoundError } from "./errors.js";

export class TaskStore {
  tasks = [];

  findById(id) {
    return this.tasks.find((t) => t.id === id);
  }

  add(title, options) {
    const task = createTask(title, options);
    this.tasks.push(task);
    return task;
  }

  list(filter) {
    let result = this.tasks;
    if (filter?.status) {
      result = result.filter((t) => t.status === filter.status);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }
    return result;
  }

  markDone(id) {
    const task = this.findById(id);
    task.status = "done";
    return task;
  }

  remove(id) {
    const idx = this.tasks.findIndex((t) => t.id === id);
    if (idx === -1) {
      throw new NotFoundError(id);
    }
    this.tasks.splice(idx, 1);
  }

  getByIndex(index) {
    return this.tasks[index];
  }

  async load(path) {
    try {
      const raw = await readFile(path, "utf-8");
      const parsed = JSON.parse(raw);
      this.tasks = parsed;
    } catch (err) {
      if (err.code === "ENOENT") {
        this.tasks = [];
        return;
      }
      throw err;
    }
  }

  async save(path) {
    await writeFile(path, JSON.stringify(this.tasks, null, 2), "utf-8");
  }
}
