-- ============================================================
-- Migration: Stored procedures for atomic approval/rejection
-- + Admin seed instructions
-- Run AFTER 20260512_users_auth.sql
-- ============================================================

-- ── approve_user() ─────────────────────────────────────────────────────────
-- Atomically updates users.status AND inserts the audit log row.
-- Raises an exception (rolls back both) if the user is not found or not pending.

CREATE OR REPLACE FUNCTION approve_user(p_user_id uuid, p_admin_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email
  FROM   users
  WHERE  id = p_user_id AND status = 'pending_approval'
  FOR UPDATE;                        -- lock the row for the duration of the txn

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found or not in pending_approval status';
  END IF;

  UPDATE users
  SET    status      = 'approved',
         approved_at = now(),
         approved_by = p_admin_id
  WHERE  id = p_user_id;

  INSERT INTO user_approvals (user_id, approved_by, status)
  VALUES (p_user_id, p_admin_id, 'approved');

  RETURN json_build_object('email', v_email, 'status', 'approved');
END;
$$;

-- ── reject_user() ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION reject_user(
  p_user_id  uuid,
  p_admin_id uuid,
  p_reason   text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email
  FROM   users
  WHERE  id = p_user_id AND status = 'pending_approval'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found or not in pending_approval status';
  END IF;

  UPDATE users
  SET    status = 'rejected'
  WHERE  id     = p_user_id;

  INSERT INTO user_approvals (user_id, approved_by, status, reason)
  VALUES (p_user_id, p_admin_id, 'rejected', p_reason);

  RETURN json_build_object('email', v_email, 'status', 'rejected');
END;
$$;

-- ── Admin seed ─────────────────────────────────────────────────────────────
-- Run this AFTER the admin signs up via /api/auth/signup.
-- Replace 'your_email@domain.com' with your actual email.
--
-- UPDATE users
-- SET    role        = 'admin',
--        status      = 'approved',
--        approved_at = now()
-- WHERE  email = 'your_email@domain.com';
