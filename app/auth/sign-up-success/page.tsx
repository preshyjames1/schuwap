import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail, CheckCircle } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-b from-blue-50 to-white">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Mail className="h-16 w-16 text-blue-600" />
                  <CheckCircle className="h-6 w-6 text-green-600 absolute -bottom-1 -right-1 bg-white rounded-full" />
                </div>
              </div>
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
              <CardDescription>We&apos;ve sent you a confirmation link</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Thank you for registering your school with Schuwap! We&apos;ve sent a confirmation email to your inbox.
                Please click the link in the email to verify your account and complete the setup.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-semibold">Next Steps:</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Check your email inbox (and spam folder)</li>
                  <li>Click the confirmation link</li>
                  <li>You&apos;ll be redirected to your school&apos;s portal</li>
                  <li>Complete your school onboarding</li>
                  <li>Start managing your school!</li>
                </ol>
              </div>
              <Button asChild className="w-full">
                <Link href="/auth/login">Back to Login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
