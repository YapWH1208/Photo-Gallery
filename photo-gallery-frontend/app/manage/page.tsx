"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ThemeManagement from "@/components/manage/theme-management"
import CollectionManagement from "@/components/manage/collection-management"

export default function ManagePage() {
  const [activeTab, setActiveTab] = useState("themes")

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Manage Gallery</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="themes">Themes</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
        </TabsList>
        <TabsContent value="themes" className="mt-6">
          <ThemeManagement />
        </TabsContent>
        <TabsContent value="collections" className="mt-6">
          <CollectionManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}

