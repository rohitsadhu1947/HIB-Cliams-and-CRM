"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/lib/auth-context"
import {
  LayoutDashboard,
  FileText,
  Car,
  Users,
  ClipboardList,
  UserCheck,
  CreditCard,
  Settings,
  LogOut,
  TrendingUp,
  UserPlus,
  Shield,
  BarChart3,
  DollarSign,
  Building2,
  Ticket,
  FileCheck,
  PieChart,
} from "lucide-react"

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
    color: "text-sky-500",
    resource: "dashboard",
  },
  {
    label: "Claims",
    icon: FileText,
    href: "/claims",
    color: "text-violet-500",
    resource: "claims",
  },
  {
    label: "Customer 360",
    icon: Users,
    href: "/customers",
    color: "text-blue-600",
    resource: "customers",
  },
  {
    label: "Policies",
    icon: ClipboardList,
    href: "/policies",
    color: "text-pink-700",
    resource: "policies",
  },
  {
    label: "Vehicles",
    icon: Car,
    href: "/vehicles",
    color: "text-orange-500",
    resource: "vehicles",
  },
  {
    label: "Policy Holders",
    icon: Users,
    href: "/policy-holders",
    color: "text-emerald-500",
    resource: "policy-holders",
  },
  {
    label: "Surveyors",
    icon: UserCheck,
    href: "/surveyors",
    color: "text-green-700",
    resource: "surveyors",
  },
  {
    label: "Payments",
    icon: CreditCard,
    href: "/payments",
    color: "text-blue-700",
    resource: "payments",
  },
  {
    label: "Sales",
    icon: TrendingUp,
    href: "https://preproduction.iceinsurance.in/login?domain=https://posp.haritaib.com",
    color: "text-indigo-500",
    resource: "sales",
    external: true,
  },
  {
    label: "Leads",
    icon: UserPlus,
    href: "https://preproduction.iceinsurance.in/login?domain=https://posp.haritaib.com",
    color: "text-purple-500",
    resource: "leads",
    external: true,
  },
  {
    label: "POSP Onboarding",
    icon: Shield,
    href: "https://preproduction.iceinsurance.in/login?domain=https://posp.haritaib.com",
    color: "text-teal-500",
    resource: "posp-onboarding",
    external: true,
  },
  {
    label: "MISP Onboarding",
    icon: FileCheck,
    href: "https://v0-hib-misp.vercel.app/login",
    color: "text-cyan-500",
    resource: "misp-onboarding",
    external: true,
  },
  {
    label: "Reporting",
    icon: BarChart3,
    href: "https://preproduction.iceinsurance.in/login?domain=https://posp.haritaib.com",
    color: "text-amber-500",
    resource: "reporting",
    external: true,
  },
  {
    label: "Commissions",
    icon: DollarSign,
    href: "https://preproduction.iceinsurance.in/login?domain=https://posp.haritaib.com",
    color: "text-green-500",
    resource: "commissions",
    external: true,
  },
  {
    label: "Corporate Business",
    icon: Building2,
    href: "https://bprisk.org",
    color: "text-slate-500",
    resource: "corporate-business",
    external: true,
  },
  {
    label: "PNLPulse",
    icon: PieChart,
    href: "https://v0-ensuredit-sales-dashboard.vercel.app/dashboard",
    color: "text-emerald-600",
    resource: "pnlpulse",
    external: true,
  },
  {
    label: "Ticketing",
    icon: Ticket,
    href: "https://ticketing.ensuredit.com/#login",
    color: "text-red-500",
    resource: "ticketing",
    external: true,
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    resource: "settings",
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { hasPermission, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  // Filter routes based on user permissions
  const authorizedRoutes = routes.filter((route) => hasPermission(route.resource))

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white">
      <div className="px-3 py-2 flex-1 min-h-0">
        <Link href="/" className="flex items-center pl-3 mb-6">
          <h1 className="text-2xl font-bold">HIB CRM</h1>
        </Link>
        <ScrollArea className="h-full">
          <div className="space-y-1 pr-3">
            {authorizedRoutes.map((route) =>
              route.external ? (
                <a
                  key={route.href}
                  href={route.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition text-zinc-400",
                  )}
                >
                  <div className="flex items-center flex-1">
                    <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                    {route.label}
                  </div>
                </a>
              ) : (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                    pathname === route.href ? "text-white bg-white/10" : "text-zinc-400",
                  )}
                >
                  <div className="flex items-center flex-1">
                    <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                    {route.label}
                  </div>
                </Link>
              ),
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="px-3 py-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-zinc-400 hover:text-white hover:bg-white/10"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  )
}
