import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { cookies } from "next/headers"

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret-key-for-development")

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ user: null })
    }

    const { payload } = await jwtVerify(token, secret)

    return NextResponse.json({
      user: {
        id: payload.userId,
        username: payload.username,
        role: payload.role,
        name: payload.name,
      },
    })
  } catch (error) {
    console.error("Session error:", error)
    return NextResponse.json({ user: null })
  }
}
