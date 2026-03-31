'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiHome, FiUser, FiClipboard, FiPlay, FiTrendingUp, FiZap, FiCompass, FiSun, FiMoon, FiBook, FiSearch } from 'react-icons/fi'
import { useWorkoutLogStore } from '../../store/workoutLogStore'
import { useUserStore } from '../../store/userStore'

const navItems = [
  { href: '/', label: 'Dashboard', icon: FiHome },
  { href: '/get-started', label: 'Create Plan', icon: FiCompass },
  { href: '/plans', label: 'Plans', icon: FiClipboard },
  { href: '/workout', label: 'Workout', icon: FiPlay },
  { href: '/exercises', label: 'Exercises', icon: FiSearch },
  { href: '/progress', label: 'Progress', icon: FiTrendingUp },
  { href: '/history', label: 'History', icon: FiBook },
]

const bottomNavItem = { href: '/profile', label: 'Profile', icon: FiUser }

export function Sidebar() {
  const pathname = usePathname()
  const { currentWorkout } = useWorkoutLogStore()
  const { theme, toggleTheme } = useUserStore()

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-background-card border-r border-white/5 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-white/5">
        <img src="/logo.svg" alt="GymForge" className="w-8 h-8" />
        <span className="font-display font-bold text-lg gradient-text">GymForge</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3">
        <ul className="space-y-1">
          {navItems.map(item => {
            const isActive = item.href === '/'
              ? pathname === '/'
              : item.href === '/plans'
                ? pathname === '/plans' || pathname?.startsWith('/plans/')
                : pathname === item.href
            const isWorkout = item.href === '/workout'

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 border
                    ${isActive
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/5 border-transparent'
                    }
                  `}
                >
                  <item.icon className={`text-lg ${isActive ? 'text-primary' : ''}`} />
                  <span>{item.label}</span>
                  {isWorkout && currentWorkout && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-success animate-pulse" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Profile + Footer */}
      <div className="border-t border-white/5">
        {/* Profile link */}
        <div className="px-3 pt-3 pb-1">
          <Link
            href={bottomNavItem.href}
            className={`
              flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 border
              ${pathname === bottomNavItem.href
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5 border-transparent'
              }
            `}
          >
            <bottomNavItem.icon className={`text-lg ${pathname === bottomNavItem.href ? 'text-primary' : ''}`} />
            <span>{bottomNavItem.label}</span>
          </Link>
        </div>
        {/* Theme toggle */}
        <div className="px-4 py-3 flex items-center justify-between">
          <p className="text-xs text-text-muted">GymForge</p>
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-text-muted hover:text-text-primary transition-all"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <FiSun size={14} /> : <FiMoon size={14} />}
          </button>
        </div>
      </div>
    </aside>
  )
}
