"use client"

import * as React from "react"
import { Package, ChevronRight, Droplet, LogOut, Settings, ShoppingBag } from "lucide-react"
import gsap from "gsap"
import { useAuth } from "@/contexts/AuthContext"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"

const menuItems = [
  {
    title: "Products",
    icon: Package,
    href: "/products",
  },
  {
    title: "Orders",
    icon: ShoppingBag,
    href: "/orders",
  },
  {
    title: "Others",
    icon: Settings,
    href: "/others",
  },
]

export function CustomSidebar() {
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const titleRef = React.useRef<HTMLHeadingElement>(null)
  const textRefs = React.useRef<(HTMLSpanElement | null)[]>([])
  const arrowRef = React.useRef<SVGSVGElement>(null)
  const sidebarRef = React.useRef<HTMLDivElement>(null)
  const logoutTextRef = React.useRef<HTMLSpanElement>(null)
  const { logout } = useAuth()
  const pathname = usePathname()

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const handleLogout = async () => {
    if (confirm("Are you sure you want to logout?")) {
      await logout()
    }
  }

  React.useEffect(() => {
    // Kill any ongoing animations to prevent conflicts
    gsap.killTweensOf([
      titleRef.current,
      arrowRef.current,
      sidebarRef.current,
      logoutTextRef.current,
      ...textRefs.current,
    ])

    if (isCollapsed) {
      // Animate to collapsed state
      const timeline = gsap.timeline()

      // Fade out text first
      timeline.to([titleRef.current, logoutTextRef.current, ...textRefs.current], {
        opacity: 0,
        duration: 0.15,
        ease: "power2.in",
        onComplete: () => {
          if (titleRef.current) titleRef.current.style.visibility = "hidden"
          if (logoutTextRef.current) logoutTextRef.current.style.visibility = "hidden"
          textRefs.current.forEach((ref) => {
            if (ref) ref.style.visibility = "hidden"
          })
        },
      }, 0)

      // Shrink sidebar
      timeline.to(
        sidebarRef.current,
        {
          width: "4.5rem",
          duration: 0.3,
          ease: "power2.inOut",
        },
        0
      )
    } else {
      // Animate to expanded state
      const timeline = gsap.timeline()

      // Show elements first
      if (titleRef.current) titleRef.current.style.visibility = "visible"
      if (logoutTextRef.current) logoutTextRef.current.style.visibility = "visible"
      textRefs.current.forEach((ref) => {
        if (ref) ref.style.visibility = "visible"
      })

      // Expand sidebar
      timeline.to(
        sidebarRef.current,
        {
          width: "13rem",
          duration: 0.3,
          ease: "power2.inOut",
        },
        0
      )

      // Fade in title
      timeline.to(
        titleRef.current,
        {
          opacity: 1,
          duration: 0.25,
          ease: "power2.out",
        },
        0.15
      )

      // Fade in text with stagger
      timeline.to(
        [...textRefs.current, logoutTextRef.current],
        {
          opacity: 1,
          duration: 0.3,
          stagger: 0.03,
          ease: "power2.out",
        },
        0.2
      )
    }
  }, [isCollapsed])

  return (
    <div className="relative flex-shrink-0" style={{ width: isCollapsed ? "4.5rem" : "13rem" }}>
      <div
        ref={sidebarRef}
        className="fixed left-0 top-0 h-screen border-r border-gray-100 bg-white overflow-hidden z-40"
        style={{ width: "13rem" }}
      >
        {/* Header */}
        <div className="relative px-3 py-8">
          <div className="flex items-center gap-3 px-3">
            <Droplet className="h-6 w-6 flex-shrink-0 text-gray-900" strokeWidth={2} />
            <h1
              ref={titleRef}
              className="text-xl font-semibold tracking-tight overflow-hidden whitespace-nowrap"
              style={{ opacity: 1 }}
            >
              Raja Oil
            </h1>
          </div>
        </div>

        {/* Menu */}
        <div className="px-3">
          <ul className="flex flex-col gap-1">
            {menuItems.map((item, index) => {
              const isActive = pathname?.startsWith(item.href)
              return (
                <li key={item.title}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 h-11 px-3 rounded-lg transition-colors ${
                      isActive
                        ? "text-gray-900 bg-gray-100"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
                    <span
                      ref={(el) => {
                        textRefs.current[index] = el
                      }}
                      className="text-[15px] whitespace-nowrap overflow-hidden"
                      style={{ opacity: 1 }}
                    >
                      {item.title}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className=" hover:cursor-pointer flex items-center gap-3 w-full h-11 px-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5 flex-shrink-0 text-red-600" strokeWidth={1.5} />
            <span
              ref={logoutTextRef}
              className="text-[15px] whitespace-nowrap overflow-hidden text-red-600"
              style={{ opacity: 1 }}
            >
              Logout
            </span>
          </button>
        </div>
      </div>

      {/* Toggle Button - Outside sidebar container */}
      <button
        onClick={toggleSidebar}
        className="fixed top-15 h-6 w-6 hover:cursor-pointer rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 flex items-center justify-center z-50 transition-all duration-300"
        style={{ left: isCollapsed ? "calc(4.5rem - 0.75rem)" : "calc(13rem - 0.75rem)" }}
        aria-label="Toggle Sidebar"
      >
        <ChevronRight
          ref={arrowRef}
          className="h-3.5 w-3.5 text-black"
        />
      </button>
    </div>
  )
}
