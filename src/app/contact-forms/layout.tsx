"use client"

import { CustomSidebar } from "@/components/CustomSidebar"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { NavigationProvider } from "@/contexts/NavigationContext"
import { NavigationLoader } from "@/components/NavigationLoader"

export default function ContactFormsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <NavigationProvider>
        <div className="flex min-h-screen w-full">
          <CustomSidebar />
          <main className="flex-1 p-8 relative">
            {children}
            <NavigationLoader />
          </main>
        </div>
      </NavigationProvider>
    </ProtectedRoute>
  )
}
