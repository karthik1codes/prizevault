"use client";

import dynamic from "next/dynamic";

const HolderWalletApp = dynamic(() => import("@frontend/HolderWalletApp"), {
  ssr: false,
  loading: () => <p style={{ padding: 24 }}>Loading escrow wallet…</p>,
});

export default function HolderPage() {
  return <HolderWalletApp />;
}
