/**
 * Optional chain-sync reconciliation webhook
 * POST /api/webhooks/chain-sync
 */

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    data: { message: "Reconciliation sweep idle", timestamp: new Date().toISOString() },
  });
}
