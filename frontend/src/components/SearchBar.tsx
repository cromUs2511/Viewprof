/** Search/filter bar component */
import { useCallback, useRef, useEffect } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
  placeholder?: string
  debounceMs?: number
  className?: string
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search...',
  debounceMs = 300,
  className = '',
}: SearchBarProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    if (onSubmit) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => onSubmit(), debounceMs)
    }
  }, [onChange, onSubmit, debounceMs])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSubmit) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      onSubmit()
    }
  }, [onSubmit])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div className={`relative ${className}`}>
      <label htmlFor="search-input" className="sr-only">Search</label>
      <input
        ref={inputRef}
        id="search-input"
        type="search"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="input pl-10 pr-4"
        aria-describedby="search-hint"
      />
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-mapua-gray pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <span id="search-hint" className="sr-only">Press Enter to search or wait for auto-search</span>
    </div>
  )
}