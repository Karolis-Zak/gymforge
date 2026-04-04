'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FiHome, FiUser, FiClipboard, FiPlay, FiCompass, FiBook } from 'react-icons/fi'
import { useWorkoutLogStore } from '../../store/workoutLogStore'

const navItems = [
  { href: '/', label: 'Home', icon: FiHome },
  { href: '/get-started', label: 'Create', icon: FiCompass },
  { href: '/plans', label: 'Plans', icon: FiClipboard },
  { href: '/exercises', label: 'Exercises', icon: FiBook },
  { href: '/workout', label: 'Workout', icon: FiPlay },
  { href: '/profile', label: 'Profile', icon: FiUser },
]

export function BottomNav() {
  const pathname = usePathname()
  const { currentWorkout } = useWorkoutLogStore()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-background-card/90 backdrop-blur-xl border-t border-white/5">
      <ul className="flex justify-around items-center h-16 px-2">
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
                  flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors duration-200
                  ${isActive ? 'text-primary' : 'text-text-muted hover:text-text-secondary'}
                `}
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
      </ul>
    </nav>
  )
}
