-- Migration: terrain_correction
-- Adds terrain correction fields to guyed_elements
-- (pipeline: Tab. Alt. Torres → Fundacao SM-VPM → Locação → Conferência)

ALTER TABLE "guyed_elements"
  ADD COLUMN "cotaPF"           DECIMAL(10,4),
  ADD COLUMN "referencePoint5m" DECIMAL(10,4),
  ADD COLUMN "distanceToCC"     DECIMAL(10,4),
  ADD COLUMN "alfa"             DECIMAL(12,8),
  ADD COLUMN "adjustedNCC"      DECIMAL(10,4),
  ADD COLUMN "adjustedHC"       DECIMAL(10,4),
  ADD COLUMN "anchorRealDistance" DECIMAL(10,4),
  ADD COLUMN "cableCutLength"   DECIMAL(10,4),
  ADD COLUMN "terrainAdjusted"  BOOLEAN NOT NULL DEFAULT false;
