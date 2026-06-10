DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PLATFORM_ADMIN' AND enumtypid = '"UserRole"'::regtype) THEN
    ALTER TYPE "UserRole" ADD VALUE 'PLATFORM_ADMIN';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkspaceStatus') THEN
    CREATE TYPE "WorkspaceStatus" AS ENUM (
      'PENDING_APPROVAL',
      'ACTIVE',
      'SUSPENDED',
      'REJECTED'
    );
  END IF;
END $$;

ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "status" "WorkspaceStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "owner_name" TEXT;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "owner_email" TEXT;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "owner_phone" TEXT;
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMP(3);
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "rejected_at" TIMESTAMP(3);
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "suspended_at" TIMESTAMP(3);

UPDATE "workspaces"
SET "status" = 'ACTIVE'
WHERE "status" IS NULL;
