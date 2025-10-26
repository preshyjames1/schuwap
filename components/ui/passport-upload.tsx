"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

interface PassportUploadProps {
  url: string | null
  onUpload: (url: string) => void
}

export function PassportUpload({ url, onUpload }: PassportUploadProps) {
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.")
      }

      const file = event.target.files[0]
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `passports/${fileName}`

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)
      onUpload(data.publicUrl)
      toast.success("Passport uploaded successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error uploading passport")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20">
        <AvatarImage src={url ?? undefined} alt="Passport Photo" />
        <AvatarFallback>Upload</AvatarFallback>
      </Avatar>
      <div className="grid gap-2">
        <Label htmlFor="passport-upload">Passport Photo</Label>
        <div className="flex gap-2">
          <Input id="passport-upload" type="file" onChange={handleUpload} disabled={uploading} accept="image/*" className="w-full" />
          <Button type="button" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Upload a passport-sized photo (optional, max 2MB).</p>
      </div>
    </div>
  )
}