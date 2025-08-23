'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MdUndo, MdRedo, MdFormatBold, MdFormatItalic, MdFormatUnderlined, MdFormatAlignLeft, MdFormatAlignCenter, MdFormatAlignRight, MdWrapText } from 'react-icons/md'
import { AiOutlineFontColors } from 'react-icons/ai'
import { RiPaintFill } from 'react-icons/ri'
import { TbFilter } from 'react-icons/tb'
import { useRouter } from 'next/navigation'
import { SideBar } from '@/components/nav/SideBar'
// Navbar removed for dashboard
import styles from '@/components/utils/home.module.scss'
import dashStyles from '@/components/utils/dashboard.module.scss'
import { getSession, clearSession, getOrCreateApiKey, setApiKey, revokeApiKey } from '@/components/utils/auth'
import { Socials } from '@/components/nav/Socials'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

type TabKey = 'tab1' | 'tab2' | 'tab3'
type CellStyle = { color?: string; background?: string; bold?: boolean; italic?: boolean; underline?: boolean; align?: 'left' | 'center' | 'right'; wrap?: boolean }

const DashboardPage = () => {
  const router = useRouter()
  const [active, setActive] = useState<TabKey>('tab1')
  const session = useMemo(() => getSession(), [])
  const [hasMounted, setHasMounted] = useState(false)
  const [apiKey, setApiKeyState] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [rows, setRows] = useState<Array<Record<string, string>>> ([])
  const [filter, setFilter] = useState('')
  const [zoom, setZoom] = useState(150)
  const [cellStyles, setCellStyles] = useState<Record<number, Record<string, CellStyle>>>({})
  const [selectedRange, setSelectedRange] = useState<{ startRow: number; endRow: number; startCol: number; endCol: number } | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const textColorInputRef = useRef<HTMLInputElement>(null)
  const fillColorInputRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState<{ r: number; c: number; key: string; value: string } | null>(null)
  const [history, setHistory] = useState<Array<{ rows: Array<Record<string, string>>; cellStyles: Record<number, Record<string, CellStyle>> }>>([])
  const [future, setFuture] = useState<Array<{ rows: Array<Record<string, string>>; cellStyles: Record<number, Record<string, CellStyle>> }>>([])
  const columns = useMemo(() => rows.length ? Object.keys(rows[0]) : [], [rows])
  const displayedRows = useMemo(() => {
    if (!filter) return rows
    const term = filter.toLowerCase()
    return rows.filter((r) => Object.values(r).some((v) => (v ?? '').toLowerCase().includes(term)))
  }, [rows, filter])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Convex integration
  const vendors = useQuery(api.dashboard.getVendors) || []
  const addVendors = useMutation(api.dashboard.addVendors)
  
  console.log('Current vendors:', vendors)
  console.log('addVendors mutation:', addVendors)

  // Sync Convex vendors into local rows for the latest UI
  useEffect(() => {
    if (vendors && vendors.length > 0) {
      const cleaned = vendors.map((v: any) => {
        const { _id, _creationTime, ...rest } = v || {}
        return rest
      })
      setRows(cleaned as Array<Record<string, string>>)
      setSelectedRange({ startRow: 0, endRow: 0, startCol: 0, endCol: 0 })
    }
  }, [vendors])

  useEffect(() => {
    setHasMounted(true)
    if (!session) {
      router.replace('/auth/login')
      return
    }
    setApiKeyState(getOrCreateApiKey())
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [router, session])

  function logout() {
    clearSession()
    router.replace('/auth/login')
  }

  function handleGenerateKey() {
    const key = getOrCreateApiKey()
    setApiKeyState(key)
  }

  function handleSaveKey() {
    setApiKey(apiKey)
  }

  function handleRevoke() {
    revokeApiKey()
    setApiKeyState('')
  }

  function parseCSV(text: string): Array<Record<string, string>> {
    const rows: string[][] = []
    let current: string[] = []
    let value = ''
    let inQuotes = false
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      if (inQuotes) {
        if (char === '"') {
          const next = text[i + 1]
          if (next === '"') { value += '"'; i++ } else { inQuotes = false }
        } else {
          value += char
        }
      } else {
        if (char === '"') {
          inQuotes = true
        } else if (char === ',') {
          current.push(value)
          value = ''
        } else if (char === '\n') {
          current.push(value)
          rows.push(current)
          current = []
          value = ''
        } else if (char === '\r') {
          // ignore
        } else {
          value += char
        }
      }
    }
    if (value.length > 0 || current.length) {
      current.push(value)
      rows.push(current)
    }
    if (rows.length === 0) return []
    const header = rows[0]
    const out: Array<Record<string, string>> = []
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].length === 1 && rows[i][0] === '') continue
      const obj: Record<string, string> = {}
      for (let j = 0; j < header.length; j++) {
        obj[header[j]] = rows[i][j] ?? ''
      }
      out.push(obj)
    }
    return out
  }

  async function loadCsvFile(file: File) {
    const text = await file.text()
    const parsed = parseCSV(text)
    // Save to Convex; the table will update reactively from the query
    if (parsed.length > 0) {
      await addVendors({ vendors: parsed })
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files && e.dataTransfer.files[0]
    if (file && file.type.includes('csv') || file.name.endsWith('.csv')) {
      void loadCsvFile(file)
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() { setIsDragging(false) }

  function openFilePicker() { fileInputRef.current?.click() }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0]
    if (file) { void loadCsvFile(file) }
    e.currentTarget.value = ''
  }

  async function handleMockData() {
    console.log('Mock data button clicked')
    const csv = [
      'customer,contact_email,contact_phone,invoice_id,amount_due,due_date,days_late,notes',
      'Acme Co,payables@acme.test,+1-415-555-0199,1043,1240,2025-07-31,21,Good payer; prefers partials',
      'Bravo LLC,ar@bravo.test,+1-415-555-0123,1044,980,2025-08-01,20,Ask for Friday',
      'Cinder Corp,ap@cinder.test,+1-415-555-0142,1045,540,2025-08-02,19,Escalate if no reply',
      'Delta Inc,finance@delta.test,+1-415-555-0177,1046,1820,2025-08-03,18,Large account',
      'Echo Partners,ap@echo.test,+1-415-555-0111,1047,260,2025-08-04,17,Prefers email only',
      'Foxtrot LLC,ar@foxtrot.test,+1-415-555-0129,1048,740,2025-08-05,16,Partial Monday',
      'Gamma Co,accounts@gamma.test,+1-415-555-0133,1049,450,2025-08-06,15,Send link again',
      'Helix Labs,ap@helix.test,+1-415-555-0166,1050,1330,2025-08-07,14,Offer 2 installments',
      'Ion Systems,ar@ion.test,+1-415-555-0190,1051,310,2025-08-08,13,Leave VM',
      'Juno Group,finance@juno.test,+1-415-555-0188,1052,990,2025-08-09,12,Confirms Friday'
    ].join('\n')
    const parsed = parseCSV(csv)
    console.log('Parsed CSV:', parsed)
    // Save to Convex
    if (parsed.length > 0 && addVendors) {
      try {
        console.log('Calling addVendors mutation...')
        const result = await addVendors({ vendors: parsed })
        console.log('Added vendors result:', result)
      } catch (error) {
        console.error('Error adding vendors:', error)
      }
    } else {
      console.log('Cannot add vendors:', { parsed, addVendors })
    }
    setActive('tab1')
    if (parsed.length > 0) {
      setSelectedRange({ startRow: 0, endRow: 0, startCol: 0, endCol: 0 })
    }
  }

  function handleExportCsv() {
    if (rows.length === 0) return
    const headers = Object.keys(rows[0])
    const lines = [headers.join(',')]
    for (const r of displayedRows) {
      const line = headers.map((h) => {
        const val = (r[h] ?? '').replaceAll('"', '""')
        return /[",\n]/.test(val) ? `"${val}"` : val
      }).join(',')
      lines.push(line)
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vendors.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function forEachSelectedCell(callback: (rowIndex: number, colKey: string) => void) {
    if (!selectedRange) return
    const { startRow, endRow, startCol, endCol } = normalizeRange(selectedRange)
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const key = columns[c]
        if (key) callback(r, key)
      }
    }
  }

  function normalizeRange(range: { startRow: number; endRow: number; startCol: number; endCol: number }) {
    const startRow = Math.min(range.startRow, range.endRow)
    const endRow = Math.max(range.startRow, range.endRow)
    const startCol = Math.min(range.startCol, range.endCol)
    const endCol = Math.max(range.startCol, range.endCol)
    return { startRow, endRow, startCol, endCol }
  }

  function applyToSelection(partial: Partial<CellStyle>) {
    if (!selectedRange) return
    // Snapshot for undo
    setHistory(prev => {
      const snap = { rows: JSON.parse(JSON.stringify(rows)), cellStyles: JSON.parse(JSON.stringify(cellStyles)) }
      const updated = [...prev, snap]
      return updated.length > 5 ? updated.slice(updated.length - 5) : updated
    })
    setFuture([])
    setCellStyles(prev => {
      const next = { ...prev }
      const norm = normalizeRange(selectedRange)
      for (let r = norm.startRow; r <= norm.endRow; r++) {
        const rowStyles = { ...(next[r] || {}) }
        for (let c = norm.startCol; c <= norm.endCol; c++) {
          const key = columns[c]
          const existing: CellStyle = rowStyles[key] || {};
          rowStyles[key] = { ...existing, ...partial }
        }
        next[r] = rowStyles
      }
      return next
    })
  }

  function toggleBooleanStyleInSelection(prop: 'bold' | 'italic' | 'underline' | 'wrap') {
    if (!selectedRange) return
    setHistory(prev => {
      const snap = { rows: JSON.parse(JSON.stringify(rows)), cellStyles: JSON.parse(JSON.stringify(cellStyles)) }
      const updated = [...prev, snap]
      return updated.length > 5 ? updated.slice(updated.length - 5) : updated
    })
    setFuture([])
    setCellStyles(prev => {
      const next = { ...prev }
      const norm = normalizeRange(selectedRange)
      for (let r = norm.startRow; r <= norm.endRow; r++) {
        const rowStyles = { ...(next[r] || {}) }
        for (let c = norm.startCol; c <= norm.endCol; c++) {
          const key = columns[c]
          const existing: CellStyle = rowStyles[key] || {};
          (existing as any)[prop] = !existing[prop];
          rowStyles[key] = existing
        }
        next[r] = rowStyles
      }
      return next
    })
  }

  function applyAlign(direction: 'left' | 'center' | 'right') {
    if (!selectedRange) return
    setHistory(prev => {
      const snap = { rows: JSON.parse(JSON.stringify(rows)), cellStyles: JSON.parse(JSON.stringify(cellStyles)) }
      const updated = [...prev, snap]
      return updated.length > 5 ? updated.slice(updated.length - 5) : updated
    })
    setFuture([])
    setCellStyles(prev => {
      const next = { ...prev }
      const norm = normalizeRange(selectedRange)
      for (let r = norm.startRow; r <= norm.endRow; r++) {
        const rowStyles = { ...(next[r] || {}) }
        for (let c = norm.startCol; c <= norm.endCol; c++) {
          const key = columns[c]
          const existing: CellStyle = rowStyles[key] || {}
          existing.align = direction
          rowStyles[key] = existing
        }
        next[r] = rowStyles
      }
      return next
    })
  }

  function onUndo() {
    setHistory(prev => {
      if (prev.length === 0) return prev
      const head = prev[prev.length - 1]
      setFuture(f => {
        const snap = { rows: JSON.parse(JSON.stringify(rows)), cellStyles: JSON.parse(JSON.stringify(cellStyles)) }
        const updated = [...f, snap]
        return updated.length > 5 ? updated.slice(updated.length - 5) : updated
      })
      setRows(head.rows)
      setCellStyles(head.cellStyles)
      setSelectedRange(null)
      return prev.slice(0, prev.length - 1)
    })
  }

  function onRedo() {
    setFuture(prev => {
      if (prev.length === 0) return prev
      const head = prev[prev.length - 1]
      setHistory(h => {
        const snap = { rows: JSON.parse(JSON.stringify(rows)), cellStyles: JSON.parse(JSON.stringify(cellStyles)) }
        const updated = [...h, snap]
        return updated.length > 5 ? updated.slice(updated.length - 5) : updated
      })
      setRows(head.rows)
      setCellStyles(head.cellStyles)
      setSelectedRange(null)
      return prev.slice(0, prev.length - 1)
    })
  }

  function handleMouseDownCell(r: number, cIndex: number) {
    setSelectedRange({ startRow: r, endRow: r, startCol: cIndex, endCol: cIndex })
    setIsSelecting(true)
  }

  function handleEnterCell(r: number, cIndex: number) {
    if (!isSelecting || !selectedRange) return
    setSelectedRange({ ...selectedRange, endRow: r, endCol: cIndex })
  }

  function handleMouseUpViewport() { setIsSelecting(false) }

  function startEdit(displayRowIndex: number, colKey: string, colIndex: number) {
    const rowObj = displayedRows[displayRowIndex]
    const realIndex = rows.indexOf(rowObj)
    setEditing({ r: realIndex, c: colIndex, key: colKey, value: rowObj?.[colKey] ?? '' })
  }

  function commitEdit(save: boolean) {
    if (!editing) return
    const { r, key, value } = editing
    if (save) {
      setHistory(prev => {
        const snap = { rows: JSON.parse(JSON.stringify(rows)), cellStyles: JSON.parse(JSON.stringify(cellStyles)) }
        const updated = [...prev, snap]
        return updated.length > 5 ? updated.slice(updated.length - 5) : updated
      })
      setFuture([])
      setRows(prev => prev.map((row, i) => i === r ? { ...row, [key]: value } : row))
    }
    setEditing(null)
  }

  function addRow() {
    if (columns.length === 0) return
    setHistory(prev => {
      const snap = { rows: JSON.parse(JSON.stringify(rows)), cellStyles: JSON.parse(JSON.stringify(cellStyles)) }
      const updated = [...prev, snap]
      return updated.length > 5 ? updated.slice(updated.length - 5) : updated
    })
    setFuture([])
    setRows(prev => [...prev, Object.fromEntries(columns.map(h => [h, '']))])
  }

  function addColumn() {
    const base = 'col'
    const existing = new Set(columns)
    let i = columns.length + 1
    let key = `${base}${i}`
    while (existing.has(key)) { i++; key = `${base}${i}` }
    setHistory(prev => {
      const snap = { rows: JSON.parse(JSON.stringify(rows)), cellStyles: JSON.parse(JSON.stringify(cellStyles)) }
      const updated = [...prev, snap]
      return updated.length > 5 ? updated.slice(updated.length - 5) : updated
    })
    setFuture([])
    setRows(prev => prev.map(r => ({ ...r, [key]: '' })))
  }

  return (
    <div className={styles.home}>
      <SideBar />
      <main id="main">

        <section className={dashStyles.wrapper}>
          <div className={dashStyles.headerRow}>
            <div className={dashStyles.tabs}>
              <button className={active === 'tab1' ? dashStyles.tabActive : dashStyles.tab} onClick={() => setActive('tab1')}>CSV Importer</button>
              <button className={active === 'tab2' ? dashStyles.tabActive : dashStyles.tab} onClick={() => setActive('tab2')}>Trace Log</button>
              <button className={active === 'tab3' ? dashStyles.tabActive : dashStyles.tab} onClick={() => setActive('tab3')}>User Settings</button>
            </div>
            <div className={dashStyles.headerActions}>
              <button className={dashStyles.mockButton} onClick={handleMockData}>Mock data</button>
              <div className={dashStyles.profile}>
                <button className={dashStyles.avatar} onClick={() => setProfileOpen(!profileOpen)} aria-haspopup="menu" aria-expanded={profileOpen}>
                  {(hasMounted ? (session?.username?.[0] || 'U') : 'U').toUpperCase()}
                </button>
                {profileOpen && (
                  <div className={dashStyles.menu} role="menu">
                    <div className={dashStyles.menuHeader}>{hasMounted ? session?.username : ''}</div>
                    <button className={dashStyles.menuItem} onClick={logout} role="menuitem">Logout</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {active === 'tab1' && (
            (vendors.length === 0) ? (
              <div
                className={dashStyles.glassFull}
                onClick={openFilePicker}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <div className={dashStyles.centerControls}>
                  <p style={{opacity:0.8}}>No CSV uploaded yet</p>
                  <button className={dashStyles.uploadTrigger} onClick={openFilePicker}>Upload CSV</button>
                </div>
              </div>
            ) : (
              <div className={dashStyles.sheetArea}>
                <div className={dashStyles.sheetToolbar}>
                  <div className={dashStyles.toolbarRow}>
                    <span className={dashStyles.toolLabel}>Uploaded Vendors</span>
                    <span className={dashStyles.badge}>Rows: {displayedRows.length}</span>
                    <div className={dashStyles.divider} />
                    <button className={dashStyles.iconBtn} title="Undo" onClick={onUndo}><MdUndo /></button>
                    <button className={dashStyles.iconBtn} title="Redo" onClick={onRedo}><MdRedo /></button>
                    <div className={dashStyles.divider} />
                    <select className={dashStyles.dropdown} value={zoom} onChange={(e) => setZoom(Number(e.target.value))}>
                      <option value={50}>50%</option>
                      <option value={75}>75%</option>
                      <option value={100}>100%</option>
                      <option value={125}>125%</option>
                      <option value={150}>150%</option>
                      <option value={175}>175%</option>
                      <option value={200}>200%</option>
                    </select>
                    <div className={dashStyles.divider} />
                    <button className={dashStyles.iconBtn} title="Text color" onClick={() => textColorInputRef.current?.click()}><AiOutlineFontColors /></button>
                    <button className={dashStyles.iconBtn} title="Fill" onClick={() => fillColorInputRef.current?.click()}><RiPaintFill /></button>
                    <button className={dashStyles.iconBtn} title="Bold" onClick={() => toggleBooleanStyleInSelection('bold')}><MdFormatBold /></button>
                    <button className={dashStyles.iconBtn} title="Italic" onClick={() => toggleBooleanStyleInSelection('italic')}><MdFormatItalic /></button>
                    <button className={dashStyles.iconBtn} title="Underline" onClick={() => toggleBooleanStyleInSelection('underline')}><MdFormatUnderlined /></button>
                    <button className={dashStyles.iconBtn} title="Align left" onClick={() => applyAlign('left')}><MdFormatAlignLeft /></button>
                    <button className={dashStyles.iconBtn} title="Align center" onClick={() => applyAlign('center')}><MdFormatAlignCenter /></button>
                    <button className={dashStyles.iconBtn} title="Align right" onClick={() => applyAlign('right')}><MdFormatAlignRight /></button>
                    <button className={dashStyles.iconBtn} title="Wrap" onClick={() => toggleBooleanStyleInSelection('wrap')}><MdWrapText /></button>
                    <input ref={textColorInputRef} type="color" onChange={(e) => applyToSelection({ color: e.target.value })} style={{ position: 'absolute', width:1, height:1, opacity:0, pointerEvents:'none' }} />
                    <input ref={fillColorInputRef} type="color" onChange={(e) => applyToSelection({ background: e.target.value })} style={{ position: 'absolute', width:1, height:1, opacity:0, pointerEvents:'none' }} />
                  </div>
                  <div className={dashStyles.toolbarRow}>
                    <input id="sheet-search" className={dashStyles.input} placeholder="Search" value={filter} onChange={(e) => setFilter(e.target.value)} />
                    <button className={dashStyles.secondary} onClick={handleExportCsv}>Export CSV</button>
                  </div>
                </div>
                <div className={dashStyles.tableViewport} onMouseUp={handleMouseUpViewport}>
                  <table className={dashStyles.table} style={{ ['--sheet-zoom' as any]: String(zoom / 100) }}>
                    <thead>
                      <tr>
                        <th className={`${dashStyles.rowHeader} ${dashStyles.stickyLeft}`}>#</th>
                        {columns.map((h, cIndex) => (
                          <th key={h} onMouseDown={() => setSelectedRange({ startRow: 0, endRow: displayedRows.length - 1, startCol: cIndex, endCol: cIndex })} className={dashStyles.textLeft}>{h.replace(/_/g, ' ')}</th>
                        ))}
                        <th className={dashStyles.addColCell}><button className={dashStyles.addBtn} onClick={addColumn}>+</button></th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedRows.map((r, idx) => (
                        <tr key={idx}>
                          <td className={`${dashStyles.rowHeader} ${dashStyles.stickyLeft}`} onMouseDown={() => setSelectedRange({ startRow: idx, endRow: idx, startCol: 0, endCol: columns.length - 1 })} onMouseEnter={() => handleEnterCell(idx, 0)}>{idx + 1}</td>
                          {columns.map((h, cIndex) => {
                            const cs = (cellStyles[idx] && cellStyles[idx][h]) || {}
                            const inSel = selectedRange ? (idx >= Math.min(selectedRange.startRow, selectedRange.endRow) && idx <= Math.max(selectedRange.startRow, selectedRange.endRow) && cIndex >= Math.min(selectedRange.startCol, selectedRange.endCol) && cIndex <= Math.max(selectedRange.startCol, selectedRange.endCol)) : false
                            return (
                              <td key={h}
                                  className={[dashStyles.cell, cs.wrap ? dashStyles.wrap : '', cs.align === 'center' ? dashStyles.textCenter : cs.align === 'right' ? dashStyles.textRight : dashStyles.textLeft, inSel ? dashStyles.selected : ''].join(' ')}
                                  onMouseDown={() => handleMouseDownCell(idx, cIndex)}
                                  onMouseEnter={() => handleEnterCell(idx, cIndex)}
                                  onDoubleClick={() => startEdit(idx, h, cIndex)}
                                  style={{ fontWeight: cs.bold ? 700 : 400, fontStyle: cs.italic ? 'italic' : 'normal', textDecoration: cs.underline ? 'underline' : 'none', color: cs.color, background: cs.background }}
                              >
                                {editing && editing.r === rows.indexOf(displayedRows[idx]) && editing.key === h ? (
                                  <input
                                    autoFocus
                                    value={editing.value}
                                    onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                                    onBlur={() => commitEdit(true)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') commitEdit(true)
                                      if (e.key === 'Escape') commitEdit(false)
                                    }}
                                    style={{ width: '100%', background: 'transparent', color: 'inherit', border: '1px solid var(--background-light)', outline: 'none', padding: '2px 4px' }}
                                  />
                                ) : (
                                  r[h]
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td className={`${dashStyles.rowHeader} ${dashStyles.stickyLeft}`}></td>
                        <td colSpan={columns.length} style={{ textAlign: 'left' }}><button className={dashStyles.addBtn} onClick={addRow}>+ Add row</button></td>
                        <td className={dashStyles.addColCell}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )
          )}

          {active === 'tab2' && (
            <div className={dashStyles.columns}>
              <div className={dashStyles.column}>
                <h3>Trace Log</h3>
                <div className={dashStyles.placeholder}>Execution timeline</div>
              </div>
              <div className={dashStyles.column}>
                <h3>Table/Panel</h3>
                <ul className={dashStyles.list}>
                  <li>Success rate</li>
                  <li># of errors</li>
                  <li>Flag rejected rows</li>
                </ul>
              </div>
            </div>
          )}

          {active === 'tab3' && (
            <div className={dashStyles.singlePanel}>
              <h3>API Keys</h3>
              <div className={dashStyles.fieldRow}>
                <input className={dashStyles.input} value={apiKey} onChange={(e) => setApiKeyState(e.target.value)} placeholder="Enter API key or generate" />
                <button className={dashStyles.primary} onClick={handleSaveKey}>Save</button>
                <button className={dashStyles.secondary} onClick={handleGenerateKey}>Generate</button>
                <button className={dashStyles.danger} onClick={handleRevoke}>Revoke</button>
              </div>
              <p className={dashStyles.helper}>Keys are stored locally for now. Backend integration will replace this.</p>
            </div>
          )}
        </section>
        <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileChange} style={{position:'absolute', width:1, height:1, opacity:0, pointerEvents:'none'}} />
        <div style={{ position:'fixed', right:'1.6rem', bottom:'1.6rem', zIndex:3 }}>
          <Socials />
        </div>
      </main>
    </div>
  )
}

export default DashboardPage

