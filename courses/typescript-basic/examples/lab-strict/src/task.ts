import { ValidationError } from "./errors.js";

export type TaskStatus = "todo" | "done";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
  tags: string[];
  dueDate: string | null;
}

// TODO (лаба 24): типизируйте options и возвращаемое значение
export function createTask(title, options) {
  if (!title || !title.trim()) {
    throw new ValidationError("Title is required");
  }
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    status: "todo",
    createdAt: now,
    tags: options?.tags ?? [],
    dueDate: options?.dueDate ?? null,
  };
}
