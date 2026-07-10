import cs from 'classnames'
import { useRouter } from 'next/router'
import * as React from 'react'
import { createPortal } from 'react-dom'

import { api } from '@/lib/config'
import { type SearchIndex, type SearchIndexItem } from '@/lib/get-search-index'

import styles from './SearchModal.module.css'

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
  )
}

function filterItems(
  items: SearchIndexItem[],
  query: string,
  selectedTags: string[]
): SearchIndexItem[] {
  const q = query.trim().toLowerCase()

  return items.filter((item) => {
    // must contain every selected tag (AND semantics)
    if (selectedTags.length) {
      const itemTags = item.tags.map((tag) => tag.toLowerCase())
      const hasAllTags = selectedTags.every((tag) =>
        itemTags.includes(tag.toLowerCase())
      )
      if (!hasAllTags) return false
    }

    if (!q) return true

    const haystack = [item.title, item.description, ...item.tags]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(q)
  })
}

export function SearchModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [index, setIndex] = React.useState<SearchIndex | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState('')
  const [selectedTags, setSelectedTags] = React.useState<string[]>([])
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [mounted, setMounted] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // only render the portal on the client (document is unavailable on the server)
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // focus the input once the portal content is actually rendered
  React.useEffect(() => {
    if (mounted) {
      inputRef.current?.focus()
    }
  }, [mounted])

  // load the search index once when the modal mounts (event-driven, not polling)
  React.useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(api.searchIndex)
        if (!res.ok) throw new Error(res.statusText)
        const data = (await res.json()) as SearchIndex
        if (!cancelled) {
          setIndex(data)
          setIsLoading(false)
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load')
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const results = React.useMemo(() => {
    if (!index) return []
    return filterItems(index.items, query, selectedTags)
  }, [index, query, selectedTags])

  React.useEffect(() => {
    setActiveIndex(0)
  }, [query, selectedTags])

  const toggleTag = React.useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }, [])

  const goToResult = React.useCallback(
    (item: SearchIndexItem) => {
      onClose()
      void router.push(item.url)
    },
    [onClose, router]
  )

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, results.length - 1))
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (event.key === 'Enter') {
        const item = results[activeIndex]
        if (item) goToResult(item)
      }
    },
    [onClose, results, activeIndex, goToResult]
  )

  if (!mounted) {
    return null
  }

  return createPortal(
    <div
      className={styles.overlay}
      onClick={onClose}
      role='dialog'
      aria-modal='true'
      aria-label='Search'
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className={styles.searchHeader}>
          <SearchIcon className={styles.searchIcon} />
          <input
            ref={inputRef}
            className={styles.input}
            type='text'
            placeholder='Search posts, tags...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label='Search keywords'
          />
          <button
            type='button'
            className={styles.closeButton}
            onClick={onClose}
          >
            Esc
          </button>
        </div>

        {index && index.tags.length > 0 && (
          <div className={styles.tagsSection}>
            <div className={styles.tagsLabel}>Filter by tag</div>
            <div className={styles.tagList}>
              {index.tags.map((tag) => (
                <button
                  type='button'
                  key={tag}
                  className={cs(
                    styles.tag,
                    selectedTags.includes(tag) && styles.tagActive
                  )}
                  onClick={() => toggleTag(tag)}
                  aria-pressed={selectedTags.includes(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.results}>
          {isLoading ? (
            <div className={styles.status}>Loading search index...</div>
          ) : error ? (
            <div className={styles.status}>Failed to load: {error}</div>
          ) : results.length === 0 ? (
            <div className={styles.status}>No matching results found</div>
          ) : (
            results.map((item, i) => (
              <a
                key={item.pageId}
                className={cs(
                  styles.resultItem,
                  i === activeIndex && styles.resultItemActive
                )}
                onClick={(e) => {
                  e.preventDefault()
                  goToResult(item)
                }}
                onMouseEnter={() => setActiveIndex(i)}
                href={item.url}
              >
                <div className={styles.resultTitle}>{item.title}</div>
                {item.description && (
                  <div className={styles.resultDescription}>
                    {item.description}
                  </div>
                )}
                {item.tags.length > 0 && (
                  <div className={styles.resultTags}>
                    {item.tags.map((tag) => (
                      <span key={tag} className={styles.resultTag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </a>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
