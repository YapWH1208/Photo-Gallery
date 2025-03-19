"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Move, RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageLightboxProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  alt: string
}

export default function ImageLightbox({ isOpen, onClose, imageUrl, alt }: ImageLightboxProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showControls, setShowControls] = useState(true)
  const imageRef = useRef<HTMLImageElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Reset state when the lightbox opens
  useEffect(() => {
    if (isOpen) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
      setRotation(0)
      setShowControls(true)
    }
  }, [isOpen])

  // Hide controls after inactivity
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true)

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }

      controlsTimeoutRef.current = setTimeout(() => {
        if (!isDragging) {
          setShowControls(false)
        }
      }, 3000)
    }

    if (isOpen) {
      window.addEventListener("mousemove", handleMouseMove)

      // Initial timeout
      controlsTimeoutRef.current = setTimeout(() => {
        if (!isDragging) {
          setShowControls(false)
        }
      }, 3000)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [isOpen, isDragging])

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 4))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5))
  }

  const handleRotateLeft = () => {
    setRotation((prev) => prev - 90)
  }

  const handleRotateRight = () => {
    setRotation((prev) => prev + 90)
  }

  const handleReset = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setRotation(0)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y
      setPosition({ x: newX, y: newY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      // Scroll up - zoom in
      setScale((prev) => Math.min(prev + 0.1, 4))
    } else {
      // Scroll down - zoom out
      setScale((prev) => Math.max(prev - 0.1, 0.5))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] p-0 bg-background/95 backdrop-blur-sm lightbox-backdrop"
        onWheel={handleWheel}
      >
        <DialogTitle className="sr-only">{alt || "Image Preview"}</DialogTitle>

        {/* Controls */}
        <div
          className={cn(
            "absolute top-4 right-4 z-50 flex gap-2 transition-opacity duration-300",
            showControls ? "opacity-100" : "opacity-0",
          )}
        >
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
            onClick={handleZoomOut}
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
            <span className="sr-only">Zoom out</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
            onClick={handleZoomIn}
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
            <span className="sr-only">Zoom in</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
            onClick={handleRotateLeft}
            title="Rotate left"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="sr-only">Rotate left</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
            onClick={handleRotateRight}
            title="Rotate right"
          >
            <RotateCw className="h-4 w-4" />
            <span className="sr-only">Rotate right</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
            onClick={handleReset}
            title="Reset"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="sr-only">Reset</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
            onClick={onClose}
            title="Close"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <div
          className={cn(
            "w-full h-full flex items-center justify-center overflow-hidden lightbox-content",
            isDragging ? "cursor-grabbing" : scale > 1 ? "cursor-grab" : "cursor-default",
          )}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {scale === 1 && showControls && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm flex items-center transition-opacity duration-300">
              <Move className="h-4 w-4 mr-2" />
              Scroll to zoom, drag to move when zoomed
            </div>
          )}
          <img
            ref={imageRef}
            src={imageUrl || "/placeholder.svg"}
            alt={alt}
            className="max-w-full max-h-full object-contain transition-transform duration-300"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px) rotate(${rotation}deg)`,
            }}
            draggable={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

