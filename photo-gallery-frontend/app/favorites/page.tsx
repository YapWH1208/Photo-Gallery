"use client"

import { useEffect, useState, useCallback } from "react"
import { getFavorites } from "@/lib/api"
import type { Photo } from "@/types"
import PhotoCard from "@/components/photo-card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function FavoritesPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFavorites = useCallback(async () => {
    try {
      const data = await getFavorites()
      setPhotos(data)
      setIsLoading(false)
    } catch (err) {
      setError("Failed to load favorites. Please try again later.")
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  const handleFavoriteChange = useCallback((id: string, isFavorite: boolean) => {
    if (!isFavorite) {
      // Remove from list if unfavorited
      setPhotos((prevPhotos) => prevPhotos.filter((photo) => photo.id !== id))
    } else {
      setPhotos((prevPhotos) =>
        prevPhotos.map((photo) => (photo.id === id ? { ...photo, favourite: isFavorite } : photo)),
      )
    }
  }, [])

  if (isLoading) {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Favorite Photos</h1>
        <LoadingSpinner className="py-20" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Favorite Photos</h1>
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Favorite Photos</h1>

      {photos.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p>No favorite photos yet. Mark photos as favorites to see them here.</p>
        </div>
      ) : (
        <div className="photo-grid">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} onFavoriteChange={handleFavoriteChange} />
          ))}
        </div>
      )}
    </div>
  )
}

