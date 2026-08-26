import { NextResponse } from "next/server";
import { getContractId, getNetworkPassphrase, getSorobanRpcUrl } from "@backend/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const contractId = getContractId();
  return NextResponse.json({
    ok: true,
    networkPassphrase: getNetworkPassphrase(),
    rpcUrl: getSorobanRpcUrl(),
    contractId,
    hasSponsorKey: Boolean(process.env.SPONSOR_SECRET_KEY),
    hasOrganizerKey: Boolean(process.env.ORGANIZER_SECRET_KEY),
  });
}
