"use client"

import { useEffect, useState } from "react"
import { getAllThemes, addTheme, editTheme, deleteTheme } from "@/lib/api"
import type { Theme } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import { Edit, Plus, Trash } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

export default function ThemeManagement() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null)
  const [newThemeName, setNewThemeName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchThemes = async () => {
    setIsLoading(true)
    try {
      const data = await getAllThemes()
      setThemes(data)
      setIsLoading(false)
    } catch (err) {
      setError("Failed to load themes. Please try again later.")
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchThemes()
  }, [])

  const handleAddTheme = async () => {
    if (!newThemeName.trim()) {
      toast({
        title: "Error",
        description: "Theme name cannot be empty",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await addTheme({ name: newThemeName })
      toast({
        title: "Success",
        description: "Theme added successfully",
      })
      setNewThemeName("")
      setIsAddDialogOpen(false)
      fetchThemes()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add theme",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditTheme = async () => {
    if (!selectedTheme || !newThemeName.trim()) {
      toast({
        title: "Error",
        description: "Theme name cannot be empty",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await editTheme(selectedTheme.id, {
        name: newThemeName,
        preview_image: selectedTheme.preview_image,
      })
      toast({
        title: "Success",
        description: "Theme updated successfully",
      })
      setNewThemeName("")
      setIsEditDialogOpen(false)
      fetchThemes()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update theme",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTheme = async () => {
    if (!selectedTheme) return

    setIsSubmitting(true)
    try {
      await deleteTheme(selectedTheme.id)
      toast({
        title: "Success",
        description: "Theme deleted successfully",
      })
      setIsDeleteDialogOpen(false)
      fetchThemes()
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete theme",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (theme: Theme) => {
    setSelectedTheme(theme)
    setNewThemeName(theme.name)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (theme: Theme) => {
    setSelectedTheme(theme)
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Themes</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Theme
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Theme</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Theme Name</Label>
                <Input
                  id="name"
                  value={newThemeName}
                  onChange={(e) => setNewThemeName(e.target.value)}
                  placeholder="Enter theme name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTheme} disabled={isSubmitting}>
                {isSubmitting ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
                Add Theme
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {themes.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <p>No themes found. Create a new theme to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              onEdit={() => openEditDialog(theme)}
              onDelete={() => openDeleteDialog(theme)}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Theme</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Theme Name</Label>
              <Input
                id="edit-name"
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                placeholder="Enter theme name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTheme} disabled={isSubmitting}>
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
            <DialogTitle>Delete Theme</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete the theme "{selectedTheme?.name}"? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTheme} disabled={isSubmitting}>
              {isSubmitting ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ThemeCard({
  theme,
  onEdit,
  onDelete,
}: {
  theme: Theme
  onEdit: () => void
  onDelete: () => void
}) {
  const [isImageLoading, setIsImageLoading] = useState(true)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{theme.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-video relative rounded-md overflow-hidden">
          <Image
            src={theme.preview_image || "/placeholder.svg?height=200&width=400"}
            alt={theme.name}
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

