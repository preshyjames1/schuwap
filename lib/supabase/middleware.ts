import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // 1. Create the initial response
  let supabaseResponse = NextResponse.next({
    request,
  })

  // 2. Initialize Supabase Client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          
          supabaseResponse = NextResponse.next({
            request,
          })
          
          cookiesToSet.forEach(({ name, value, options }) =>
            // @ts-ignore: Fixes type mismatch between Next.js and Supabase cookie options
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. Refresh Session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 4. Subdomain Logic (Preserving your existing features)
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

  // Inject "x-subdomain" header for your app utils to use
  if (subdomain) {
    supabaseResponse.headers.set("x-subdomain", subdomain)
  }

  // 5. Route Protection Logic
  const publicRoutes = [
    "/",
    "/auth/login",
    "/auth/sign-up",
    "/auth/error",
    "/auth/sign-up-success",
    "/auth/callback", // Required for Auth Callback to work
    // Note: /onboarding is NOT here, so it is protected
  ]

  const isPublicRoute = publicRoutes.some((path) => 
    request.nextUrl.pathname.startsWith(path)
  )

  // Redirect to login if user is not authenticated and trying to access a protected route
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}