-- Security audit (lesson 13)
-- Weak roles
SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin
FROM pg_roles
WHERE rolcanlogin AND (rolsuper OR rolcreaterole OR rolcreatedb);

-- NULL passwords
SELECT rolname FROM pg_authid
WHERE rolcanlogin AND rolpassword IS NULL;

-- PUBLIC privileges on schemas
SELECT nspname FROM pg_namespace n
JOIN pg_roles r ON r.oid = n.nspowner
WHERE has_schema_privilege('PUBLIC', n.oid, 'CREATE');
