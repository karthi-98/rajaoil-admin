"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { ensureFirebaseStructure } from "@/lib/firebaseStructure"
import { Button } from "@/components/ui/button"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const [structureReady, setStructureReady] = useState(false)
  const [structureLoading, setStructureLoading] = useState(false)
  const [structureError, setStructureError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user) {
      setStructureReady(false)
      return
    }

    let active = true

    async function bootstrapFirebaseStructure() {
      try {
        setStructureLoading(true)
        setStructureError(null)
        await ensureFirebaseStructure()

        if (active) {
          setStructureReady(true)
        }
      } catch (error) {
        console.error("Error setting up Firebase structure:", error)

        if (active) {
          setStructureError("Failed to set up Firebase data. Please check your Firestore rules and refresh.")
        }
      } finally {
        if (active) {
          setStructureLoading(false)
        }
      }
    }

    if (!structureReady) {
      bootstrapFirebaseStructure()
    }

    return () => {
      active = false
    }
  }, [user, structureReady])

  if (loading || structureLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    )
  }

  if (structureError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md rounded-lg border bg-background p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold">Firebase setup failed</h1>
          <p className="mt-2 text-sm text-muted-foreground">{structureError}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
