"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

interface User {
  id: string
  username: string
  role: "admin" | "agent" | "surveyor" | "claims-manager" | "claim-adjuster" | "read-only"
  name: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  loading: boolean
  hasPermission: (resource: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Role-based permissions
const ROLE_PERMISSIONS = {
  admin: [
    "dashboard",
    "claims",
    "policies",
    "renewals",
    "vehicles",
    "policy-holders",
    "surveyors",
    "payments",
    "settings",
    "customers",
    "sales",
    "leads",
    "posp-onboarding",
    "reporting",
    "commissions",
    "corporate-business",
    "ticketing",
    "misp-onboarding",
    "pnlpulse",
  ],
  agent: [
    "dashboard",
    "policies",
    "vehicles",
    "policy-holders",
    "payments",
    "customers",
    "sales",
    "leads",
    "posp-onboarding",
    "reporting",
    "commissions",
    "ticketing",
    "misp-onboarding",
  ],
  surveyor: ["dashboard", "claims", "customers"],
  "claims-manager": [
    "dashboard",
    "claims",
    "policies",
    "vehicles",
    "policy-holders",
    "payments",
    "customers",
    "reporting",
    "ticketing",
    "pnlpulse",
  ],
  "claim-adjuster": [
    "dashboard",
    "claims",
    "policies",
    "vehicles",
    "policy-holders",
    "customers",
    "reporting",
    "ticketing",
  ],
  "read-only": [
    "dashboard",
    "claims",
    "policies",
    "vehicles",
    "policy-holders",
    "surveyors",
    "payments",
    "customers",
    "reporting",
  ],
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const hasPermission = (resource: string): boolean => {
    if (!user) return false
    const allowed = ROLE_PERMISSIONS[user.role]?.includes(resource) || false
    console.log("hasPermission check:", { resource, allowed, role: user.role, ROLE_PERMISSIONS })
    return allowed
  }

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem("auth-user")
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("auth-user")
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // Redirect logic - only run when not loading
    if (!loading) {
      if (!user && pathname !== "/login") {
        console.log("No user, redirecting to login")
        router.push("/login")
      } else if (user && pathname === "/login") {
        console.log("User logged in, redirecting to dashboard")
        router.push("/")
      } else if (user && pathname !== "/login") {
        // Check if user has permission for current path
        const currentSection = pathname.split("/")[1] || "dashboard"
        const hasAccess = hasPermission(currentSection)
        console.log("Route guard:", { pathname, currentSection, hasAccess, user })
        if (!hasAccess) {
          console.log("No access to", currentSection, "redirecting to dashboard")
          router.push("/")
        }
      }
    }
  }, [user, loading, pathname, router])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log("Attempting login with:", { username })

      // Actually call your backend API
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      console.log("Login response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Login successful, user data:", data.user)

        setUser(data.user) // Use the user data from backend

        // Store user in localStorage for client-side state persistence
        localStorage.setItem("auth-user", JSON.stringify(data.user))

        // Force immediate redirect
        console.log("Forcing redirect to dashboard")
        router.push("/")

        return true
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("Login failed:", errorData)
        return false
      }
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = async () => {
    try {
      // Call backend logout API
      await fetch("/api/auth/logout", {
        method: "POST",
      })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Clear client-side state regardless of backend response
      setUser(null)
      localStorage.removeItem("auth-user")
      router.push("/login")
    }
  }

  return <AuthContext.Provider value={{ user, login, logout, loading, hasPermission }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
