'use client'

import React, { useState } from 'react'
import type { MuscleGroup } from '../../data/exercises'
import { getMuscleGroupLabel } from '../../data/exerciseUtils'

interface BodySVGProps {
  selectedMuscles: MuscleGroup[]
  onToggleMuscle: (muscle: MuscleGroup) => void
  view: 'front' | 'back'
}

interface MuscleZone {
  muscle: MuscleGroup
  paths: string[]
  label: { x: number; y: number }
}

// Front view muscle zones - stylised human figure paths
const FRONT_ZONES: MuscleZone[] = [
  {
    muscle: 'shoulders',
    paths: [
      // Left shoulder
      'M 72,95 Q 62,90 58,100 Q 56,108 60,115 L 75,110 Q 78,100 72,95',
      // Right shoulder
      'M 128,95 Q 138,90 142,100 Q 144,108 140,115 L 125,110 Q 122,100 128,95',
    ],
    label: { x: 58, y: 100 },
  },
  {
    muscle: 'chest',
    paths: [
      // Left pec
      'M 75,110 L 60,115 Q 62,135 75,140 L 97,135 L 97,110 Z',
      // Right pec
      'M 125,110 L 140,115 Q 138,135 125,140 L 103,135 L 103,110 Z',
    ],
    label: { x: 85, y: 125 },
  },
  {
    muscle: 'biceps',
    paths: [
      // Left bicep
      'M 58,115 Q 50,118 48,130 Q 46,145 50,160 L 58,158 Q 60,142 60,130 Z',
      // Right bicep
      'M 142,115 Q 150,118 152,130 Q 154,145 150,160 L 142,158 Q 140,142 140,130 Z',
    ],
    label: { x: 42, y: 138 },
  },
  {
    muscle: 'forearms',
    paths: [
      // Left forearm
      'M 50,160 L 46,162 Q 40,180 38,200 Q 37,210 40,215 L 50,212 Q 52,195 54,178 L 58,158 Z',
      // Right forearm
      'M 150,160 L 154,162 Q 160,180 162,200 Q 163,210 160,215 L 150,212 Q 148,195 146,178 L 142,158 Z',
    ],
    label: { x: 36, y: 190 },
  },
  {
    muscle: 'core',
    paths: [
      'M 82,140 L 75,142 Q 74,160 76,180 Q 78,195 82,200 L 100,202 L 118,200 Q 122,195 124,180 Q 126,160 125,142 L 118,140 L 103,135 L 97,135 Z',
    ],
    label: { x: 88, y: 170 },
  },
  {
    muscle: 'quads',
    paths: [
      // Left quad
      'M 76,200 Q 72,205 70,220 Q 68,240 66,260 Q 65,275 68,285 L 80,287 Q 84,275 86,260 Q 88,240 88,220 L 88,205 L 82,202 Z',
      // Right quad
      'M 124,200 Q 128,205 130,220 Q 132,240 134,260 Q 135,275 132,285 L 120,287 Q 116,275 114,260 Q 112,240 112,220 L 112,205 L 118,202 Z',
    ],
    label: { x: 63, y: 250 },
  },
  {
    muscle: 'calves',
    paths: [
      // Left calf (front - tibialis)
      'M 68,290 L 66,295 Q 64,315 63,335 Q 62,350 65,360 L 76,358 Q 78,345 79,330 Q 80,315 80,300 L 80,290 Z',
      // Right calf
      'M 132,290 L 134,295 Q 136,315 137,335 Q 138,350 135,360 L 124,358 Q 122,345 121,330 Q 120,315 120,300 L 120,290 Z',
    ],
    label: { x: 58, y: 330 },
  },
]

// Back view muscle zones
const BACK_ZONES: MuscleZone[] = [
  {
    muscle: 'traps',
    paths: [
      'M 82,85 Q 90,80 100,78 Q 110,80 118,85 L 120,100 L 115,105 L 100,108 L 85,105 L 80,100 Z',
    ],
    label: { x: 86, y: 92 },
  },
  {
    muscle: 'shoulders',
    paths: [
      'M 72,95 Q 62,90 58,100 Q 56,108 60,115 L 75,110 Q 78,100 72,95',
      'M 128,95 Q 138,90 142,100 Q 144,108 140,115 L 125,110 Q 122,100 128,95',
    ],
    label: { x: 55, y: 100 },
  },
  {
    muscle: 'back',
    paths: [
      'M 80,105 L 75,110 Q 70,125 72,140 L 76,160 Q 78,175 80,185 L 100,188 L 120,185 Q 122,175 124,160 L 128,140 Q 130,125 125,110 L 120,105 L 100,108 Z',
    ],
    label: { x: 87, y: 145 },
  },
  {
    muscle: 'triceps',
    paths: [
      'M 58,115 Q 50,118 48,130 Q 46,145 50,160 L 58,158 Q 60,142 60,130 Z',
      'M 142,115 Q 150,118 152,130 Q 154,145 150,160 L 142,158 Q 140,142 140,130 Z',
    ],
    label: { x: 42, y: 138 },
  },
  {
    muscle: 'forearms',
    paths: [
      'M 50,160 L 46,162 Q 40,180 38,200 Q 37,210 40,215 L 50,212 Q 52,195 54,178 L 58,158 Z',
      'M 150,160 L 154,162 Q 160,180 162,200 Q 163,210 160,215 L 150,212 Q 148,195 146,178 L 142,158 Z',
    ],
    label: { x: 36, y: 190 },
  },
  {
    muscle: 'glutes',
    paths: [
      'M 80,188 Q 76,195 75,205 Q 76,215 82,218 L 100,220 L 118,218 Q 124,215 125,205 Q 124,195 120,188 L 100,190 Z',
    ],
    label: { x: 86, y: 205 },
  },
  {
    muscle: 'hamstrings',
    paths: [
      'M 75,220 Q 72,230 70,245 Q 68,260 66,275 Q 65,285 68,290 L 80,292 Q 84,278 86,260 Q 88,242 88,225 L 82,220 Z',
      'M 125,220 Q 128,230 130,245 Q 132,260 134,275 Q 135,285 132,290 L 120,292 Q 116,278 114,260 Q 112,242 112,225 L 118,220 Z',
    ],
    label: { x: 63, y: 255 },
  },
  {
    muscle: 'calves',
    paths: [
      'M 68,295 L 66,300 Q 64,318 63,336 Q 62,350 65,360 L 76,358 Q 78,345 79,330 Q 80,318 80,305 L 80,295 Z',
      'M 132,295 L 134,300 Q 136,318 137,336 Q 138,350 135,360 L 124,358 Q 122,345 121,330 Q 120,318 120,305 L 120,295 Z',
    ],
    label: { x: 58, y: 330 },
  },
]

// Human body outline
const BODY_OUTLINE_FRONT = 'M 100,20 Q 88,20 84,30 Q 80,40 80,50 Q 80,60 84,68 Q 88,75 95,78 Q 85,80 78,85 Q 70,90 65,95 Q 58,88 52,95 Q 46,102 44,115 Q 42,130 44,148 Q 46,158 50,162 Q 44,168 40,185 Q 36,200 36,212 Q 36,218 38,220 Q 40,222 44,218 L 50,214 Q 54,196 58,160 L 60,140 L 62,120 L 72,105 Q 74,125 75,145 L 76,185 Q 74,200 72,210 Q 70,225 68,245 Q 66,265 65,280 Q 64,295 63,310 Q 62,330 62,345 Q 62,355 64,362 Q 66,368 72,370 L 80,370 Q 82,368 82,362 Q 82,355 80,345 Q 80,330 80,310 Q 80,295 82,280 Q 84,265 88,245 L 92,220 L 100,215 L 108,220 Q 112,245 116,265 Q 118,280 120,295 Q 120,310 120,330 Q 120,345 118,355 Q 118,362 118,368 Q 120,370 128,370 L 136,368 Q 138,362 138,350 Q 138,335 137,315 Q 136,295 135,280 Q 134,265 132,245 Q 130,225 128,210 Q 126,200 124,185 L 125,145 Q 126,125 128,105 L 138,120 L 140,140 Q 142,158 146,178 Q 150,196 154,214 L 156,218 Q 160,222 162,220 Q 164,218 164,212 Q 164,200 160,185 Q 156,168 150,162 Q 154,158 156,148 Q 158,130 156,115 Q 154,102 148,95 Q 142,88 135,95 Q 130,90 122,85 Q 115,80 105,78 Q 112,75 116,68 Q 120,60 120,50 Q 120,40 116,30 Q 112,20 100,20 Z'

const BODY_OUTLINE_BACK = BODY_OUTLINE_FRONT // Same silhouette for back view

export function BodySVG({ selectedMuscles, onToggleMuscle, view }: BodySVGProps) {
  const [hoveredMuscle, setHoveredMuscle] = useState<MuscleGroup | null>(null)
  const zones = view === 'front' ? FRONT_ZONES : BACK_ZONES
  const outline = view === 'front' ? BODY_OUTLINE_FRONT : BODY_OUTLINE_BACK

  const getFill = (muscle: MuscleGroup) => {
    if (selectedMuscles.includes(muscle)) return 'rgba(0, 212, 255, 0.45)'
    if (hoveredMuscle === muscle) return 'rgba(0, 212, 255, 0.2)'
    return 'rgba(255, 255, 255, 0.06)'
  }

  const getStroke = (muscle: MuscleGroup) => {
    if (selectedMuscles.includes(muscle)) return 'rgba(0, 212, 255, 0.8)'
    if (hoveredMuscle === muscle) return 'rgba(0, 212, 255, 0.4)'
    return 'rgba(255, 255, 255, 0.1)'
  }

  return (
    <svg viewBox="0 0 200 390" className="w-full h-auto max-h-[60vh] md:max-h-[70vh]" xmlns="http://www.w3.org/2000/svg">
      {/* Body outline */}
      <path
        d={outline}
        fill="rgba(255,255,255,0.02)"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1"
      />

      {/* Muscle zones */}
      {zones.map(zone => (
        <g
          key={zone.muscle}
          onClick={() => onToggleMuscle(zone.muscle)}
          onMouseEnter={() => setHoveredMuscle(zone.muscle)}
          onMouseLeave={() => setHoveredMuscle(null)}
          className="cursor-pointer transition-all duration-200 outline-none focus:outline-none"
          role="button"
          aria-label={getMuscleGroupLabel(zone.muscle)}
          tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onToggleMuscle(zone.muscle) }}
        >
          {/* Invisible wider hit area for easier tapping on mobile */}
          {zone.paths.map((path, i) => (
            <path key={`hit-${i}`} d={path} fill="transparent" stroke="transparent" strokeWidth="12" className="cursor-pointer" />
          ))}
          {zone.paths.map((path, i) => (
            <path
              key={i}
              d={path}
              fill={getFill(zone.muscle)}
              stroke={getStroke(zone.muscle)}
              strokeWidth={selectedMuscles.includes(zone.muscle) ? 1.5 : 0.8}
              className="transition-all duration-200 pointer-events-none"
              style={selectedMuscles.includes(zone.muscle) ? {
                filter: 'drop-shadow(0 0 6px rgba(0, 212, 255, 0.3))'
              } : undefined}
            />
          ))}
          {/* Label on hover or selected */}
          {(hoveredMuscle === zone.muscle || selectedMuscles.includes(zone.muscle)) && (
            <text
              x={zone.label.x}
              y={zone.label.y}
              fontSize="7"
              fontWeight="bold"
              fill="#00d4ff"
              textAnchor="start"
              pointerEvents="none"
              className="select-none"
            >
              {getMuscleGroupLabel(zone.muscle)}
            </text>
          )}
        </g>
      ))}

      {/* View label */}
      <text x="100" y="385" textAnchor="middle" fontSize="8" fill="#475569" className="select-none">
        {view === 'front' ? 'FRONT' : 'BACK'}
      </text>
    </svg>
  )
}
