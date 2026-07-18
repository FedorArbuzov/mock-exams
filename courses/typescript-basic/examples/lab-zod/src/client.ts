export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(`HTTP ${status}`);
    this.name = "HttpError";
  }
}

const API_BASE = "http://localhost:8090";

async function apiGet(path: string): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Network error: ${message}`);
  }
  const body: unknown = await res.json();
  if (!res.ok) {
    throw new HttpError(res.status, body);
  }
  return body;
}

// TODO (лаба 27): импортируйте схемы и реализуйте parse
export async function listItems() {
  const json = await apiGet("/api/v1/items");
  return json;
}

export async function getHealth() {
  const json = await apiGet("/health");
  return json;
}
