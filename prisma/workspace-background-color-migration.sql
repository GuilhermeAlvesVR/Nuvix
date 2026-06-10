ALTER TABLE "workspaces"
ADD COLUMN IF NOT EXISTS "background_color" TEXT NOT NULL DEFAULT '#f6f3ee';
