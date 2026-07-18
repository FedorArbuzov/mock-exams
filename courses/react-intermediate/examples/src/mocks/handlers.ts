import { http, HttpResponse, delay } from "msw";

const mockProducts = [
  {
    id: 1,
    sku: "KB-001",
    title: "Mechanical Keyboard",
    price: "129.99",
    is_active: true,
    category: { slug: "peripherals", name: "Peripherals" },
  },
  {
    id: 2,
    sku: "MS-002",
    title: "Wireless Mouse",
    price: "49.99",
    is_active: true,
    category: { slug: "peripherals", name: "Peripherals" },
  },
];

export const handlers = [
  http.get("/api/v1/products/", async () => {
    await delay(300);
    return HttpResponse.json({
      count: mockProducts.length,
      next: null,
      previous: null,
      results: mockProducts,
    });
  }),

  http.post("/api/v1/auth/login/", async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.email === "admin@shop.local" && body.password === "admin") {
      return HttpResponse.json({
        access: "mock-access-token",
        refresh: "mock-refresh-token",
        user: { id: 1, email: body.email, role: "admin" },
      });
    }
    return HttpResponse.json({ detail: "Invalid credentials" }, { status: 401 });
  }),
];
