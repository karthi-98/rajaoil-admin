"use client"

import { useNavigation } from "@/contexts/NavigationContext"
import { Loader2 } from "lucide-react"

export function NavigationLoader() {
  const { isNavigating } = useNavigation()

  if (!isNavigating) return null

  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-gray-900" />
        <p className="text-sm text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  )
}
