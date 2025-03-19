"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { uploadPhoto, getAllThemes, getCollectionsByTheme } from "@/lib/api"
import type { Theme, Collection } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Upload, FileUp, ImageIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedTheme, setSelectedTheme] = useState<string>("")
  const [selectedCollection, setSelectedCollection] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [themes, setThemes] = useState<Theme[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoadingThemes, setIsLoadingThemes] = useState(true)
  const [isLoadingCollections, setIsLoadingCollections] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const data = await getAllThemes()
        setThemes(data)
        setIsLoadingThemes(false)
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load themes. Please try again later.",
          variant: "destructive",
        })
        setIsLoadingThemes(false)
      }
    }

    fetchThemes()
  }, [toast])

  useEffect(() => {
    const fetchCollections = async () => {
      if (!selectedTheme) {
        setCollections([])
        return
      }

      setIsLoadingCollections(true)
      try {
        const data = await getCollectionsByTheme(selectedTheme)
        setCollections(data)
        setIsLoadingCollections(false)
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load collections. Please try again later.",
          variant: "destructive",
        })
        setIsLoadingCollections(false)
      }
    }

    fetchCollections()
  }, [selectedTheme, toast])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      processFile(selectedFile)
    }
  }

  const processFile = (selectedFile: File) => {
    // Check if file is an image
    if (!selectedFile.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)

    // Create preview URL
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(selectedFile)

    // Show success toast
    toast({
      title: "Image selected",
      description: `${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`,
    })
  }

  const handleThemeChange = (value: string) => {
    setSelectedTheme(value)
    setSelectedCollection("")
  }

  const handleCollectionChange = (value: string) => {
    setSelectedCollection(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file || !selectedTheme || !selectedCollection) {
      toast({
        title: "Missing information",
        description: "Please select a file, theme, and collection.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("theme", selectedTheme)
      formData.append("collection", selectedCollection)

      const result = await uploadPhoto(formData)

      toast({
        title: "Success",
        description: "Photo uploaded successfully!",
      })

      // Redirect to the photo detail page
      router.push(`/photos/detail/${result.id}`)
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your photo. Please try again.",
        variant: "destructive",
      })
      setIsUploading(false)
    }
  }

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!isDragging) {
        setIsDragging(true)
      }
    },
    [isDragging],
  )

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      processFile(droppedFile)
    }
  }, [])

  return (
    <div className="container py-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-bold mb-2">Upload Photo</h1>
        <p className="text-muted-foreground mb-8 max-w-2xl">
          Share your photography with the world. Select a theme and collection, then upload your image.
        </p>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        className="max-w-2xl mx-auto space-y-8 bg-card p-8 rounded-xl shadow-sm border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="theme" className="text-base">
              Theme
            </Label>
            {isLoadingThemes ? (
              <div className="h-10 flex items-center">
                <LoadingSpinner className="h-5 w-5" />
              </div>
            ) : (
              <Select value={selectedTheme} onValueChange={handleThemeChange}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((theme) => (
                    <SelectItem key={theme.id} value={theme.name}>
                      {theme.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="collection" className="text-base">
              Collection
            </Label>
            {isLoadingCollections ? (
              <div className="h-10 flex items-center">
                <LoadingSpinner className="h-5 w-5" />
              </div>
            ) : (
              <Select
                value={selectedCollection}
                onValueChange={handleCollectionChange}
                disabled={!selectedTheme || collections.length === 0}
              >
                <SelectTrigger className="h-12">
                  <SelectValue
                    placeholder={
                      !selectedTheme
                        ? "Select a theme first"
                        : collections.length === 0
                          ? "No collections available"
                          : "Select a collection"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {collections.map((collection) => (
                    <SelectItem key={collection.id} value={collection.name}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo" className="text-base">
              Photo
            </Label>
            <div
              className={`border-2 border-dashed ${
                isDragging ? "border-primary scale-[1.02] bg-primary/5" : "border-muted-foreground/25"
              } rounded-xl p-8 text-center hover:border-primary/50 transition-all duration-300 upload-area ${
                isDragging ? "upload-area-active" : ""
              }`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Input id="photo" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <Label htmlFor="photo" className="cursor-pointer flex flex-col items-center justify-center gap-4">
                {previewUrl ? (
                  <div className="relative w-full max-w-md mx-auto">
                    <img
                      src={previewUrl || "/placeholder.svg"}
                      alt="Preview"
                      className="max-h-64 max-w-full mx-auto rounded-lg object-contain shadow-md transition-all duration-300 hover:shadow-lg"
                    />
                    <p className="mt-4 text-sm text-muted-foreground">Click to change or drop a new image</p>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                      <ImageIcon className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-medium mb-1">Drag and drop an image here</p>
                      <p className="text-muted-foreground mb-4">or click to browse files</p>
                      <Button type="button" variant="outline" size="sm" className="mx-auto">
                        <FileUp className="mr-2 h-4 w-4" />
                        Select Image
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">Supports: JPG, PNG, GIF, WebP (Max 10MB)</p>
                  </>
                )}
              </Label>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 text-base"
          disabled={!file || !selectedTheme || !selectedCollection || isUploading}
          variant="gradient"
        >
          {isUploading ? (
            <>
              <LoadingSpinner className="mr-2 h-5 w-5" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-5 w-5" />
              Upload Photo
            </>
          )}
        </Button>
      </motion.form>
    </div>
  )
}

