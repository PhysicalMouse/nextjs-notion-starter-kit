import type * as types from 'notion-types'
import cs from 'classnames'
import * as React from 'react'
import { Breadcrumbs, useNotionContext } from 'react-notion-x'

import { isSearchEnabled, navigationLinks } from '@/lib/config'
import { MoonIcon } from '@/lib/icons/moon'
import { SunIcon } from '@/lib/icons/sun'
import { useDarkMode } from '@/lib/use-dark-mode'

import searchStyles from './SearchModal.module.css'
import { SearchModal } from './SearchModal'
import styles from './styles.module.css'

function ToggleThemeButton() {
  const [hasMounted, setHasMounted] = React.useState(false)
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  const onToggleTheme = React.useCallback(() => {
    toggleDarkMode()
  }, [toggleDarkMode])

  return (
    <div
      className={cs('breadcrumb', 'button', !hasMounted && styles.hidden)}
      onClick={onToggleTheme}
    >
      {hasMounted && isDarkMode ? <MoonIcon /> : <SunIcon />}
    </div>
  )
}

function SearchButton() {
  const [isOpen, setIsOpen] = React.useState(false)

  const onOpen = React.useCallback(() => setIsOpen(true), [])
  const onClose = React.useCallback(() => setIsOpen(false), [])

  return (
    <>
      <div
        className={cs(
          'breadcrumb',
          'button',
          searchStyles.searchButton
        )}
        role='button'
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onOpen()
          }
        }}
      >
        <svg
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          aria-hidden='true'
        >
          <circle cx='11' cy='11' r='8' />
          <line x1='21' y1='21' x2='16.65' y2='16.65' />
        </svg>
        <span>搜索</span>
      </div>

      {isOpen && <SearchModal onClose={onClose} />}
    </>
  )
}

export function NotionPageHeader({
  block
}: {
  block: types.CollectionViewPageBlock | types.PageBlock
}) {
  const { components, mapPageUrl } = useNotionContext()

  return (
    <header className='notion-header'>
      <div className='notion-nav-header'>
        <Breadcrumbs block={block} rootOnly={true} />

        <div className='notion-nav-header-rhs breadcrumbs'>
          {navigationLinks
            ?.map((link, index) => {
              if (!link?.pageId && !link?.url) {
                return null
              }

              if (link.pageId) {
                return (
                  <components.PageLink
                    href={mapPageUrl(link.pageId)}
                    key={index}
                    className={cs(styles.navLink, 'breadcrumb', 'button')}
                  >
                    {link.title}
                  </components.PageLink>
                )
              } else {
                return (
                  <components.Link
                    href={link.url}
                    key={index}
                    className={cs(styles.navLink, 'breadcrumb', 'button')}
                  >
                    {link.title}
                  </components.Link>
                )
              }
            })
            .filter(Boolean)}

          <ToggleThemeButton />

          {isSearchEnabled && <SearchButton />}
        </div>
      </div>
    </header>
  )
}
