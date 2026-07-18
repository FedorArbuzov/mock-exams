// TODO (лаба 24): типизируйте Command union и parseArgv
export function parseArgv(argv) {
  if (argv.length === 0) {
    throw new Error("Usage: add|list|done|remove ...");
  }
  const [cmd, ...rest] = argv;
  if (cmd === "add") {
    const title = rest[0];
    const tagsFlag = rest.indexOf("--tags");
    const tags =
      tagsFlag !== -1 && rest[tagsFlag + 1]
        ? rest[tagsFlag + 1].split(",")
        : [];
    return { kind: "add", title, tags };
  }
  if (cmd === "list") {
    const statusIdx = rest.indexOf("--status");
    const status = statusIdx !== -1 ? rest[statusIdx + 1] : undefined;
    const searchIdx = rest.indexOf("--search");
    const search = searchIdx !== -1 ? rest[searchIdx + 1] : undefined;
    return { kind: "list", status, search };
  }
  if (cmd === "done") {
    return { kind: "done", id: rest[0] };
  }
  if (cmd === "remove") {
    return { kind: "remove", id: rest[0] };
  }
  throw new Error(`Unknown command: ${cmd}`);
}
