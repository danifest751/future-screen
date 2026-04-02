"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/90 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-sm flex items-center justify-center">
            <div className="w-3 h-3 bg-background rounded-sm" />
          </div>
          <span className="text-foreground font-semibold tracking-tight text-sm uppercase">
            Future Screen
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            ["Оборудование", "#equipment"],
            ["Направления", "#directions"],
            ["О компании", "#about"],
            ["Кейсы", "#cases"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm tracking-wide"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-4">
          <span className="text-muted-foreground text-sm">+7 (343) 000-00-00</span>
          <Link
            href="#contact"
            className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium rounded-sm hover:bg-primary/90 transition-colors"
          >
            Обсудить проект
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Меню"
        >
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-md border-b border-border px-6 py-4 flex flex-col gap-4">
          {[
            ["Оборудование", "#equipment"],
            ["Направления", "#directions"],
            ["О компании", "#about"],
            ["Кейсы", "#cases"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setIsMenuOpen(false)}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              {label}
            </Link>
          ))}
          <Link
            href="#contact"
            onClick={() => setIsMenuOpen(false)}
            className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium rounded-sm text-center"
          >
            Обсудить проект
          </Link>
        </div>
      )}
    </header>
  )
}
