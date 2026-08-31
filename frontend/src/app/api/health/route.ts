import { NextResponse } from "next/server";
import {
  getContractId,
  getNetworkPassphrase,
  getSorobanRpcUrl,
} from "@/lib/backend/config";
import {
  getSupabaseConfigSource,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const configured = isSupabaseConfigured();
  return NextResponse.json({
    ok: true,
    networkPassphrase: getNetworkPassphrase(),
    rpcUrl: getSorobanRpcUrl(),
    contractId: getContractId(),
    hasSponsorKey: Boolean(process.env.SPONSOR_SECRET_KEY),
    hasOrganizerKey: Boolean(process.env.ORGANIZER_SECRET_KEY),
    supabaseConfigured: configured,
    supabaseUrl: configured ? getSupabaseUrl() : null,
    supabaseConfigSource: getSupabaseConfigSource(),
    hasSupabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
  });
}
