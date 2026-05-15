'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FiHome, FiUser, FiClipboard, FiPlay, FiSearch, FiGrid,
  FiCompass, FiTarget, FiTrendingUp, FiClock, FiSun, FiMoon, FiX,
} from 'react-icons/fi'
import type { IconType } from 'react-icons'
import { useWorkoutLogStore } from '../../store/workoutLogStore'
import { useUserStore } from '../../store/userStore'

interface NavItem {
  href: string
  label: string
  icon: IconType
}

// The 4 most-used destinations live directly in the bar.
const primaryItems: NavItem[] = [
  { href: '/', label: 'Home', icon: FiHome },
  { href: '/plans', label: 'Plans', icon: FiClipboard },
  { href: '/workout', label: 'Workout', icon: FiPlay },
  { href: '/exercises', label: 'Exercises', icon: FiSearch },
]

// Everything else is reachable from the "More" sheet.
const moreItems: NavItem[] = [
  { href: '/get-started', label: 'Create Plan', icon: FiCompass },
  { href: '/abs', label: 'Abs Builder', icon: FiTarget },
  { href: '/progress', label: 'Progress', icon: FiTrendingUp },
  { href: '/history', label: 'History', icon: FiClock },
  { href: '/profile', label: 'Profile', icon: FiUser },
]

function isItemActive(href: string, pathname: string | null): boolean {
  if (href === '/') return pathname === '/'
  if (href === '/plans') return pathname === '/plans' || !!pathname?.startsWith('/plans/')
  return pathname === href
}

export function BottomNav() {
  const pathname = usePathname()
  const currentWorkout = useWorkoutLogStore(s => s.currentWorkout)
  const theme = useUserStore(s => s.theme)
  const toggleTheme = useUserStore(s => s.toggleTheme)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreBtnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close the sheet whenever the route changes.
  useEffect(() => { setMoreOpen(false) }, [pathname])

  // While the sheet is open: lock body scroll, move focus into the dialog,
  // trap Tab within it, and support Escape — then restore both on close.
  useEffect(() => {
    if (!moreOpen) return
    const prevOverflow = document.body.style.overflow
    const trigger = moreBtnRef.current
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMoreOpen(false); return }
      if (e.key === 'Tab' && panelRef.current) {
        const items = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
        if (items.length === 0) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    window.addEventListener('keydown', onKey)
    // Move focus into the sheet (first focusable = the close button).
    panelRef.current?.querySelector<HTMLElement>('button, a[href]')?.focus()

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
      trigger?.focus()
    }
  }, [moreOpen])

  const isMoreActive = moreItems.some(item => isItemActive(item.href, pathname))

  return (
    <>
      {/* "More" bottom sheet */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
          />
          {/* Panel */}
          <div
            ref={panelRef}
            className="absolute bottom-0 left-0 right-0 bg-background-card border-t border-white/10 rounded-t-2xl shadow-2xl animate-slide-up"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
            role="dialog"
            aria-modal="true"
            aria-label="More navigation"
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h2 className="text-sm font-display font-bold text-text-primary">More</h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Close menu"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-muted"
              >
                <FiX size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 px-4 pb-2">
              {moreItems.map(item => {
                const active = isItemActive(item.href, pathname)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl border transition-colors
                      ${active
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'text-text-secondary border-white/5 hover:bg-white/5'
                      }`}
                  >
                    <item.icon className="text-xl" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* Theme toggle */}
            <div className="px-4 pt-1 pb-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary"
              >
                <span className="text-sm font-medium">
                  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </span>
                {theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-background-card/90 backdrop-blur-xl border-t border-white/5"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <ul className="flex justify-around items-center h-16 px-2">
          {primaryItems.map(item => {
            const active = isItemActive(item.href, pathname)
            const isWorkout = item.href === '/workout'
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors duration-200
                    ${active ? 'text-primary' : 'text-text-muted hover:text-text-secondary'}`}
                >
                  <span className="relative">
                    <item.icon className="text-lg" />
                    {isWorkout && currentWorkout && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-success animate-pulse" />
                    )}
                  </span>
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              </li>
            )
          })}

          {/* "More" — opens the sheet with the remaining destinations */}
          <li>
            <button
              ref={moreBtnRef}
              type="button"
              onClick={() => setMoreOpen(o => !o)}
              aria-expanded={moreOpen}
              aria-label="More navigation"
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors duration-200
                ${moreOpen || isMoreActive ? 'text-primary' : 'text-text-muted hover:text-text-secondary'}`}
            >
              <FiGrid className="text-lg" />
              <span className="text-xs font-medium">More</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  )
}
