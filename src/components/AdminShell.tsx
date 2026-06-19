"use client"

import { usePathname } from "next/navigation"

import { CustomSidebar } from "@/components/CustomSidebar"
import { NavigationLoader } from "@/components/NavigationLoader"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { NavigationProvider } from "@/contexts/NavigationContext"

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/login"

  return (
    <NavigationProvider>
      {isLoginPage ? (
        children
      ) : (
        <ProtectedRoute>
          <SidebarProvider>
            <CustomSidebar />
            <SidebarInset className="relative p-8">
              {children}
              <NavigationLoader />
            </SidebarInset>
          </SidebarProvider>
        </ProtectedRoute>
      )}
    </NavigationProvider>
  )
}
