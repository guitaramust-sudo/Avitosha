import type { ReactNode } from 'react'

import './GamePageHeader.scss'

interface GamePageHeaderProps {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}

function GamePageHeader({
  action,
  description,
  eyebrow,
  title,
}: GamePageHeaderProps) {
  return (
    <header className="game-page-header">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  )
}

export default GamePageHeader
