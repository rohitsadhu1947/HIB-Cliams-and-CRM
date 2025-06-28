"use client"

import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"

export function UserRoleBadge() {
  const { user } = useAuth()

  if (!user) return null

  const roleColors = {
    admin: "bg-red-100 text-red-800 hover:bg-red-200",
    agent: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    surveyor: "bg-green-100 text-green-800 hover:bg-green-200",
  }

  return (
    <Badge variant="secondary" className={roleColors[user.role]}>
      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
    </Badge>
  )
}
