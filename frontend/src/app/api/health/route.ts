import { NextResponse } from "next/server";
import {
  getContractId,
  getNetworkPassphrase,
  getSorobanRpcUrl,
} from "@/lib/backend/config";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    networkPassphrase: getNetworkPassphrase(),
    rpcUrl: getSorobanRpcUrl(),
    contractId: getContractId(),
    hasSponsorKey: Boolean(process.env.SPONSOR_SECRET_KEY),
    hasOrganizerKey: Boolean(process.env.ORGANIZER_SECRET_KEY),
    supabaseConfigured: isSupabaseConfigured(),
  });
}
