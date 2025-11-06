"use client"

import React, { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, Upload, X, User } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ProfilePictureUploadProps {
  /** Current public URL of the avatar (optional) */
  currentImage?: string | null
  /** Current storage path – needed when replacing an existing file */
  currentImagePath?: string | null
  /** Called when a new image is successfully uploaded */
  onImageUpdate: (url: string, path: string) => void
  /** Optional error callback (e.g. to show in the parent form) */
  onError?: (msg: string) => void
  /** User name shown as fallback */
  userName?: string
  /** Tailwind class string for the outer container */
  className?: string
  /** Optional custom placeholder size (default 120px) */
  size?: number
}

const supabase = createClient()

export function ProfilePictureUpload({
  currentImage,
  currentImagePath,
  onImageUpdate,
  onError,
  userName = "User",
  className,
  size = 120,
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage ?? null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Keep preview in sync when `currentImage` changes (e.g. on edit)
  useEffect(() => {
    setPreview(currentImage ?? null)
  }, [currentImage])

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Basic validation
    if (!file.type.startsWith("image/")) {
      onError?.("Please select an image file.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      // 5 MB limit
      onError?.("Image must be smaller than 5 MB.")
      return
    }

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setUploading(true)

    try {
      // 1. Generate a path – use a random UUID for new users, otherwise reuse the old path folder
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png"
      const fileName = `${crypto.randomUUID()}.${ext}`
      const path = `avatars/${fileName}`

      // 2. Upload
      const { error: uploadError } = await supabase.storage
        .from("public") // <-- make sure this bucket exists & is public
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      // 3. Get public URL
      const { data } = supabase.storage.from("public").getPublicUrl(path)
      const publicUrl = data.publicUrl

      // 4. Clean up old file if we have a previous path
      if (currentImagePath && currentImagePath !== path) {
        await supabase.storage.from("public").remove([currentImagePath])
      }

      // 5. Notify parent
      onImageUpdate(publicUrl, path)
    } catch (err: any) {
      setPreview(currentImage ?? null) // revert preview
      onError?.(err.message ?? "Failed to upload image.")
    } finally {
      setUploading(false)
      URL.revokeObjectURL(objectUrl)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const removeImage = async () => {
    if (!currentImagePath) return

    setUploading(true)
    try {
      await supabase.storage.from("public").remove([currentImagePath])
      onImageUpdate("", "")
      setPreview(null)
    } catch (err: any) {
      onError?.(err.message ?? "Failed to remove image.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card
      className={cn(
        "flex flex-col items-center gap-4 p-4 border-dashed border-2 transition-colors",
        uploading ? "border-muted-foreground/50" : "border-muted-foreground/30 hover:border-primary/50",
        className
      )}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Avatar */}
      <div
        className={cn(
          "relative rounded-full overflow-hidden bg-muted flex items-center justify-center",
          `w-[${size}px] h-[${size}px]`
        )}
      >
        {preview ? (
          <Image
            src={preview}
            alt={userName}
            width={size}
            height={size}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <User className="w-12 h-12 mb-1" />
            <span className="text-xs">{userName.slice(0, 2).toUpperCase()}</span>
          </div>
        )}

        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4" />
          </Button>

          {preview && (
            <Button
              size="icon"
              variant="destructive"
              className="h-8 w-8"
              onClick={removeImage}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Upload spinner */}
        {uploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={uploading}
        aria-label="Upload profile picture"
        title="Upload profile picture"
      />

      {/* Instructions */}
      <p className="text-sm text-muted-foreground text-center">
        Drag & drop or <button type="button" className="underline" onClick={() => fileInputRef.current?.click()}>browse</button>
        <br />
        Max 5 MB • JPG, PNG, GIF
      </p>
    </Card>
  )
}