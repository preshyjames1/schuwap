// lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // 1. Create the initial response
  let supabaseResponse = NextResponse.next({
    request,
  })

  // 2. Initialize the Supabase Client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Update the request cookies (for the current server-side request)
          cookiesToSet.forEach(({ name, value }) => 
            request.cookies.set(name, value)
          )
          
          // Update the response cookies (which go back to the browser)
          supabaseResponse = NextResponse.next({
            request,
          })
          
          cookiesToSet.forEach(({ name, value, options }) => 
            // @ts-ignore: Suppress type mismatch for sameSite options between Supabase and Next.js
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. Get the user to refresh the session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 4. Extract Subdomain (for your multi-tenant logic)
  const hostname = request.headers.get("host") || ""
  const subdomain = hostname.split(".")[0]
  
  // Add subdomain to headers
  supabaseResponse.headers.set("x-subdomain", subdomain)

  // 5. Route Protection Logic
  // List of public routes that don't require login
  const publicRoutes = [
    "/",
    "/auth/login",
    "/auth/sign-up",
    "/auth/error",
    "/auth/sign-up-success",
    "/auth/callback",
    // "/onboarding" is intentionally REMOVED so it is protected
  ]
  
  const isPublicRoute = publicRoutes.some(path => request.nextUrl.pathname.startsWith(path))

  // If user is NOT logged in and tries to access a private route, redirect to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // 6. Return the updated response
  return supabaseResponse
}