"use client"

import type React from "react"

import type { Photo } from "@/types"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, Info, Eye } from "lucide-react"
import { useState, useRef } from "react"
import { setFavorite } from "@/lib/api"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

interface PhotoCardProps {
  photo: Photo
  onFavoriteChange?: (id: string, isFavorite: boolean) => void
  index?: number
}

export default function PhotoCard({ photo, onFavoriteChange, index = 0 }: PhotoCardProps) {
  const [isFavorite, setIsFavorite] = useState(photo.favourite)
  const [isLoading, setIsLoading] = useState(true)
  const [showInfo, setShowInfo] = useState(false)
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState("")

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await setFavorite(photo.id, !isFavorite)
      setIsFavorite(!isFavorite)
      if (onFavoriteChange) {
        onFavoriteChange(photo.id, !isFavorite)
      }
    } catch (error) {
      console.error("Failed to update favorite status:", error)
    }
  }

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowInfo(!showInfo)
  }

  const handleCardClick = () => {
    router.push(`/photos/detail/${photo.id}`)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateX = (y - centerY) / 25
    const rotateY = (centerX - x) / 25

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`)
  }

  const handleMouseLeave = () => {
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg)")
  }

  return (
    <motion.div
      ref={cardRef}
      className="parallax-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Card className="photo-card cursor-pointer overflow-hidden" onClick={handleCardClick} style={{ transform }}>
        <CardContent className="p-0 relative parallax-image">
          <div className="aspect-square relative overflow-hidden">
            <Image
              src={photo.preview_image || "/placeholder.svg?height=300&width=300"}
              alt={photo.name}
              fill
              className={cn("object-cover transition-opacity duration-500", isLoading ? "opacity-0" : "opacity-100")}
              onLoad={() => setIsLoading(false)}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {/* Overlay with gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          <div className="absolute top-2 right-2 flex gap-2">
            <button
              className={`p-2 rounded-full bg-background/80 backdrop-blur-sm transition-all duration-300 hover:scale-110 ${
                showInfo ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
              onClick={handleInfoClick}
              aria-label={showInfo ? "Hide info" : "Show info"}
            >
              <Info className="h-5 w-5" />
            </button>
            <button
              className={`p-2 rounded-full bg-background/80 backdrop-blur-sm transition-all duration-300 hover:scale-110 ${
                isFavorite ? "text-red-500" : "text-muted-foreground"
              }`}
              onClick={handleFavoriteClick}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} />
            </button>
          </div>

          {showInfo && (
            <div className="absolute inset-0 bg-background/90 dark:bg-card/90 backdrop-blur-sm p-4 flex flex-col justify-between animate-in fade-in-0 zoom-in-95 duration-200">
              <div>
                <h3 className="font-semibold text-lg mb-2">{photo.name}</h3>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">Theme:</span> {photo.theme}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Collection:</span> {photo.collection}
                  </p>
                  {photo.camera_model && (
                    <p>
                      <span className="text-muted-foreground">Camera:</span> {photo.camera_model}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
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
              </div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent text-white">
            <div className="flex justify-between items-center">
              <h3 className="font-medium truncate">{photo.name}</h3>
              <div className="flex items-center text-xs">
                <Eye className="h-3 w-3 mr-1" />
                <span>View</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

