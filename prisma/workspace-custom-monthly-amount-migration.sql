ALTER TABLE "workspaces"
ADD COLUMN IF NOT EXISTS "custom_monthly_amount" DECIMAL(10, 2);
