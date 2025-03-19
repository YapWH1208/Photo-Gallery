"use client"

import { useEffect, useState, useCallback } from "react"
import { getPhotosByThemeAndCollection } from "@/lib/api"
import type { Photo } from "@/types"
import PhotoCard from "@/components/photo-card"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ImageIcon, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PhotosPage() {
  const params = useParams()
  const router = useRouter()
  const themeName = decodeURIComponent(params.theme as string)
  const collectionName = decodeURIComponent(params.collection as string)

  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const data = await getPhotosByThemeAndCollection(themeName, collectionName)
        setPhotos(data)
        setIsLoading(false)
      } catch (err) {
        setError("Failed to load photos. Please try again later.")
        setIsLoading(false)
      }
    }

    if (themeName && collectionName) {
      fetchPhotos()
    }
  }, [themeName, collectionName])

  const handleFavoriteChange = useCallback((id: string, isFavorite: boolean) => {
    setPhotos((prevPhotos) =>
      prevPhotos.map((photo) => (photo.id === id ? { ...photo, favourite: isFavorite } : photo)),
    )
  }, [])

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
            <div className="relative flex items-center justify-center w-full h-full bg-primary/10 rounded-full">
              <ImageIcon className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-xl font-medium mb-2 animate-pulse">Loading Photos</h2>
          <p className="text-muted-foreground">Preparing your collection...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-10">
        <div className="max-w-md mx-auto bg-destructive/10 text-destructive rounded-xl p-6 shadow-lg">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 group flex items-center">
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back
      </Button>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
          <h1 className="text-3xl font-bold gradient-text">{collectionName}</h1>
        </div>
        <p className="text-muted-foreground ml-11">
          Theme: <span className="text-foreground font-medium">{themeName}</span>
        </p>
      </motion.div>

      {photos.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl shadow-sm border">
          <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-2xl font-medium mb-2">No photos found</h2>
          <p className="text-muted-foreground mb-6">This collection doesn't have any photos yet.</p>
          <Button variant="outline" onClick={() => router.push("/upload")} className="mx-auto">
            Upload Photos
          </Button>
        </div>
      ) : (
        <div className="photo-grid">
          {photos.map((photo, index) => (
            <PhotoCard key={photo.id} photo={photo} onFavoriteChange={handleFavoriteChange} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}

