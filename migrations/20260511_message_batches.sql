-- ============================================================
-- Migration: message_batches + batch_id on leads
-- Run this in Supabase SQL Editor before deploying v2.2
-- ============================================================

-- 1. Tabla message_batches
--    Cada fila representa una ejecución de "generar mensajes para esta búsqueda".
CREATE TABLE IF NOT EXISTS message_batches (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  search_id    uuid        REFERENCES searches(id) ON DELETE CASCADE,
  label        text,                        -- etiqueta opcional libre
  total_leads  int         NOT NULL DEFAULT 0,
  your_product text
);

CREATE INDEX IF NOT EXISTS idx_message_batches_search_id   ON message_batches (search_id);
CREATE INDEX IF NOT EXISTS idx_message_batches_created_at  ON message_batches (created_at DESC);

-- 2. Columna batch_id en leads
--    SET NULL al borrar el batch para no perder leads históricos;
--    la ruta DELETE /api/batches borra los leads explícitamente antes de borrar el batch.
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES message_batches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_batch_id ON leads (batch_id);
