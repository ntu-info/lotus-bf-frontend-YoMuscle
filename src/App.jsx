
import { useCallback, useEffect, useRef, useState } from 'react'
import { Terms } from './components/Terms'
import { QueryBuilder } from './components/QueryBuilder'
import { Studies } from './components/Studies'
import { NiiViewer } from './components/NiiViewer'
import { useUrlQueryState } from './hooks/useUrlQueryState'
import './App.css'

export default function App () {
  const [query, setQuery] = useUrlQueryState('q')

  const handlePickTerm = useCallback((t) => {
    setQuery((q) => (q ? `${q} ${t}` : t))
  }, [setQuery])

  // --- resizable panes state ---
  const gridRef = useRef(null)
  const [sizes, setSizes] = useState([28, 44, 28]) // [left, middle, right]
  const MIN_PX = 240

  // restore saved pane sizes
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ui.sizes')
      if (saved) {
        const s = JSON.parse(saved)
        if (Array.isArray(s) && s.length === 3) setSizes(s)
      }
    } catch {}
  }, [])

  // persist sizes on change
  useEffect(() => {
    try { localStorage.setItem('ui.sizes', JSON.stringify(sizes)) } catch {}
  }, [sizes])

  const startDrag = (which, e) => {
    e.preventDefault()
    const startX = e.clientX
    const rect = gridRef.current.getBoundingClientRect()
    const total = rect.width
    const curPx = sizes.map(p => (p / 100) * total)

    const onMouseMove = (ev) => {
      const dx = ev.clientX - startX
      if (which === 0) {
        let newLeft = curPx[0] + dx
        let newMid = curPx[1] - dx
        if (newLeft < MIN_PX) { newMid -= (MIN_PX - newLeft); newLeft = MIN_PX }
        if (newMid < MIN_PX) { newLeft -= (MIN_PX - newMid); newMid = MIN_PX }
        const s0 = (newLeft / total) * 100
        const s1 = (newMid / total) * 100
        const s2 = 100 - s0 - s1
        setSizes([s0, s1, Math.max(s2, 0)])
      } else {
        let newMid = curPx[1] + dx
        let newRight = curPx[2] - dx
        if (newMid < MIN_PX) { newRight -= (MIN_PX - newMid); newMid = MIN_PX }
        if (newRight < MIN_PX) { newMid -= (MIN_PX - newRight); newRight = MIN_PX }
        const s1 = (newMid / total) * 100
        const s2 = (newRight / total) * 100
        const s0 = (curPx[0] / total) * 100
        setSizes([s0, s1, Math.max(s2, 0)])
      }
    }
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div className="app">
      {/* Dark theme styling overrides */}
      <style>{`
        :root {
          --primary-600: #3b82f6;
          --primary-700: #2563eb;
          --primary-800: #1e40af;
          --border: #333333;
          --bg-card: #1e1e1e;
          --bg-elevated: #1a1a1a;
          --fg: #e5e5e5;
          --fg-bright: #ffffff;
          --muted: #a0a0a0;
        }
        
        .app { 
          padding-right: 0 !important; 
          background: var(--bg) !important;
          color: var(--fg) !important;
        }
        
        .app__grid { 
          width: 100%; 
          max-width: 100%; 
        }
        
        .app__header {
          background: var(--bg-card);
          padding: 16px 18px;
          border-radius: 12px;
          border: 1px solid var(--border);
        }
        
        .app__title {
          color: var(--fg-bright);
        }
        
        .app__subtitle {
          color: var(--muted);
        }
        
        .card input[type="text"],
        .card input[type="search"],
        .card input[type="number"],
        .card select,
        .card textarea {
          width: 100% !important;
          max-width: 100% !important;
          display: block;
          background: var(--bg-elevated) !important;
          color: var(--fg) !important;
          border: 1px solid var(--border) !important;
        }
        
        .card input:focus,
        .card select:focus,
        .card textarea:focus {
          border-color: var(--primary-600) !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
        }
        
        /* Button styling */
        .card button,
        .card [role="button"],
        .card .btn,
        .card .button {
          font-size: 13px !important;
          padding: 7px 12px !important;
          border-radius: 8px !important;
          line-height: 1.2 !important;
          background: var(--primary-600) !important;
          color: #fff !important;
          border: none !important;
          transition: background 0.2s ease !important;
        }
        
        .card button:hover,
        .card [role="button"]:hover,
        .card .btn:hover,
        .card .button:hover {
          background: var(--primary-700) !important;
        }
        
        .card button:active,
        .card [role="button"]:active,
        .card .btn:active,
        .card .button:active {
          background: var(--primary-800) !important;
        }
        
        .card button:disabled,
        .card [aria-disabled="true"] {
          background: var(--border-light) !important;
          opacity: 0.5 !important;
          cursor: not-allowed !important;
        }
        
        /* Canvas styling for dark theme */
        canvas {
          border-color: var(--border) !important;
          background: var(--bg-elevated) !important;
        }
        
        /* Tables */
        table {
          color: var(--fg) !important;
        }
        
        thead {
          background: var(--bg-elevated) !important;
          color: var(--fg-bright) !important;
        }
        
        tbody tr {
          border-bottom: 1px solid var(--border) !important;
        }
        
        tbody tr:hover {
          background: rgba(59, 130, 246, 0.1) !important;
        }
      `}</style>

      <header className="app__header">
        <h1 className="app__title">LoTUS-BF</h1>
        <div className="app__subtitle">Location-or-Term Unified Search for Brain Functions</div>
      </header>

      <main className="app__grid" ref={gridRef}>
        <section className="card" style={{ flexBasis: `${sizes[0]}%` }}>
          <div className="card__title">Terms</div>
          <Terms onPickTerm={handlePickTerm} />
        </section>

        <div className="resizer" aria-label="Resize left/middle" onMouseDown={(e) => startDrag(0, e)} />

        <section className="card card--stack" style={{ flexBasis: `${sizes[1]}%` }}>
          <QueryBuilder query={query} setQuery={setQuery} />
          <div className="divider" />
          <Studies query={query} />
        </section>

        <div className="resizer" aria-label="Resize middle/right" onMouseDown={(e) => startDrag(1, e)} />

        <section className="card" style={{ flexBasis: `${sizes[2]}%` }}>
          <NiiViewer query={query} />
        </section>
      </main>
    </div>
  )
}
