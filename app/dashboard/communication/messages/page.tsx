import { createServerClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search } from "lucide-react"
import Link from "next/link"

async function getMessages(schoolId: string, userId: string) {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("messages")
    .select(`
      *,
      sender:sender_id (
        first_name,
        last_name
      ),
      recipient:recipient_id (
        first_name,
        last_name
      )
    `)
    .eq("school_id", schoolId)
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(50)

  return data || []
}

export default async function MessagesPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("users").select("school_id").eq("id", user.id).single()

  if (!profile?.school_id) return null

  const messages = await getMessages(profile.school_id, user.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Send and receive messages</p>
        </div>
        <Link href="/dashboard/communication/messages/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Message
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search messages..." className="pl-10" />
            </div>
          </div>

          <div className="space-y-4">
            {messages.map((message) => {
              const isSender = message.sender_id === user.id
              const otherPerson = isSender ? message.recipient : message.sender

              return (
                <div
                  key={message.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold">
                        {isSender ? "To: " : "From: "}
                        {otherPerson?.first_name} {otherPerson?.last_name}
                      </p>
                      {!message.is_read && !isSender && <Badge variant="default">New</Badge>}
                    </div>
                    <p className="text-sm font-medium mb-1">{message.subject}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{message.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>

                  <Link href={`/dashboard/communication/messages/${message.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>

          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No messages yet</p>
              <Link href="/dashboard/communication/messages/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Send First Message
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
