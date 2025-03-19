"use client"

import type { Collection } from "@/types"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

interface CollectionCardProps {
  collection: Collection
  themeName: string
  index?: number
}

export default function CollectionCard({ collection, themeName, index = 0 }: CollectionCardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    router.push(`/photos/${themeName}/${collection.name}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="collection-card cursor-pointer overflow-hidden group" onClick={handleClick}>
        <CardContent className="p-0 relative">
          <div className="aspect-video relative overflow-hidden">
            <Image
              src={collection.preview_image || "/placeholder.svg?height=200&width=400"}
              alt={collection.name}
              fill
              className={cn(
                "object-cover transition-all duration-700 group-hover:scale-110",
                isLoading ? "opacity-0" : "opacity-100",
              )}
              onLoad={() => setIsLoading(false)}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {/* Overlay with gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
          </div>
          <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
            <Badge
              variant="outline"
              className="self-start mb-2 bg-black/30 backdrop-blur-sm border-white/20 text-white"
            >
              Collection
            </Badge>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold tracking-tight group-hover:translate-y-0 transition-transform duration-300">
                  {collection.name}
                </h2>
                <p className="text-sm text-white/80 mt-1">{themeName}</p>
                <div className="h-1 w-0 bg-gradient-to-r from-blue-500 to-indigo-600 mt-2 transition-all duration-300 group-hover:w-1/3"></div>
              </div>
              <motion.div
                animate={{ x: isHovered ? 0 : 10, opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white/20 backdrop-blur-sm p-2 rounded-full"
              >
                <ArrowRight className="h-5 w-5 text-white" />
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

