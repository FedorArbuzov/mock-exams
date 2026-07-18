ALTER TABLE devapp.products ADD COLUMN search tsvector;

UPDATE devapp.products SET search = to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(sku, ''));

CREATE INDEX products_search_idx ON devapp.products USING gin (search);

CREATE OR REPLACE FUNCTION devapp.products_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search := to_tsvector('simple', coalesce(NEW.name, '') || ' ' || coalesce(NEW.sku, ''));
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_search_update
  BEFORE INSERT OR UPDATE ON devapp.products
  FOR EACH ROW EXECUTE FUNCTION devapp.products_search_trigger();
