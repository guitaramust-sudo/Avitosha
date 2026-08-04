import type { PropsWithChildren } from 'react'

import './AuthPageLayout.scss'

interface AuthPageLayoutProps extends PropsWithChildren {
  description: string
  eyebrow: string
  title: string
}

function AuthPageLayout({
  children,
  description,
  eyebrow,
  title,
}: AuthPageLayoutProps) {
  return (
    <main className="auth-page">
      <section className="auth-page__visual" aria-hidden="true">
        <div className="auth-page__brand">
          <span className="auth-page__logo">●</span>
          <strong>Авитоша</strong>
        </div>
        <div className="auth-page__message">
          <span>{eyebrow}</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="auth-page__orb auth-page__orb--one" />
        <div className="auth-page__orb auth-page__orb--two" />
        <div className="auth-page__orb auth-page__orb--three" />
      </section>

      <section className="auth-page__form-area">
        <div className="auth-page__form-card">{children}</div>
      </section>
    </main>
  )
}

export default AuthPageLayout
