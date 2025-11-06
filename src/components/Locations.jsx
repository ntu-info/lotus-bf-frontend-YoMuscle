import { API_BASE } from '../api'
// Locations.jsx
import { useEffect, useMemo, useState } from 'react'

function cls (...xs) { return xs.filter(Boolean).join(' ') }

export function Locations ({ query, onPickLocation }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [r, setR] = useState(6.0)
  const [total, setTotal] = useState(0)

  const [sortKey, setSortKey] = useState('study_id')
  const [sortDir, setSortDir] = useState('asc')
  const [pageSize, setPageSize] = useState(30)
  const [page, setPage] = useState(1)

  useEffect(() => { setPage(1) }, [query])

  useEffect(() => {
    if (!query) return
    let alive = true
    const ac = new AbortController()
    ;(async () => {
      setLoading(true); setErr('')
      try {
        const u = new URL(`${API_BASE}/query/${encodeURIComponent(query)}/locations`)
        u.searchParams.set('r', String(r))
        u.searchParams.set('limit', String(pageSize))
        u.searchParams.set('offset', String((page - 1) * pageSize))
        u.searchParams.set('sort', String(sortKey))
        u.searchParams.set('dir', String(sortDir))
        const res = await fetch(u.toString(), { signal: ac.signal })
        const data = await res.json().catch(()=>({}))
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
        if (!alive) return
        const list = Array.isArray(data?.results) ? data.results : []
        setRows(list)
        const totalFromApi = Number(data?.total ?? data?.count ?? data?.total_count)
        setTotal(Number.isFinite(totalFromApi) ? totalFromApi : list.length)
      } catch (e) {
        if (!alive) return
        setErr(e?.message || String(e))
        setRows([])
        setTotal(0)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false; ac.abort() }
  }, [query, r, page, pageSize])


  const totalPages = Math.max(1, Math.ceil(Math.max(0, total) / pageSize))
  const pageRows = rows

  const changeSort = (k) => {
    if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(k); setSortDir('asc') }
  }

  return (
    <div className='flex flex-col rounded-2xl border' style={{ border: '1px solid var(--border)', background: 'transparent' }}>
      <div className='flex items-center justify-between p-3'>
        <div className='font-semibold' style={{ color: 'var(--fg-bright)', fontSize: '15px' }}>Locations</div>
        <div className='text-sm' style={{ color: 'var(--muted)' }}>{query ? `Query results` : 'Awaiting query'}</div>
      </div>

      <div className='flex flex-wrap items-end gap-3 px-3 pb-2 text-sm'>
        <label className='flex flex-col' style={{ color: 'var(--fg)' }}>r (mm)
          <input type='number' step='0.5' value={r} onChange={e=>setR(Number(e.target.value)||6)} className='w-24 rounded-lg border px-2 py-1'/>
        </label>
      </div>

      {!query && <div className='px-3 pb-4 text-sm' style={{ color: 'var(--muted)' }}>No query provided.</div>}
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
                <select value={pageSize} onChange={(e)=>{ setPageSize(Number(e.target.value)||30); setPage(1) }} style={{ background:'var(--bg-card)', color:'var(--fg)', border:'1px solid var(--border)', borderRadius:6, padding:'2px 6px' }}>
                  <option value={10}>10</option>
                  <option value={30}>30</option>
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
                    { key: 'x', label: 'X' },
                    { key: 'y', label: 'Y' },
                    { key: 'z', label: 'Z' }
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
                  <tr><td colSpan={4} className='px-3 py-4' style={{ color: 'var(--muted)' }}>No data</td></tr>
                ) : (
                  pageRows.map((r, i) => (
                    <tr
                      key={i}
                      style={{ background: i % 2 ? 'var(--bg-card)' : 'var(--bg-elevated)', cursor: 'pointer' }}
                      title="Click to move crosshairs to this coordinate"
                      onClick={() => onPickLocation?.({ x: r.x, y: r.y, z: r.z })}
                    >
                      <td className='px-3 py-2 align-top'>
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
                      <td className='px-3 py-2 align-top'>{r.x}</td>
                      <td className='px-3 py-2 align-top'>{r.y}</td>
                      <td className='px-3 py-2 align-top'>{r.z}</td>
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
                <select value={pageSize} onChange={(e)=>{ setPageSize(Number(e.target.value)||30); setPage(1) }} style={{ background:'var(--bg-card)', color:'var(--fg)', border:'1px solid var(--border)', borderRadius:6, padding:'2px 6px' }}>
                  <option value={10}>10</option>
                  <option value={30}>30</option>
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

