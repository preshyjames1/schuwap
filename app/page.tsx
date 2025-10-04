import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Users, BookOpen, DollarSign, Calendar, MessageSquare } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-16 text-center">
        <div className="flex items-center justify-center mb-6">
          <GraduationCap className="h-16 w-16 text-blue-600" />
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4 text-balance">Schuwap School Management System</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto text-pretty">
          Complete school management solution for Nigerian schools. Manage students, academics, finances, and
          communication all in one place.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/auth/sign-up">Get Started Free</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </header>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need to Run Your School</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>Student Management</CardTitle>
              <CardDescription>
                Complete student information system with enrollment, profiles, and records management
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BookOpen className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>Academic Management</CardTitle>
              <CardDescription>
                Grading, attendance tracking, timetables, and computer-based testing (CBT)
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <DollarSign className="h-10 w-10 text-yellow-600 mb-2" />
              <CardTitle>Financial Management</CardTitle>
              <CardDescription>
                Fee structures, invoicing, payment tracking with Flutterwave & Paystack integration
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>Timetable & Events</CardTitle>
              <CardDescription>Automated timetable generation, event calendar, and schedule management</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <MessageSquare className="h-10 w-10 text-red-600 mb-2" />
              <CardTitle>Communication</CardTitle>
              <CardDescription>SMS, email notifications, announcements, and parent-teacher messaging</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <GraduationCap className="h-10 w-10 text-indigo-600 mb-2" />
              <CardTitle>Multi-Tenant</CardTitle>
              <CardDescription>
                Each school gets their own subdomain with complete data isolation and security
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-16 bg-gray-50 rounded-lg my-16">
        <h2 className="text-3xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
        <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Trial</CardTitle>
              <CardDescription>Free for 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-4">₦0</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Up to 100 students</li>
                <li>• Up to 20 staff</li>
                <li>• All core features</li>
                <li>• Email support</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Basic</CardTitle>
              <CardDescription>For small schools</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-4">
                ₦25,000<span className="text-sm font-normal">/term</span>
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Up to 300 students</li>
                <li>• Up to 50 staff</li>
                <li>• All core features</li>
                <li>• Priority support</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-blue-600 border-2">
            <CardHeader>
              <CardTitle>Standard</CardTitle>
              <CardDescription>Most popular</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-4">
                ₦50,000<span className="text-sm font-normal">/term</span>
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Up to 1,000 students</li>
                <li>• Unlimited staff</li>
                <li>• All features + CBT</li>
                <li>• 24/7 support</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Premium</CardTitle>
              <CardDescription>For large schools</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-4">
                ₦100,000<span className="text-sm font-normal">/term</span>
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Unlimited students</li>
                <li>• Unlimited staff</li>
                <li>• All features + API</li>
                <li>• Dedicated support</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600 border-t">
        <p>&copy; 2025 Schuwap. All rights reserved.</p>
      </footer>
    </div>
  )
}
