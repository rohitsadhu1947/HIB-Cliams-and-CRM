import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret-key")

// Role-based permissions
const ROLE_PERMISSIONS = {
  admin: [
    "dashboard",
    "claims",
    "policies",
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes, static files, and login
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/login" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    const { payload } = await jwtVerify(token, secret)
    const role = payload.role as keyof typeof ROLE_PERMISSIONS

    // Get the current section from the URL
    const section = pathname.split("/")[1] || "dashboard"

    // Check if user has permission for this section
    if (!ROLE_PERMISSIONS[role]?.includes(section)) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    return NextResponse.next()
  } catch (error) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
