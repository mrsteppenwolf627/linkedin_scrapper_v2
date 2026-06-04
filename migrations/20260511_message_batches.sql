-- ============================================================
-- Migration: message_batches + batch_id on leads + V2 fields
-- Run this in Supabase SQL Editor before deploying v2.2+
--
-- Idempotente: usa IF NOT EXISTS / IF NOT EXISTS en ALTER TABLE.
-- Seguro para re-ejecutar en cualquier entorno.
-- ============================================================

-- ── 1. Tabla message_batches ─────────────────────────────────
--    Cada fila representa una ejecución de "generar mensajes para esta búsqueda".
CREATE TABLE IF NOT EXISTS message_batches (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  search_id     uuid        REFERENCES searches(id) ON DELETE CASCADE,
  label         text,                         -- etiqueta opcional libre
  total_leads   int         NOT NULL DEFAULT 0,
  your_product  text,                         -- propuesta de valor (alias: sales_goal)
  agent_version text        NOT NULL DEFAULT 'v1'
  -- 'v1' = gpt-4o-mini pipeline | 'v2' = claude-sonnet-4-6 + ADRs framework
);

CREATE INDEX IF NOT EXISTS idx_message_batches_search_id   ON message_batches (search_id);
CREATE INDEX IF NOT EXISTS idx_message_batches_created_at  ON message_batches (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_batches_agent       ON message_batches (agent_version);

-- ── 2. Columna batch_id en leads ─────────────────────────────
--    SET NULL al borrar el batch para no perder leads históricos.
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES message_batches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_batch_id ON leads (batch_id);

-- ── 3. Columna agent_version en message_batches (si ya existía sin ella) ──
--    Seguro si la tabla se creó antes de añadir agent_version al CREATE TABLE.
ALTER TABLE message_batches
  ADD COLUMN IF NOT EXISTS agent_version text NOT NULL DEFAULT 'v1';

-- ── 4. Columna tipo en message_drafts (V2) ────────────────────
--    Identifica el tipo de mensaje: observacion | insight | cta_abierto
--    NULL en drafts generados por el pipeline V1 (no tienen tipo).
ALTER TABLE message_drafts
  ADD COLUMN IF NOT EXISTS tipo text
  CHECK (tipo IS NULL OR tipo IN ('observacion', 'insight', 'cta_abierto'));

CREATE INDEX IF NOT EXISTS idx_message_drafts_tipo ON message_drafts (tipo);

-- ── 5. Vista de conveniencia para el módulo de prospección ───
--    Agrega los 3 mensajes V2 de un lead en una sola fila.
CREATE OR REPLACE VIEW leads_v2_messages AS
SELECT
  lb.id               AS batch_id,
  lb.search_id,
  lb.your_product     AS sales_goal,
  lb.agent_version,
  lb.created_at       AS batch_created_at,
  l.id                AS lead_id,
  l.name              AS lead_nombre,
  l.company           AS lead_empresa,
  l.title             AS lead_rol,
  l.linkedin_url,
  MAX(CASE WHEN md.tipo = 'observacion'  THEN md.draft_text END) AS msg_observacion,
  MAX(CASE WHEN md.tipo = 'insight'      THEN md.draft_text END) AS msg_insight,
  MAX(CASE WHEN md.tipo = 'cta_abierto'  THEN md.draft_text END) AS msg_cta_abierto
FROM message_batches lb
JOIN leads          l   ON l.batch_id  = lb.id
JOIN message_drafts md  ON md.lead_id  = l.id
WHERE lb.agent_version = 'v2'
GROUP BY lb.id, lb.search_id, lb.your_product, lb.agent_version, lb.created_at,
         l.id, l.name, l.company, l.title, l.linkedin_url;
