'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SideBar } from '@/components/nav/SideBar'
// Navbar removed for dashboard
import styles from '@/components/utils/home.module.scss'
import dashStyles from '@/components/utils/dashboard.module.scss'
import { getSession, clearSession, getOrCreateApiKey, setApiKey, revokeApiKey } from '@/components/utils/auth'
import { Socials } from '@/components/nav/Socials'

type TabKey = 'tab1' | 'tab2' | 'tab3'

const DashboardPage = () => {
  const router = useRouter()
  const [active, setActive] = useState<TabKey>('tab1')
  const session = useMemo(() => getSession(), [])
  const [hasMounted, setHasMounted] = useState(false)
  const [apiKey, setApiKeyState] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [rows, setRows] = useState<Array<Record<string, string>>> ([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setHasMounted(true)
    if (!session) {
      router.replace('/auth/login')
      return
    }
    setApiKeyState(getOrCreateApiKey())
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
    setRows(parsed)
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

  function handleMockData() {
    const csv = [
      'customer,contact_email,contact_phone,invoice_id,amount_due,due_date,days_late,notes',
      'Acme Co,payables@acme.test,+1-415-555-0199,1043,1240,2025-07-31,21,Good payer; prefers partials',
      'Bravo LLC,ar@bravo.test,+1-415-555-0123,1044,980,2025-08-01,20,Ask for Friday'
    ].join('\n')
    const parsed = parseCSV(csv)
    setRows(parsed)
    setActive('tab1')
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
            rows.length === 0 ? (
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
              <div className={dashStyles.singlePanel}>
                <h3>Uploaded Vendors</h3>
                <div className={dashStyles.tableWrap}>
                  <table className={dashStyles.table}>
                    <thead>
                      <tr>
                        {Object.keys(rows[0]).map((h) => (
                          <th key={h}>{h.replace(/_/g, ' ')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, idx) => (
                        <tr key={idx}>
                          {Object.keys(rows[0]).map((h) => (
                            <td key={h}>{r[h]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
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


