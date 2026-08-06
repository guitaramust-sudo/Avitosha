import { type ReactNode, useId, useState } from 'react'

import './CollapsibleSection.scss'

interface CollapsibleSectionProps {
  as?: 'article' | 'aside'
  children: ReactNode
  className: string
  title: string
  tourId?: string
}

function CollapsibleSection({
  as: Element = 'article',
  children,
  className,
  title,
  tourId,
}: CollapsibleSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const contentId = useId()

  return (
    <Element
      className={`${className} collapsible-section ${isCollapsed ? 'is-collapsed' : ''}`}
      data-tour={tourId}
    >
      <button
        className="collapsible-section__toggle"
        type="button"
        aria-controls={contentId}
        aria-expanded={!isCollapsed}
        aria-label={`${isCollapsed ? 'Развернуть' : 'Свернуть'}: ${title}`}
        title={isCollapsed ? 'Развернуть' : 'Свернуть'}
        onClick={() => setIsCollapsed((current) => !current)}
      >
        <span aria-hidden="true">⌃</span>
      </button>

      {isCollapsed ? (
        <h2 className="collapsible-section__summary">{title}</h2>
      ) : (
        <div className="collapsible-section__content" id={contentId}>
          {children}
        </div>
      )}
    </Element>
  )
}

export default CollapsibleSection
