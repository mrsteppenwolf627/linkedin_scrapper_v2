-- ============================================================
-- Migration: users + user_approvals (V3 Auth)
-- Run in Supabase SQL Editor before deploying auth endpoints
-- ============================================================

-- 1. Custom users table (mirrors auth.users + adds role/status)
CREATE TABLE IF NOT EXISTS users (
  id            uuid        PRIMARY KEY,              -- matches auth.users.id
  email         text        NOT NULL UNIQUE,
  password_hash text,                                 -- nullable: Supabase Auth manages the hash
  role          text        NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status        text        NOT NULL DEFAULT 'pending_approval'
                            CHECK (status IN ('pending_approval', 'approved', 'rejected')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  approved_at   timestamptz,
  approved_by   uuid        REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email    ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_status   ON users (status);

-- 2. Audit log for approvals/rejections
CREATE TABLE IF NOT EXISTS user_approvals (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  approved_by uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status      text        NOT NULL CHECK (status IN ('approved', 'rejected')),
  reason      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_approvals_user_id ON user_approvals (user_id);
