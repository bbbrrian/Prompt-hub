'use client'

import React, { useRef } from 'react'
import './SpotlightCard.css'

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  spotlightColor?: `rgba(${number}, ${number}, ${number}, ${number})`
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  spotlightColor = 'rgba(0, 229, 255, 0.2)',
  onMouseMove,
  ...rest
}) => {
  const divRef = useRef<HTMLDivElement>(null)

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = e => {
    if (divRef.current) {
      const rect = divRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      divRef.current.style.setProperty('--mouse-x', `${x}px`)
      divRef.current.style.setProperty('--mouse-y', `${y}px`)
      divRef.current.style.setProperty('--spotlight-color', spotlightColor)
    }
    onMouseMove?.(e)
  }

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      className={`card-spotlight ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

export default SpotlightCard
