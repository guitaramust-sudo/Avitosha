import { useEffect, useRef, useState } from 'react'

import { useLogoutMutation } from '../../hooks/useLogoutMutation'

import './ProfileMenu.scss'

interface ProfileMenuProps {
  email?: string
}

function ProfileMenu({ email }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const logoutMutation = useLogoutMutation()
  const userInitial = email?.trim().charAt(0).toUpperCase() || '?'

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !menuRef.current?.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  const handleLogout = () => {
    setIsOpen(false)
    logoutMutation.mutate()
  }

  return (
    <div className="profile-menu" ref={menuRef}>
      <button
        className="profile-menu__trigger"
        type="button"
        aria-label={email ? `Открыть профиль ${email}` : 'Открыть профиль'}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="profile-menu-popup"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        {userInitial}
      </button>

      {isOpen && (
        <div
          className="profile-menu__popup"
          id="profile-menu-popup"
          role="menu"
        >
          {email && <span className="profile-menu__email">{email}</span>}
          <button
            className="profile-menu__logout"
            type="button"
            role="menuitem"
            disabled={logoutMutation.isPending}
            onClick={handleLogout}
          >
            <span aria-hidden="true">↪</span>
            {logoutMutation.isPending ? 'Выходим…' : 'Выйти из аккаунта'}
          </button>
        </div>
      )}
    </div>
  )
}

export default ProfileMenu
