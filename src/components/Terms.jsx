import { API_BASE } from '../api'
import { useEffect, useMemo, useState } from 'react'

export function Terms ({ onPickTerm }) {
  const [terms, setTerms] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  
  // Related terms state
  const [selectedTerm, setSelectedTerm] = useState(null)
  const [relatedTerms, setRelatedTerms] = useState([])
  const [loadingRelated, setLoadingRelated] = useState(false)
  const [relatedErr, setRelatedErr] = useState('')
  const [relLimit, setRelLimit] = useState(10)
  const [relSortKey, setRelSortKey] = useState('co_count') // 'co_count' | 'jaccard' | 'term'
  const [relSortDir, setRelSortDir] = useState('desc')

  useEffect(() => {
    let alive = true
    const ac = new AbortController()
    const load = async () => {
      setLoading(true)
      setErr('')
      try {
        const res = await fetch(`${API_BASE}/terms`, { signal: ac.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!alive) return
        setTerms(Array.isArray(data?.terms) ? data.terms : [])
      } catch (e) {
        if (!alive) return
        setErr(`Failed to fetch terms: ${e?.message || e}`)
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false; ac.abort() }
  }, [])

  // Fetch related terms when a term is selected
  const fetchRelatedTerms = async (term) => {
    setSelectedTerm(term)
    setLoadingRelated(true)
    setRelatedErr('')
    
    try {
      const res = await fetch(`${API_BASE}/terms/${encodeURIComponent(term)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      
      // Backend returns: { term: string, related: [{term, co_count, jaccard}, ...] }
      const related = Array.isArray(data?.related) ? data.related : []
      setRelatedTerms(related)
    } catch (e) {
      setRelatedErr(`Failed to fetch related terms: ${e?.message || e}`)
      setRelatedTerms([])
    } finally {
      setLoadingRelated(false)
    }
  }

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return terms
    return terms.filter(t => t.toLowerCase().includes(s))
  }, [terms, search])

  const handleTermClick = (term) => {
    // Auto-add to query builder
    onPickTerm?.(term)
    // Fetch related terms
    fetchRelatedTerms(term)
  }

  const handleOperatorClick = (term, operator) => {
    onPickTerm?.(`${operator} ${term}`)
  }

  return (
    <div className='terms'>
      <div className='terms__controls'>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search terms…'
          className='input'
          style={{ marginBottom: '8px' }}
        />
        <button
          onClick={() => setSearch('')}
          className='btn btn--primary'
          style={{ width: '100%' }}
        >
          Clear Search
        </button>
      </div>

      {loading && (
        <div className='terms__skeleton'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='terms__skeleton-row' />
          ))}
        </div>
      )}

      {err && (
        <div className='alert alert--error'>
          {err}
        </div>
      )}

      {!loading && !err && (
        <div className='terms__list'>
          {filtered.length === 0 ? (
            <div className='terms__empty'>No terms found</div>
          ) : (
            <ul className='terms__ul'>
              {filtered.slice(0, 500).map((t, idx) => (
                <li key={`${t}-${idx}`} className='terms__li'>
                  <a
                    href="#"
                    className='terms__name'
                    title={t}
                    aria-label={`Add term ${t}`}
                    onClick={(e) => { e.preventDefault(); handleTermClick(t); }}
                    style={{
                      color: selectedTerm === t ? 'var(--primary-600)' : 'var(--fg)',
                      fontWeight: selectedTerm === t ? '600' : '400'
                    }}
                  >
                    {t}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Related Terms Section */}
      {selectedTerm && (
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          background: 'var(--bg-elevated)', 
          borderRadius: '8px',
          border: '1px solid var(--border)'
        }}>
          <div style={{ 
            fontSize: '13px', 
            fontWeight: '600', 
            marginBottom: '8px',
            color: 'var(--fg-bright)'
          }}>
            Related to: <span style={{ color: 'var(--primary-600)' }}>{selectedTerm}</span>
          </div>

          {/* Controls: sort & limit */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 12, color: 'var(--muted)' }}>Sort by</label>
            <select
              value={relSortKey}
              onChange={(e)=>setRelSortKey(e.target.value)}
              style={{ background:'var(--bg-card)', color:'var(--fg)', border:'1px solid var(--border)', borderRadius:6, padding:'4px 8px' }}
            >
              <option value='co_count'>Co-occurrence</option>
              <option value='jaccard'>Jaccard</option>
              <option value='term'>Term</option>
            </select>
            <button
              onClick={()=>setRelSortDir(d=> d==='asc'?'desc':'asc')}
              className='btn'
              style={{ background:'var(--bg-elevated)', color:'var(--fg)', border:'1px solid var(--border)'}}
              title='Toggle sort direction'
            >
              {relSortDir === 'asc' ? 'Asc' : 'Desc'}
            </button>
            <span style={{ flex: 1 }} />
            <label style={{ fontSize: 12, color: 'var(--muted)' }}>Show</label>
            <select
              value={relLimit}
              onChange={(e)=>setRelLimit(Number(e.target.value) || 10)}
              style={{ background:'var(--bg-card)', color:'var(--fg)', border:'1px solid var(--border)', borderRadius:6, padding:'4px 8px' }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          {loadingRelated && (
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Loading related terms...</div>
          )}

          {relatedErr && (
            <div className='alert alert--error' style={{ fontSize: '12px', padding: '8px' }}>
              {relatedErr}
            </div>
          )}

          {!loadingRelated && !relatedErr && relatedTerms.length === 0 && (
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>No related terms found</div>
          )}

          {!loadingRelated && !relatedErr && relatedTerms.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {([...relatedTerms].sort((a,b)=>{
                  const dir = relSortDir==='asc'?1:-1
                  if (relSortKey==='term') return String(a.term||'').localeCompare(String(b.term||''))*dir
                  if (relSortKey==='jaccard') return ((Number(a.jaccard)||0)-(Number(b.jaccard)||0))*dir
                  return ((Number(a.co_count)||0)-(Number(b.co_count)||0))*dir
                }).slice(0, relLimit)).map((rt, idx) => {
                // Backend format: { term, co_count, jaccard }
                const termName = rt.term || `Term ${idx + 1}`
                const count = rt.co_count || 0
                const jaccard = rt.jaccard || 0
                
                return (
                  <div 
                    key={idx} 
                    className='chip'
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      cursor: 'default',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '500',
                        color: 'var(--fg-bright)',
                        marginBottom: '4px',
                        wordBreak: 'break-word'
                      }}>
                        {termName}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: 'var(--muted)',
                        fontWeight: '500'
                      }}>
                        Co-occurrence: {count} | Jaccard: {jaccard.toFixed(3)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', marginLeft: '12px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleOperatorClick(termName, 'AND')}
                        style={{ 
                          padding: '5px 10px', 
                          fontSize: '11px',
                          background: 'var(--accent)',
                          minWidth: '45px',
                          fontWeight: '600'
                        }}
                        title={`Add: AND ${termName}`}
                      >
                        AND
                      </button>
                      <button
                        onClick={() => handleOperatorClick(termName, 'OR')}
                        style={{ 
                          padding: '5px 10px', 
                          fontSize: '11px',
                          background: 'var(--primary-600)',
                          minWidth: '45px',
                          fontWeight: '600'
                        }}
                        title={`Add: OR ${termName}`}
                      >
                        OR
                      </button>
                      <button
                        onClick={() => handleOperatorClick(termName, 'NOT')}
                        style={{ 
                          padding: '5px 10px', 
                          fontSize: '11px',
                          background: '#ef4444',
                          minWidth: '45px',
                          fontWeight: '600'
                        }}
                        title={`Add: NOT ${termName}`}
                      >
                        NOT
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

