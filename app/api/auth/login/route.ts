import { type NextRequest, NextResponse } from "next/server"
import { SignJWT } from "jose"
import { cookies } from "next/headers"

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-development")

// Hardcoded users for demo
const users = [
  { id: "1", username: "admin", password: "admin123", role: "admin" as const, name: "Admin User" },
  { id: "2", username: "agent", password: "agent123", role: "agent" as const, name: "Agent User" },
  { id: "3", username: "surveyor", password: "surveyor123", role: "surveyor" as const, name: "Surveyor User" },
]

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Find user
    const user = users.find((u) => u.username === username && u.password === password)

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create JWT token
    const token = await new SignJWT({
      userId: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(secret)

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
