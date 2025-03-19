"use client"

import { useEffect, useState } from "react"
import {
  getAllThemes,
  getAllCollections,
  getCollectionsByTheme,
  addCollection,
  editCollection,
  deleteCollection,
} from "@/lib/api"
import type { Theme, Collection } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import { Edit, Plus, Trash } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export default function CollectionManagement() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [themes, setThemes] = useState<Theme[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [newCollectionName, setNewCollectionName] = useState("")
  const [selectedTheme, setSelectedTheme] = useState("")
  const [filterTheme, setFilterTheme] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchThemes = async () => {
    try {
      const data = await getAllThemes()
      setThemes(data)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load themes",
        variant: "destructive",
      })
    }
  }

  const fetchCollections = async () => {
    setIsLoading(true)
    try {
      let data: Collection[]
      if (filterTheme) {
        data = await getCollectionsByTheme(filterTheme)
      } else {
        data = await getAllCollections()
      }
      setCollections(data)
      setIsLoading(false)
    } catch (err) {
      setError("Failed to load collections. Please try again later.")
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchThemes()
    fetchCollections()
  }, [])

  useEffect(() => {
    fetchCollections()
  }, [filterTheme])

  const handleAddCollection = async () => {
    if (!newCollectionName.trim() || !selectedTheme) {
      toast({
        title: "Error",
        description: "Collection name and theme are required",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await addCollection({
        name: newCollectionName,
        theme: selectedTheme,
      })
      toast({
        title: "Success",
        description: "Collection added successfully",
      })
      setNewCollectionName("")
      setSelectedTheme("")
      setIsAddDialogOpen(false)
      fetchCollections()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add collection",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCollection = async () => {
    if (!selectedCollection || !newCollectionName.trim() || !selectedTheme) {
      toast({
        title: "Error",
        description: "Collection name and theme are required",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await editCollection(selectedCollection.id, {
        name: newCollectionName,
        theme: selectedTheme,
        preview_image: selectedCollection.preview_image,
      })
      toast({
        title: "Success",
        description: "Collection updated successfully",
      })
      setNewCollectionName("")
      setSelectedTheme("")
      setIsEditDialogOpen(false)
      fetchCollections()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update collection",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCollection = async () => {
    if (!selectedCollection) return

    setIsSubmitting(true)
    try {
      await deleteCollection(selectedCollection.id)
      toast({
        title: "Success",
        description: "Collection deleted successfully",
      })
      setIsDeleteDialogOpen(false)
      fetchCollections()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete collection",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (collection: Collection) => {
    setSelectedCollection(collection)
    setNewCollectionName(collection.name)
    setSelectedTheme(collection.theme)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (collection: Collection) => {
    setSelectedCollection(collection)
    setIsDeleteDialogOpen(true)
  }

  if (isLoading) {
    return <LoadingSpinner className="py-20" />
  }

  if (error) {
    return <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">Collections</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Select value={filterTheme} onValueChange={setFilterTheme}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Themes</SelectItem>
              {themes.map((theme) => (
                <SelectItem key={theme.id} value={theme.name}>
                  {theme.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Collection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Collection</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Collection Name</Label>
                  <Input
                    id="name"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="Enter collection name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={selectedTheme} onValueChange={setSelectedTheme}>
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
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCollection} disabled={isSubmitting}>
                  {isSubmitting ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
                  Add Collection
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <p>No collections found. Create a new collection to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onEdit={() => openEditDialog(collection)}
              onDelete={() => openDeleteDialog(collection)}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Collection Name</Label>
              <Input
                id="edit-name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Enter collection name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-theme">Theme</Label>
              <Select value={selectedTheme} onValueChange={setSelectedTheme}>
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCollection} disabled={isSubmitting}>
              {isSubmitting ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Collection</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete the collection "{selectedCollection?.name}"? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCollection} disabled={isSubmitting}>
              {isSubmitting ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CollectionCard({
  collection,
  onEdit,
  onDelete,
}: {
  collection: Collection
  onEdit: () => void
  onDelete: () => void
}) {
  const [isImageLoading, setIsImageLoading] = useState(true)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{collection.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-video relative rounded-md overflow-hidden">
          <Image
            src={collection.preview_image || "/placeholder.svg?height=200&width=400"}
            alt={collection.name}
            fill
            className={cn("object-cover transition-opacity duration-500", isImageLoading ? "opacity-0" : "opacity-100")}
            onLoad={() => setIsImageLoading(false)}
          />
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <LoadingSpinner />
            </div>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Theme: {collection.theme}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}

