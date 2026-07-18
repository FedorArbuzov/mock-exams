export function formatTask(task) {
  const tags = task.tags?.length ? `[${task.tags.join(", ")}]` : "";
  return `${task.id.slice(0, 8)}  ${task.status.padEnd(4)}  ${task.title}  ${tags}`;
}
