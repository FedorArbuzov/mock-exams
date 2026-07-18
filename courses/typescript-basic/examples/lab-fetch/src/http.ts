export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(`HTTP ${status}`);
    this.name = "HttpError";
  }
}

export async function fetchJson(
  url: string,
  init?: RequestInit
): Promise<unknown> {
  // TODO (лаба 30): network try/catch, res.ok, return unknown from res.json()
  const res = await fetch(url, init);
  return res.json();
}
