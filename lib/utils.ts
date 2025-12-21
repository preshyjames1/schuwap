import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add this helper for generating complete URLs
export function absoluteUrl(path: string) {
  // If running on client side, return path as is
  if (typeof window !== 'undefined') return path
  
  // If in production (Vercel), use HTTPS
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}${path}`
  }
  
  // Default to localhost
  return `http://localhost:3000${path}`
}