import { API_BASE } from '../api'
import { useEffect, useMemo, useState } from 'react'

function classNames (...xs) { return xs.filter(Boolean).join(' ') }

export function Studies ({ query }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [sortKey, setSortKey] = useState('year')
  const [sortDir, setSortDir] = useState('desc') // 'asc' | 'desc'
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)

  useEffect(() => { setPage(1) }, [query])

  useEffect(() => {
    if (!query) return
    let alive = true
    const ac = new AbortController()
    ;(async () => {
      setLoading(true)
      setErr('')
      try {
        const u = new URL(`${API_BASE}/query/${encodeURIComponent(query)}/studies`)
        // Server-side pagination params
        u.searchParams.set('limit', String(pageSize))
        u.searchParams.set('offset', String((page - 1) * pageSize))
        const res = await fetch(u.toString(), { signal: ac.signal })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
        if (!alive) return
        const list = Array.isArray(data?.results) ? data.results : []
        setRows(list)
        const totalFromApi = Number(data?.total ?? data?.count ?? data?.total_count)
        setTotal(Number.isFinite(totalFromApi) ? totalFromApi : list.length)
      } catch (e) {
        if (!alive) return
        setErr(`Unable to fetch studies: ${e?.message || e}`)
        setRows([])
        setTotal(0)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false; ac.abort() }
  }, [query, page, pageSize])

  const changeSort = (key) => {
    if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = useMemo(() => {
    const arr = [...rows]
    const dir = sortDir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      const A = a?.[sortKey]
      const B = b?.[sortKey]
      // Numeric comparison for year; string comparison for other fields
      if (sortKey === 'year') return (Number(A || 0) - Number(B || 0)) * dir
      return String(A || '').localeCompare(String(B || ''), 'en') * dir
    })
    return arr
  }, [rows, sortKey, sortDir])
  const totalPages = Math.max(1, Math.ceil(Math.max(0, total) / pageSize))
  const pageRows = sorted // server already paginates

  return (
    <div className='flex flex-col rounded-2xl border' style={{ border: '1px solid var(--border)', background: 'transparent' }}>
      <div className='flex items-center justify-between p-3'>
        <div className='card__title'>Studies</div>
        <div />
      </div>


      {query && loading && (
        <div className='grid gap-3 p-3'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='h-10 animate-pulse rounded-lg' style={{ background: 'var(--bg-elevated)' }} />
          ))}
        </div>
      )}

      {query && err && (
        <div className='mx-3 mb-3 rounded-lg p-3 text-sm alert alert--error'>
          {err}
        </div>
      )}

      {query && !loading && !err && (
        <>
          {/* Top Pagination */}
          <div className='flex items-center justify-between border-b p-3 text-sm' style={{ borderBottom: '1px solid var(--border)' }}>
            <div className='flex items-center gap-3'>
              <div>Total <b>{total}</b> records, page <b>{page}</b>/<b>{totalPages}</b></div>
              <label className='flex items-center gap-1'>
                <span style={{ color: 'var(--muted)' }}>per page</span>
                <select value={pageSize} onChange={(e)=>{ setPageSize(Number(e.target.value)||20); setPage(1) }} style={{ background:'var(--bg-card)', color:'var(--fg)', border:'1px solid var(--border)', borderRadius:6, padding:'2px 6px' }}>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
            </div>
            <div className='flex items-center gap-2'>
              <button disabled={page <= 1} onClick={() => setPage(1)} className='rounded-lg border px-2 py-1 disabled:opacity-40'>⏮</button>
              <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className='rounded-lg border px-2 py-1 disabled:opacity-40'>Previous</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className='rounded-lg border px-2 py-1 disabled:opacity-40'>Next</button>
              <button disabled={page >= totalPages} onClick={() => setPage(totalPages)} className='rounded-lg border px-2 py-1 disabled:opacity-40'>⏭</button>
            </div>
          </div>

          <div className='overflow-auto'>
            <table className='min-w-full text-sm' style={{ background: 'var(--bg-card)', color: 'var(--fg)' }}>
              <thead className='sticky top-0 text-left' style={{ background: 'var(--bg-elevated)' }}>
                <tr>
                  {[
                    { key: 'study_id', label: 'Study ID' },
                    { key: 'year', label: 'Year' },
                    { key: 'journal', label: 'Journal' },
                    { key: 'title', label: 'Title' },
                    { key: 'authors', label: 'Authors' }
                  ].map(({ key, label }) => (
                    <th key={key} className='cursor-pointer px-3 py-2 font-semibold' onClick={() => changeSort(key)} style={{ color: 'var(--fg-bright)' }}>
                      <span className='inline-flex items-center gap-2'>
                        {label}
                        <span className='text-xs' style={{ color: 'var(--muted)' }}>{sortKey === key ? (sortDir === 'asc' ? '▲' : '▼') : ''}</span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr><td colSpan={5} className='px-3 py-4' style={{ color: 'var(--muted)' }}>No data</td></tr>
                ) : (
                  pageRows.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 ? 'var(--bg-card)' : 'var(--bg-elevated)' }}>
                      <td className='whitespace-nowrap px-3 py-2 align-top'>
                        {r.study_id ? (
                          <a 
                            href={`https://pubmed.ncbi.nlm.nih.gov/${r.study_id}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ 
                              color: 'var(--primary-600)',
                              textDecoration: 'none',
                              fontWeight: '500'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                          >
                            {r.study_id}
                          </a>
                        ) : ''}
                      </td>
                      <td className='whitespace-nowrap px-3 py-2 align-top'>{r.year ?? ''}</td>
                      <td className='px-3 py-2 align-top'>{r.journal || ''}</td>
                      <td className='max-w-[540px] px-3 py-2 align-top'><div className='truncate' title={r.title}>{r.title || ''}</div></td>
                      <td className='px-3 py-2 align-top'>{r.authors || ''}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Pagination */}
          <div className='flex items-center justify-between border-t p-3 text-sm' style={{ borderTop: '1px solid var(--border)' }}>
            <div className='flex items-center gap-3'>
              <div>Total <b>{total}</b> records, page <b>{page}</b>/<b>{totalPages}</b></div>
              <label className='flex items-center gap-1'>
                <span style={{ color: 'var(--muted)' }}>per page</span>
                <select value={pageSize} onChange={(e)=>{ setPageSize(Number(e.target.value)||20); setPage(1) }} style={{ background:'var(--bg-card)', color:'var(--fg)', border:'1px solid var(--border)', borderRadius:6, padding:'2px 6px' }}>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
            </div>
            <div className='flex items-center gap-2'>
              <button disabled={page <= 1} onClick={() => setPage(1)} className='rounded-lg border px-2 py-1 disabled:opacity-40'>⏮</button>
              <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className='rounded-lg border px-2 py-1 disabled:opacity-40'>Previous</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className='rounded-lg border px-2 py-1 disabled:opacity-40'>Next</button>
              <button disabled={page >= totalPages} onClick={() => setPage(totalPages)} className='rounded-lg border px-2 py-1 disabled:opacity-40'>⏭</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

