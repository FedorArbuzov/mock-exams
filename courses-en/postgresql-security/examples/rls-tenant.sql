-- Multi-tenant RLS (lesson 11)
CREATE SCHEMA IF NOT EXISTS sec;

CREATE TABLE sec.orders (
  id serial PRIMARY KEY,
  tenant_id int NOT NULL,
  amount numeric NOT NULL
);

ALTER TABLE sec.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_tenant_select ON sec.orders
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id', true)::int);

CREATE POLICY orders_tenant_insert ON sec.orders
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::int);

-- app role
CREATE ROLE app_user LOGIN PASSWORD 'app_pass';
GRANT USAGE ON SCHEMA sec TO app_user;
GRANT SELECT, INSERT ON sec.orders TO app_user;
