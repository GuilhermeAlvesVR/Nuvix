import { NextRequest, NextResponse } from "next/server";
import { isSecretAuthorized } from "@/lib/cron-auth";
import { generateMonthlyPlatformInvoices } from "@/lib/platform-billing";

export const dynamic = "force-dynamic";

async function run(request: NextRequest) {
  if (!isSecretAuthorized(request.headers, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await generateMonthlyPlatformInvoices();
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}
