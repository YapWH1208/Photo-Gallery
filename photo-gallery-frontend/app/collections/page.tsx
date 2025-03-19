"use client"

import { useEffect, useState } from "react"
import { getAllCollections } from "@/lib/api"
import type { Collection } from "@/types"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [groupedCollections, setGroupedCollections] = useState<Record<string, Collection[]>>({})

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const data = await getAllCollections()
        setCollections(data)

        // Group collections by theme
        const grouped = data.reduce((acc: Record<string, Collection[]>, collection) => {
          if (!acc[collection.theme]) {
            acc[collection.theme] = []
          }
          acc[collection.theme].push(collection)
          return acc
        }, {})

        setGroupedCollections(grouped)
        setIsLoading(false)
      } catch (err) {
        setError("Failed to load collections. Please try again later.")
        setIsLoading(false)
      }
    }

    fetchCollections()
  }, [])

  if (isLoading) {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">All Collections</h1>
        <LoadingSpinner className="py-20" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">All Collections</h1>
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">All Collections</h1>
      {collections.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p>No collections found.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedCollections).map(([theme, themeCollections]) => (
            <div key={theme} className="space-y-4">
              <h2 className="text-2xl font-semibold">
                <Link href={`/collections/${theme}`} className="hover:text-primary transition-colors">
                  {theme}
                </Link>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {themeCollections.map((collection) => (
                  <CollectionItem key={collection.id} collection={collection} themeName={theme} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CollectionItem({ collection, themeName }: { collection: Collection; themeName: string }) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <Link href={`/photos/${themeName}/${collection.name}`}>
      <Card className="collection-card overflow-hidden">
        <CardContent className="p-0 relative">
          <div className="aspect-video relative overflow-hidden">
            <Image
              src={collection.preview_image || "/placeholder.svg?height=200&width=400"}
              alt={collection.name}
              fill
              className={cn("object-cover transition-opacity duration-500", isLoading ? "opacity-0" : "opacity-100")}
              onLoad={() => setIsLoading(false)}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent text-white">
            <h3 className="text-xl font-bold">{collection.name}</h3>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

