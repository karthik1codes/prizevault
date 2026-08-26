import { getOrganizerKeypair, getSponsorKeypair } from "./config";
import {
  approveRelease,
  executeRelease,
  proposeRelease,
  type WinnerPayoutInput,
} from "./escrowClient";

export interface ApiSuccess {
  success: true;
  txHash: string;
  error: "";
}

export interface ApiFailure {
  success: false;
  txHash: "";
  error: string;
}

export type ApiResponse = ApiSuccess | ApiFailure;

export function ok(txHash: string): ApiSuccess {
  return { success: true, txHash, error: "" };
}

export function fail(error: unknown): ApiFailure {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown error invoking Soroban contract";
  return { success: false, txHash: "", error: message };
}

export function parseProposalId(body: Record<string, unknown>): number | string {
  const raw = body.proposal_id ?? body.proposalId;
  if (raw === undefined || raw === null || raw === "") {
    throw new Error("proposal_id is required");
  }
  if (typeof raw === "number" || typeof raw === "string") return raw;
  throw new Error("proposal_id must be a number or numeric string");
}

export function parsePayouts(body: Record<string, unknown>): WinnerPayoutInput[] {
  const raw = body.payouts;
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("payouts must be a non-empty array of { winner_address, amount }");
  }
  return raw.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`payouts[${index}] must be an object`);
    }
    const row = item as Record<string, unknown>;
    const winner_address = String(
      row.winner_address ?? row.winnerAddress ?? row.winner ?? "",
    ).trim();
    const amount = row.amount ?? row.amount_stroops ?? row.amountStroops;
    if (!winner_address) {
      throw new Error(`payouts[${index}].winner_address is required`);
    }
    if (amount === undefined || amount === null || amount === "") {
      throw new Error(`payouts[${index}].amount (stroops) is required`);
    }
    return {
      winner_address,
      amount: typeof amount === "bigint" ? amount : (amount as string | number),
    };
  });
}

export async function handlePropose(body: Record<string, unknown>): Promise<ApiResponse> {
  try {
    const proposalId = parseProposalId(body);
    const payouts = parsePayouts(body);
    const organizer = getOrganizerKeypair();
    const { txHash } = await proposeRelease(organizer, proposalId, payouts);
    return ok(txHash);
  } catch (error) {
    return fail(error);
  }
}

export async function handleApprove(body: Record<string, unknown>): Promise<ApiResponse> {
  try {
    const proposalId = parseProposalId(body);
    const sponsor = getSponsorKeypair();
    const { txHash } = await approveRelease(sponsor, proposalId);
    return ok(txHash);
  } catch (error) {
    return fail(error);
  }
}

export async function handleExecute(body: Record<string, unknown>): Promise<ApiResponse> {
  try {
    const proposalId = parseProposalId(body);
    const organizer = getOrganizerKeypair();
    const { txHash } = await executeRelease(organizer, proposalId);
    return ok(txHash);
  } catch (error) {
    return fail(error);
  }
}
