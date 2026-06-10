DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkspaceType') THEN
    CREATE TYPE "WorkspaceType" AS ENUM (
      'HEALTH',
      'DENTAL',
      'PSYCHOLOGY',
      'PHYSIOTHERAPY',
      'NUTRITION',
      'BEAUTY',
      'CONSULTING',
      'LEGAL',
      'OTHER'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "workspaces" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "type" "WorkspaceType" NOT NULL DEFAULT 'HEALTH',
  "logo_url" TEXT,
  "primary_color" TEXT NOT NULL DEFAULT '#116466',
  "accent_color" TEXT NOT NULL DEFAULT '#d9b08c',
  "client_label_singular" TEXT,
  "client_label_plural" TEXT,
  "professional_label" TEXT,
  "appointment_label" TEXT,
  "record_label" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "workspaces_slug_key" ON "workspaces"("slug");

INSERT INTO "workspaces" (
  "id",
  "name",
  "slug",
  "type",
  "primary_color",
  "accent_color",
  "active"
)
VALUES (
  'default_workspace',
  'Consultório Padrão',
  'consultorio-padrao',
  'HEALTH',
  '#116466',
  '#d9b08c',
  true
)
ON CONFLICT ("slug") DO NOTHING;

ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "workspace_id" TEXT;

UPDATE "patients"
SET "workspace_id" = 'default_workspace'
WHERE "workspace_id" IS NULL;

ALTER TABLE "patients" ALTER COLUMN "workspace_id" SET NOT NULL;
