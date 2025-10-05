import { headers } from "next/headers"

export async function getSubdomain(): Promise<string | null> {
  const headersList = await headers()
  const subdomain = headersList.get("x-subdomain")

  // Filter out common non-tenant subdomains
  const excludedSubdomains = ["www", "app", "api", "admin", "localhost"]

  if (!subdomain || excludedSubdomains.includes(subdomain)) {
    return null
  }

  return subdomain
}

export async function getSchoolBySubdomain(subdomain: string) {
  const { createClient } = await import("@/lib/supabase/server")
  const supabase = await createClient()

  const { data: school, error } = await supabase.from("schools").select("*").eq("subdomain", subdomain).single()

  if (error || !school) {
    return null
  }

  return school
}

//export function constructSubdomainUrl(subdomain: string, path = "/"): string {
 // const isProduction = typeof window !== "undefined" && window.location.hostname !== "localhost"

  //if (isProduction) {
  //  return `https://${subdomain}.schuwap.xyz${path}`
  //}
export function constructSubdomainUrl(subdomain: string, path = "/"): string {
  const baseUrl = process.env.NODE_ENV === 'production'
    ? `https://${subdomain}.schuwap.xyz`
    : 'http://localhost:3000';

  return `${baseUrl}${path}`;
}
 // // For development, return localhost URL
 // return `http://localhost:3000${path}`
//}
