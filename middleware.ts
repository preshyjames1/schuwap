// middleware.ts
import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  // 1. Run Supabase auth (handles session cookies)
  const response = await updateSession(request)

  // 2. Localhost & Subdomain Logic
  const url = request.nextUrl
  let hostname = request.headers.get("host")!

  // Remove port if present (e.g., localhost:3000 -> localhost)
  hostname = hostname.split(":")[0]

  let subdomain: string | null = null
  const mainDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "schuwap.xyz"

  // Detect subdomain based on environment
  if (hostname === "localhost") {
    // Root localhost (landing page)
    subdomain = null
  } else if (hostname.endsWith(".localhost")) {
    // Localhost tenant (e.g. school.localhost -> school)
    subdomain = hostname.replace(".localhost", "")
  } else if (hostname.endsWith(`.${mainDomain}`)) {
    // Production tenant (e.g. school.schuwap.xyz -> school)
    subdomain = hostname.replace(`.${mainDomain}`, "")
  }

  // 3. Inject "x-subdomain" header for your app to use
  if (subdomain) {
    response.headers.set("x-subdomain", subdomain)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}