export type Product = {
  id: number;
  title: string;
  price: number;
  badge?: string;
};

/** Mock catalog for labs 06–13 (before FastAPI :8090). */
export const MOCK_PRODUCTS: Product[] = [
  { id: 1, title: "Mechanical Keyboard", price: 79.99, badge: "New" },
  { id: 2, title: "USB-C Hub", price: 49.5 },
  { id: 3, title: "27\" Monitor", price: 299.0, badge: "Sale" },
  { id: 4, title: "Webcam HD", price: 59.99 },
];
