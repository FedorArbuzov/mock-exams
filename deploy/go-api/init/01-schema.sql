-- Minimal schema for go-intermediate labs
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_owner ON items(owner_id);

-- password for labs: "password" (bcrypt). Replace hash in auth labs if you change it.
INSERT INTO users (email, password_hash)
VALUES (
    'demo@course.local',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO items (title, description, owner_id)
SELECT 'Demo Keyboard', 'Starter item for smoke tests', id
FROM users WHERE email = 'demo@course.local'
AND NOT EXISTS (SELECT 1 FROM items WHERE title = 'Demo Keyboard');
