"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { usePathname } from "next/navigation"

interface NavigationContextType {
  isNavigating: boolean
}

const NavigationContext = createContext<NavigationContextType>({
  isNavigating: false,
})

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Show loading when path changes
    setIsNavigating(true)

    // Hide loading after a brief delay to allow page to render
    const timer = setTimeout(() => {
      setIsNavigating(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <NavigationContext.Provider value={{ isNavigating }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  return useContext(NavigationContext)
}
