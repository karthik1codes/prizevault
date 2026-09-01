"use client"

import dynamic from "next/dynamic"
import type { Hackathon } from "@/client/types/hackathon"

const HackathonGlobe = dynamic(() => import("@/components/ui/usage"), {
  ssr: false,
  loading: () => (
    <div className="pv-globe pv-globe-3d pv-globe-3d--loading" aria-hidden>
      <span className="pv-globe-3d__loader" />
    </div>
  ),
})

type HackathonGlobeLazyProps = {
  hackathons: Hackathon[]
  className?: string
}

export default function HackathonGlobeLazy(props: HackathonGlobeLazyProps) {
  return <HackathonGlobe {...props} />
}
