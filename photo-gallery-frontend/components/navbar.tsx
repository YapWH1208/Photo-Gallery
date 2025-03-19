"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Camera, Heart, ImageIcon, Layers, Menu, Upload, X } from "lucide-react"
import { useState, useEffect } from "react"
import { useMobile } from "@/hooks/use-mobile"
import { motion } from "framer-motion"

export default function Navbar() {
  const pathname = usePathname()
  const isMobile = useMobile()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const routes = [
    {
      href: "/",
      label: "Themes",
      icon: <Layers className="mr-2 h-4 w-4" />,
      active: pathname === "/",
    },
    {
      href: "/collections",
      label: "Collections",
      icon: <ImageIcon className="mr-2 h-4 w-4" />,
      active: pathname === "/collections" || pathname.startsWith("/collections/"),
    },
    {
      href: "/favorites",
      label: "Favorites",
      icon: <Heart className="mr-2 h-4 w-4" />,
      active: pathname === "/favorites",
    },
    {
      href: "/upload",
      label: "Upload",
      icon: <Upload className="mr-2 h-4 w-4" />,
      active: pathname === "/upload",
    },
    {
      href: "/manage",
      label: "Manage",
      icon: <Camera className="mr-2 h-4 w-4" />,
      active: pathname === "/manage",
    },
  ]

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header
      className={cn("sticky top-0 z-50 w-full transition-all duration-300 navbar-glass", scrolled ? "shadow-md" : "")}
    >
      <div className="container flex h-16 items-center justify-between">
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <Camera className="h-5 w-5 text-white absolute" />
            </div>
            <span className="font-bold text-lg gradient-text">Immersive Gallery</span>
          </Link>
        </motion.div>

        {isMobile ? (
          <>
            <Button variant="ghost" size="icon" onClick={toggleMenu} className="relative">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            {isMenuOpen && (
              <motion.div
                className="fixed inset-0 top-16 z-50 bg-background/95 backdrop-blur-md"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <nav className="container grid gap-2 p-4">
                  {routes.map((route, index) => (
                    <motion.div
                      key={route.href}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <Link href={route.href} onClick={() => setIsMenuOpen(false)}>
                        <Button
                          variant={route.active ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-start",
                            route.active && "bg-gradient-to-r from-blue-500 to-indigo-600",
                          )}
                        >
                          {route.icon}
                          {route.label}
                        </Button>
                      </Link>
                    </motion.div>
                  ))}
                  <motion.div
                    className="mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    <ModeToggle />
                  </motion.div>
                </nav>
              </motion.div>
            )}
          </>
        ) : (
          <motion.nav
            className="flex items-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {routes.map((route, index) => (
              <motion.div
                key={route.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link
                  href={route.href}
                  className={cn(
                    "flex items-center text-sm font-medium transition-colors hover:text-primary relative group",
                    route.active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {route.label}
                  {route.active && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></span>
                  )}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </motion.div>
            ))}
            <ModeToggle />
          </motion.nav>
        )}
      </div>
    </header>
  )
}

