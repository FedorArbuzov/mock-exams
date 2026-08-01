CREATE SCHEMA IF NOT EXISTS devapp;

CREATE TABLE devapp.products (
  id    serial PRIMARY KEY,
  sku   text UNIQUE NOT NULL,
  name  text NOT NULL,
  price numeric(10,2) NOT NULL
);

CREATE TABLE devapp.orders (
  id         serial PRIMARY KEY,
  product_id int REFERENCES devapp.products(id),
  qty        int NOT NULL DEFAULT 1,
  meta       jsonb,
  created_at timestamptz DEFAULT now()
);
