'use client'

import React from 'react'
import { FiZap, FiArrowRight } from 'react-icons/fi'

interface Step0WelcomeProps {
  onNext: () => void
}

export function Step0Welcome({ onNext }: Step0WelcomeProps) {
  return (
    <div className="text-center py-10 animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-gradient-mixed flex items-center justify-center mx-auto mb-6">
        <FiZap className="text-white text-3xl" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-display font-bold text-text-primary mb-3">
        Let&apos;s Build Your <span className="gradient-text">Perfect Plan</span>
      </h1>
      <p className="text-text-secondary text-base sm:text-lg mb-2 max-w-md mx-auto">
        Answer a few questions and we&apos;ll create a personalized training program just for you.
      </p>
      <p className="text-text-muted text-sm mb-8">Takes about 5 minutes</p>
      <button onClick={onNext} className="h-14 px-10 bg-gradient-primary text-white text-lg font-display font-bold rounded-2xl shadow-glow hover:shadow-[0_0_40px_rgba(0,212,255,0.3)] active:scale-[0.97] transition-all duration-200">
        Let&apos;s Go <FiArrowRight className="inline ml-2" />
      </button>
    </div>
  )
}
