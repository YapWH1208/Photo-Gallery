"use client"

import { useEffect, useState } from "react"
import { getAllThemes } from "@/lib/api"
import type { Theme } from "@/types"
import ThemeCard from "@/components/theme-card"
import { motion } from "framer-motion"
import { ImageIcon, Camera, Layers } from "lucide-react"

export default function HomePage() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const data = await getAllThemes()
        setThemes(data)
        setIsLoading(false)
      } catch (err) {
        setError("Failed to load themes. Please try again later.")
        setIsLoading(false)
      }
    }

    fetchThemes()
  }, [])

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
            <div className="relative flex items-center justify-center w-full h-full bg-primary/10 rounded-full">
              <Camera className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-xl font-medium mb-2 animate-pulse">Loading Gallery</h2>
          <p className="text-muted-foreground">Preparing your visual experience...</p>
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
      <div className="relative mb-12">
        <motion.div
          className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        />

        <motion.h1
          className="text-4xl md:text-5xl font-bold mb-3 relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="gradient-text">Explore Themes</span>
        </motion.h1>

        <motion.p
          className="text-muted-foreground mb-8 max-w-2xl text-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Browse our curated collection of photography themes. Each theme contains multiple collections of stunning
          photographs.
        </motion.p>
      </div>

      {themes.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl shadow-sm border">
          <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-2xl font-medium mb-2">No themes found</h2>
          <p className="text-muted-foreground">Create a new theme to get started with your gallery.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {themes.map((theme, index) => (
            <ThemeCard key={theme.id} theme={theme} index={index} />
          ))}
        </div>
      )}

      <motion.div
        className="mt-16 p-8 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="bg-background/80 backdrop-blur-sm p-4 rounded-full">
            <Layers className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Organize Your Photography</h2>
            <p className="text-muted-foreground">
              Create themes and collections to organize your photos in a meaningful way. Browse through different
              categories and discover amazing photography.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

