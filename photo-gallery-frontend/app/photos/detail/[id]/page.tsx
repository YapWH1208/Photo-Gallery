"use client"

import { useEffect, useState } from "react"
import {
  getPhotoDetails,
  getPhotoDownloadUrl,
  setFavorite,
  editPhoto,
  getAllThemes,
  getCollectionsByTheme,
} from "@/lib/api"
import type { Photo, Theme, Collection } from "@/types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Download, Heart, ArrowLeft, Edit, Save, Camera, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import ImageLightbox from "@/components/image-lightbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

export default function PhotoDetailPage() {
  const params = useParams()
  const photoId = params.id as string
  const router = useRouter()
  const { toast } = useToast()

  const [photo, setPhoto] = useState<Photo | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isImageLoading, setIsImageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    theme: "",
    collection: "",
    favourite: false,
    camera_model: "",
    focal_length: "",
    exposure_time: "",
    iso: "",
    aperture: "",
  })

  // Themes and collections for edit form
  const [themes, setThemes] = useState<Theme[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoadingThemes, setIsLoadingThemes] = useState(false)
  const [isLoadingCollections, setIsLoadingCollections] = useState(false)

  useEffect(() => {
    const fetchPhotoDetails = async () => {
      try {
        const photoData = await getPhotoDetails(photoId)
        setPhoto(photoData)

        // Initialize edit form with photo data
        setEditForm({
          name: photoData.name,
          theme: photoData.theme,
          collection: photoData.collection,
          favourite: photoData.favourite,
          camera_model: photoData.camera_model || "",
          focal_length: photoData.focal_length || "",
          exposure_time: photoData.exposure_time || "",
          iso: photoData.iso || "",
          aperture: photoData.aperture || "",
        })

        const { url } = await getPhotoDownloadUrl(photoId)
        setDownloadUrl(url)

        setIsLoading(false)
      } catch (err) {
        setError("Failed to load photo details. Please try again later.")
        setIsLoading(false)
      }
    }

    if (photoId) {
      fetchPhotoDetails()
    }
  }, [photoId])

  const fetchThemes = async () => {
    setIsLoadingThemes(true)
    try {
      const data = await getAllThemes()
      setThemes(data)
      setIsLoadingThemes(false)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load themes",
        variant: "destructive",
      })
      setIsLoadingThemes(false)
    }
  }

  const fetchCollections = async (themeName: string) => {
    if (!themeName) return

    setIsLoadingCollections(true)
    try {
      const data = await getCollectionsByTheme(themeName)
      setCollections(data)
      setIsLoadingCollections(false)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load collections",
        variant: "destructive",
      })
      setIsLoadingCollections(false)
    }
  }

  useEffect(() => {
    if (isEditDialogOpen) {
      fetchThemes()
      if (photo?.theme) {
        fetchCollections(photo.theme)
      }
    }
  }, [isEditDialogOpen, photo?.theme])

  useEffect(() => {
    if (editForm.theme && editForm.theme !== photo?.theme) {
      fetchCollections(editForm.theme)
      // Reset collection when theme changes
      setEditForm((prev) => ({ ...prev, collection: "" }))
    }
  }, [editForm.theme, photo?.theme])

  const handleFavoriteToggle = async () => {
    if (!photo) return

    try {
      await setFavorite(photo.id, !photo.favourite)
      setPhoto({ ...photo, favourite: !photo.favourite })
      setEditForm((prev) => ({ ...prev, favourite: !photo.favourite }))

      toast({
        title: photo.favourite ? "Removed from favorites" : "Added to favorites",
        description: photo.favourite ? "Photo removed from your favorites" : "Photo added to your favorites",
      })
    } catch (error) {
      console.error("Failed to update favorite status:", error)
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      })
    }
  }

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, "_blank")
      toast({
        title: "Download started",
        description: "Your download has started in a new tab",
      })
    }
  }

  const handleBack = () => {
    router.back()
  }

  const handleImageClick = () => {
    setIsLightboxOpen(true)
  }

  const handleEditClick = () => {
    setIsEditDialogOpen(true)
  }

  const handleEditFormChange = (field: string, value: string | boolean) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmitEdit = async () => {
    if (!photo) return

    setIsSubmitting(true)
    try {
      await editPhoto(photo.id, editForm)

      // Update local photo state with edited values
      setPhoto((prev) => {
        if (!prev) return null
        return { ...prev, ...editForm }
      })

      setIsEditDialogOpen(false)
      toast({
        title: "Success",
        description: "Photo details updated successfully",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update photo details",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="h-[70vh] flex flex-col items-center justify-center">
          <LoadingSpinner className="mb-4" />
          <p className="text-muted-foreground animate-pulse">Loading photo details...</p>
        </div>
      </div>
    )
  }

  if (error || !photo) {
    return (
      <div className="container py-10">
        <div className="p-8 bg-destructive/10 text-destructive rounded-xl flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4">{error || "Photo not found"}</h2>
          <Button variant="outline" onClick={() => router.push("/")}>
            Return to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <Button variant="ghost" onClick={handleBack} className="mb-6 group">
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          className="lg:col-span-2 photo-detail-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative rounded-xl overflow-hidden cursor-pointer shadow-lg" onClick={handleImageClick}>
            <div className="aspect-[4/3] relative">
              <Image
                src={photo.preview_image || "/placeholder.svg?height=600&width=800"}
                alt={`Preview of ${photo.name}`}
                fill
                className={cn(
                  "object-contain transition-opacity duration-500",
                  isImageLoading ? "opacity-0" : "opacity-100",
                )}
                onLoad={() => setIsImageLoading(false)}
              />
              {isImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <LoadingSpinner />
                </div>
              )}

              {/* Overlay hint for clicking */}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                <div className="bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>
                  </svg>
                  Click to view fullscreen
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="photo-detail-info"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold">{photo.name}</h1>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              onClick={handleFavoriteToggle}
              variant={photo.favourite ? "default" : "outline"}
              className="flex-1 transition-all duration-300"
            >
              <Heart className={cn("mr-2 h-5 w-5 transition-all", photo.favourite && "fill-current animate-pulse")} />
              {photo.favourite ? "Favorited" : "Add to Favorites"}
            </Button>

            <Button variant="outline" onClick={handleEditClick} className="flex-1">
              <Edit className="mr-2 h-5 w-5" />
              Edit Details
            </Button>

            <Button onClick={handleDownload} variant="gradient" className="flex-1">
              <Download className="mr-2 h-5 w-5" />
              Download
            </Button>
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-xl p-5 shadow-sm border">
              <div className="flex items-center mb-3">
                <Tag className="h-5 w-5 mr-2 text-primary" />
                <h2 className="text-xl font-semibold">Details</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-muted-foreground">Theme:</div>
                <div className="font-medium">{photo.theme}</div>

                <div className="text-muted-foreground">Collection:</div>
                <div className="font-medium">{photo.collection}</div>

                <div className="text-muted-foreground">Date Added:</div>
                <div className="font-medium">
                  {new Date(photo.date_added).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-5 shadow-sm border">
              <div className="flex items-center mb-3">
                <Camera className="h-5 w-5 mr-2 text-primary" />
                <h2 className="text-xl font-semibold">Camera Info</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-muted-foreground">Camera Model:</div>
                <div className="font-medium">{photo.camera_model || "Unknown"}</div>

                <div className="text-muted-foreground">Focal Length:</div>
                <div className="font-medium">{photo.focal_length || "Unknown"}</div>

                <div className="text-muted-foreground">Exposure Time:</div>
                <div className="font-medium">{photo.exposure_time || "Unknown"}</div>

                <div className="text-muted-foreground">ISO:</div>
                <div className="font-medium">{photo.iso || "Unknown"}</div>

                <div className="text-muted-foreground">Aperture:</div>
                <div className="font-medium">{photo.aperture || "Unknown"}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {photo.focal_length && (
                <Badge variant="outline" className="bg-primary/10">
                  {photo.focal_length}
                </Badge>
              )}
              {photo.aperture && (
                <Badge variant="outline" className="bg-primary/10">
                  f/{photo.aperture}
                </Badge>
              )}
              {photo.iso && (
                <Badge variant="outline" className="bg-primary/10">
                  ISO {photo.iso}
                </Badge>
              )}
              {photo.camera_model && (
                <Badge variant="outline" className="bg-primary/10">
                  {photo.camera_model}
                </Badge>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        imageUrl={photo.preview_image || "/placeholder.svg?height=1200&width=1600"}
        alt={photo.name}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Photo Details</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Photo Name</Label>
              <Input id="name" value={editForm.name} onChange={(e) => handleEditFormChange("name", e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="theme">Theme</Label>
              {isLoadingThemes ? (
                <div className="h-10 flex items-center">
                  <LoadingSpinner className="h-5 w-5" />
                </div>
              ) : (
                <Select value={editForm.theme} onValueChange={(value) => handleEditFormChange("theme", value)}>
                  <SelectTrigger>
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

            <div className="grid gap-2">
              <Label htmlFor="collection">Collection</Label>
              {isLoadingCollections ? (
                <div className="h-10 flex items-center">
                  <LoadingSpinner className="h-5 w-5" />
                </div>
              ) : (
                <Select
                  value={editForm.collection}
                  onValueChange={(value) => handleEditFormChange("collection", value)}
                  disabled={!editForm.theme || collections.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !editForm.theme
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

            <div className="flex items-center gap-2">
              <Label htmlFor="favourite" className="flex-grow">
                Favorite
              </Label>
              <Switch
                id="favourite"
                checked={editForm.favourite}
                onCheckedChange={(checked) => handleEditFormChange("favourite", checked)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="camera_model">Camera Model</Label>
              <Input
                id="camera_model"
                value={editForm.camera_model}
                onChange={(e) => handleEditFormChange("camera_model", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="focal_length">Focal Length</Label>
                <Input
                  id="focal_length"
                  value={editForm.focal_length}
                  onChange={(e) => handleEditFormChange("focal_length", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="aperture">Aperture</Label>
                <Input
                  id="aperture"
                  value={editForm.aperture}
                  onChange={(e) => handleEditFormChange("aperture", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="exposure_time">Exposure Time</Label>
                <Input
                  id="exposure_time"
                  value={editForm.exposure_time}
                  onChange={(e) => handleEditFormChange("exposure_time", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="iso">ISO</Label>
                <Input id="iso" value={editForm.iso} onChange={(e) => handleEditFormChange("iso", e.target.value)} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitEdit} disabled={isSubmitting} variant="gradient">
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

