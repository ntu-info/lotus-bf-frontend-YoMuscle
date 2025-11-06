import { API_BASE } from '../api'
import { useEffect, useState, useRef } from 'react'

export function QueryBuilder({ query, setQuery }) {
  const [allTerms, setAllTerms] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)

  // Fetch all terms for autocomplete
  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const res = await fetch(`${API_BASE}/terms`)
        if (!res.ok) return
        const data = await res.json()
        setAllTerms(Array.isArray(data?.terms) ? data.terms : [])
      } catch (e) {
        console.error('Failed to fetch terms for autocomplete:', e)
      }
    }
    fetchTerms()
  }, [])

  // Sync inputValue with query prop
  useEffect(() => {
    setInputValue(query)
  }, [query])

  // Get current word being typed for autocomplete
  const getCurrentWord = (text, cursorPos) => {
    const beforeCursor = text.slice(0, cursorPos)
    const words = beforeCursor.split(/\s+/)
    const currentWord = words[words.length - 1]
    return currentWord
  }

  const handleInputChange = (e) => {
    const value = e.target.value
    setInputValue(value)
    setQuery(value)

    // Get cursor position and current word
    const cursorPos = e.target.selectionStart
    const currentWord = getCurrentWord(value, cursorPos)

    // Show suggestions if typing a word (not operator or coordinate)
    const operators = ['AND', 'OR', 'NOT', '(', ')']
    const isOperator = operators.includes(currentWord.toUpperCase())
    const isCoordinate = currentWord.startsWith('[')

    if (currentWord.length >= 2 && !isOperator && !isCoordinate) {
      const filtered = allTerms
        .filter(term => term.toLowerCase().includes(currentWord.toLowerCase()))
        .slice(0, 8)
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (term) => {
    const cursorPos = inputRef.current.selectionStart
    const beforeCursor = inputValue.slice(0, cursorPos)
    const afterCursor = inputValue.slice(cursorPos)
    
    const words = beforeCursor.split(/\s+/)
    words[words.length - 1] = term
    const newValue = words.join(' ') + afterCursor
    
    setInputValue(newValue)
    setQuery(newValue)
    setShowSuggestions(false)
    inputRef.current.focus()
  }

  const append = (token) => {
    const newQuery = inputValue ? `${inputValue} ${token}` : token
    setInputValue(newQuery)
    setQuery(newQuery)
  }

  const handleClear = () => {
    setInputValue('')
    setQuery('')
    setShowSuggestions(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      setShowSuggestions(false)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target) &&
        !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex flex-col gap-3 qb" style={{ position: 'relative' }}>
      {/* Header */}
      <div className="flex items-center">
        <div className="card__title">Query Builder</div>
      </div>

      {/* Input with autocomplete */}
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type to search terms, or build query: [-22,-4,18] AND emotion"
          className="qb__input w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring"
          style={{ width: "100%" }}
        />
        
        {/* Autocomplete suggestions */}
        {showSuggestions && (
          <div 
            ref={suggestionsRef}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 1000,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
            }}
          >
            {suggestions.map((term, idx) => (
              <div
                key={idx}
                onClick={() => handleSuggestionClick(term)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  borderBottom: idx < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                  color: 'var(--fg)',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {term}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Operators + Clear button */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: 'AND', onClick: () => append('AND') },
          { label: 'OR', onClick: () => append('OR') },
          { label: 'NOT', onClick: () => append('NOT') },
          { label: '(', onClick: () => append('(') },
          { label: ')', onClick: () => append(')') },
        ].map((b) => (
          <button
            key={b.label}
            onClick={b.onClick}
            className="rounded-xl border px-3 py-2 text-sm"
            style={{ 
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--fg)'
            }}
          >
            {b.label}
          </button>
        ))}
        <button
          onClick={handleClear}
          className="rounded-xl px-3 py-2 text-sm"
          style={{ 
            background: '#ef4444',
            color: '#fff',
            marginLeft: 'auto'
          }}
        >
          Clear
        </button>
      </div>

      {/* Current Query Display */}
      {inputValue && (
        <div style={{
          padding: '8px 12px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          fontSize: '13px',
          color: 'var(--muted)',
          fontFamily: 'monospace'
        }}>
          <strong style={{ color: 'var(--fg)' }}>Current Query:</strong> {inputValue}
        </div>
      )}
    </div>
  );
}
