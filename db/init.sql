

-- Insert sample users for PermissionsView.vue dropdown


-- 1. Users
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL
);

-- 4. Files
CREATE TABLE files (
    id UUID PRIMARY KEY,
    filename TEXT NOT NULL,
    owner_id UUID NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. User-level file permissions
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    file_id UUID NOT NULL,
    can_read BOOLEAN DEFAULT FALSE,
    can_write BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    UNIQUE (user_id, file_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
);


INSERT INTO users (id, name) VALUES
  ('11111111-1111-1111-1111-111111111111', '使用者 1'),
  ('22222222-2222-2222-2222-222222222222', '使用者 2'),
  ('33333333-3333-3333-3333-333333333333', '使用者 3'),
  ('44444444-4444-4444-4444-444444444444', '使用者 4')
ON CONFLICT (id) DO NOTHING;
