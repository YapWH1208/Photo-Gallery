"use client"

import { useEffect, useState } from "react"
import { getCollectionsByTheme } from "@/lib/api"
import type { Collection } from "@/types"
import CollectionCard from "@/components/collection-card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useParams } from "next/navigation"

export default function CollectionsByThemePage() {
  const params = useParams()
  const themeName = decodeURIComponent(params.theme as string)

  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const data = await getCollectionsByTheme(themeName)
        setCollections(data)
        setIsLoading(false)
      } catch (err) {
        setError("Failed to load collections. Please try again later.")
        setIsLoading(false)
      }
    }

    if (themeName) {
      fetchCollections()
    }
  }, [themeName])

  if (isLoading) {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">{themeName} Collections</h1>
        <LoadingSpinner className="py-20" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">{themeName} Collections</h1>
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">{themeName} Collections</h1>
      {collections.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p>No collections found for this theme.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} themeName={themeName} />
          ))}
        </div>
      )}
    </div>
  )
}

