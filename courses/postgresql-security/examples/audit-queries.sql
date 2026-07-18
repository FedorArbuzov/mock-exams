-- Security audit (урок 13)
-- Слабые роли
SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin
FROM pg_roles
WHERE rolcanlogin AND (rolsuper OR rolcreaterole OR rolcreatedb);

-- Пароли NULL
SELECT rolname FROM pg_authid
WHERE rolcanlogin AND rolpassword IS NULL;

-- Права PUBLIC на схемы
SELECT nspname FROM pg_namespace n
JOIN pg_roles r ON r.oid = n.nspowner
WHERE has_schema_privilege('PUBLIC', n.oid, 'CREATE');
