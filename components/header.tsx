"use client"

import type React from "react"
import { useAuth } from "@/lib/auth-context"
import { UserRoleBadge } from "@/components/user-role-badge"
import { Button } from "@/components/ui/button"

const Header: React.FC = () => {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">HIB Insurance CRM</h1>
        {user && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">{user.name}</span>
              <UserRoleBadge />
            </div>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
