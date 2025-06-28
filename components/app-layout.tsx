"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If on login page or not authenticated, show standalone layout
  if (pathname === "/login" || !user) {
    return <>{children}</>
  }

  // If authenticated, show full app layout with sidebar and header
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
