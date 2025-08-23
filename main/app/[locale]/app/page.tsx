'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SideBar } from '@/components/nav/SideBar'
import styles from '@/components/utils/home.module.scss'
import dashStyles from '@/components/utils/dashboard.module.scss'
import { getSession, clearSession } from '@/components/utils/auth'
import { Socials } from '@/components/nav/Socials'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

const DashboardPage = () => {
  const router = useRouter()
  const session = getSession()
  const [hasMounted, setHasMounted] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [activeCall, setActiveCall] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<Array<{speaker: string, text: string}>>([])

  // Convex queries
  const invoices = useQuery(api.dashboard.getInvoices) || []
  const vendors = useQuery(api.dashboard.getVendors) || []
  const vendorStates = useQuery(api.dashboard.getVendorStates) || []
  const stats = useQuery(api.dashboard.getStats) || {
    totalOutstanding: 0,
    overdueCount: 0,
    promiseAmount: 0,
    recoveredToday: 0,
    activeCalls: 0,
    successRate: 0
  }

  // Mutations
  const startCallMutation = useMutation(api.dashboard.startCall)
  const sendEmailMutation = useMutation(api.dashboard.sendEmail)

  useEffect(() => {
    setHasMounted(true)
    if (!session) {
      router.replace('/auth/login')
      return
    }
  }, [router, session])

  function logout() {
    clearSession()
    router.replace('/auth/login')
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  const getStateClass = (state: string) => {
    const stateMap: Record<string, string> = {
      'Overdue': 'state-overdue',
      'PromiseToPay': 'state-promise',
      'PartialPaid': 'state-partial',
      'Paid': 'state-paid',
      'Dispute': 'state-dispute',
      'InProgress': 'state-progress',
      'Callback': 'state-callback'
    }
    return stateMap[state] || 'state-default'
  }

  const handleStartCall = async (vendorId: string, vendorName: string) => {
    setActiveCall(vendorId)
    setTranscript([
      { speaker: 'agent', text: `Initiating call to ${vendorName}...` }
    ])
    
    try {
      await startCallMutation({ vendorId })
      // Simulate transcript updates
      setTimeout(() => {
        setTranscript(prev => [...prev, 
          { speaker: 'vendor', text: "Hello, this is accounts payable." },
          { speaker: 'agent', text: "Hi, I'm calling about your overdue invoice..." }
        ])
      }, 2000)
    } catch (error) {
      console.error('Failed to start call:', error)
      setActiveCall(null)
    }
  }

  const handleSendEmail = async (vendorId: string, vendorName: string) => {
    try {
      await sendEmailMutation({ vendorId })
    } catch (error) {
      console.error('Failed to send email:', error)
    }
  }

  const getVendorState = (vendorId: string) => {
    return vendorStates.find((vs: any) => vs.vendorId === vendorId)
  }

  const getVendorInfo = (vendorId: string) => {
    return vendors.find((v: any) => v._id === vendorId)
  }

  return (
    <div className={styles.home}>
      <SideBar />
      <main id="main">
        <section className={dashStyles.wrapper}>
          <div className={dashStyles.headerRow}>
            <h1 className={dashStyles.pageTitle}>
              <span className={dashStyles.icon}>🏰</span>
              Sandcastle Collection Agent
            </h1>
            <div className={dashStyles.headerActions}>
              <div className={dashStyles.liveIndicator}>
                <div className={dashStyles.liveDot}></div>
                <span>CONVEX LIVE</span>
              </div>
              <div className={dashStyles.profile}>
                <button 
                  className={dashStyles.avatar} 
                  onClick={() => setProfileOpen(!profileOpen)}
                  aria-haspopup="menu" 
                  aria-expanded={profileOpen}
                >
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

          <div className={dashStyles.statsGrid}>
            <div className={dashStyles.statCard}>
              <div className={dashStyles.statLabel}>Total Outstanding</div>
              <div className={dashStyles.statValue}>{formatCurrency(stats.totalOutstanding)}</div>
            </div>
            <div className={dashStyles.statCard}>
              <div className={dashStyles.statLabel}>Overdue Invoices</div>
              <div className={dashStyles.statValue}>{stats.overdueCount}</div>
            </div>
            <div className={dashStyles.statCard}>
              <div className={dashStyles.statLabel}>Promise to Pay</div>
              <div className={dashStyles.statValue}>{formatCurrency(stats.promiseAmount)}</div>
            </div>
            <div className={dashStyles.statCard}>
              <div className={dashStyles.statLabel}>Recovered Today</div>
              <div className={dashStyles.statValue}>{formatCurrency(stats.recoveredToday)}</div>
            </div>
            <div className={dashStyles.statCard}>
              <div className={dashStyles.statLabel}>Active Calls</div>
              <div className={dashStyles.statValue}>{stats.activeCalls}</div>
            </div>
            <div className={dashStyles.statCard}>
              <div className={dashStyles.statLabel}>Success Rate</div>
              <div className={dashStyles.statValue}>{stats.successRate}%</div>
            </div>
          </div>

          <div className={dashStyles.mainGrid}>
            <div className={dashStyles.tableWrapper}>
              <div className={dashStyles.tableHeader}>
                <div className={dashStyles.tableTitle}>Outstanding Invoices</div>
                <div className={dashStyles.actionButtons}>
                  <button className={dashStyles.headerBtn}>🚀 Auto-Dial Queue</button>
                </div>
              </div>
              
              <table className={dashStyles.richTable}>
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Invoice</th>
                    <th>Outstanding</th>
                    <th>Due Date</th>
                    <th>State</th>
                    <th>Recovery</th>
                    <th>Attempts</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice: any) => {
                    const vendor = getVendorInfo(invoice.vendorId)
                    const vendorState = getVendorState(invoice.vendorId)
                    const daysLate = Math.floor((Date.now() - new Date(invoice.dueDateISO).getTime()) / (1000 * 60 * 60 * 24))
                    const recoveryPct = invoice.amountCents > 0 ? Math.round((invoice.paidCents / invoice.amountCents) * 100) : 0
                    
                    return (
                      <tr key={invoice._id}>
                        <td>
                          <div className={dashStyles.vendorCell}>
                            <div className={dashStyles.vendorAvatar}>
                              {vendor?.name?.slice(0, 2).toUpperCase() || 'VN'}
                            </div>
                            <div className={dashStyles.vendorInfo}>
                              <div className={dashStyles.vendorName}>{vendor?.name || 'Unknown Vendor'}</div>
                              <div className={dashStyles.vendorContact}>
                                {vendor?.contactEmail || vendor?.contactPhone || 'No contact'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{invoice.invoiceNo}</td>
                        <td className={dashStyles.amountCell}>
                          {formatCurrency(invoice.amountCents - invoice.paidCents)}
                        </td>
                        <td>
                          <div className={dashStyles.dateInfo}>
                            <div>{new Date(invoice.dueDateISO).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            {daysLate > 0 && (
                              <div className={dashStyles.daysLate}>
                                {daysLate === 1 ? '1 day late' : `${daysLate} days late`}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`${dashStyles.stateBadge} ${dashStyles[getStateClass(invoice.state)]}`}>
                            {invoice.state}
                          </span>
                        </td>
                        <td>
                          <div className={dashStyles.progressBar}>
                            <div 
                              className={dashStyles.progressFill} 
                              style={{ width: `${recoveryPct}%` }}
                            ></div>
                          </div>
                          <span className={dashStyles.progressText}>{recoveryPct}%</span>
                        </td>
                        <td>
                          <div className={dashStyles.attemptInfo}>
                            {vendorState?.lastAttemptAt && (
                              <div className={dashStyles.lastAttempt}>
                                Last: {new Date(vendorState.lastAttemptAt).toLocaleDateString()}
                              </div>
                            )}
                            <div className={dashStyles.attemptsCount}>
                              {vendorState?.attemptsThisWeek || 0} this week
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={dashStyles.actions}>
                            <button 
                              className={`${dashStyles.actionBtn} ${dashStyles.callBtn} ${activeCall === invoice.vendorId ? dashStyles.callingBtn : ''}`}
                              onClick={() => handleStartCall(invoice.vendorId, vendor?.name || 'Vendor')}
                              disabled={vendor?.doNotCall}
                            >
                              {activeCall === invoice.vendorId ? '📞 Calling...' : '📞 Call'}
                            </button>
                            <button 
                              className={`${dashStyles.actionBtn} ${dashStyles.emailBtn}`}
                              onClick={() => handleSendEmail(invoice.vendorId, vendor?.name || 'Vendor')}
                            >
                              ✉️ Email
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className={dashStyles.sidebar}>
              <div className={dashStyles.callPanel}>
                <div className={dashStyles.panelHeader}>
                  <div className={dashStyles.panelTitle}>Live Call Transcript</div>
                  <div className={dashStyles.callStatus}>
                    <div className={dashStyles.liveDot}></div>
                    <span>{activeCall ? 'Connected' : 'Ready'}</span>
                  </div>
                </div>
                <div className={dashStyles.transcriptArea}>
                  {transcript.length === 0 ? (
                    <div className={dashStyles.transcriptLine}>
                      <strong>Agent:</strong> Standing by for next call...
                    </div>
                  ) : (
                    transcript.map((line, idx) => (
                      <div 
                        key={idx} 
                        className={`${dashStyles.transcriptLine} ${dashStyles[`${line.speaker}Line`]}`}
                      >
                        <strong>{line.speaker === 'agent' ? 'Agent' : 'Vendor'}:</strong> {line.text}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className={dashStyles.activityFeed}>
                <div className={dashStyles.panelHeader}>
                  <div className={dashStyles.panelTitle}>Real-time Activity</div>
                </div>
                <div className={dashStyles.feedContent}>
                  <div className={dashStyles.activityItem}>
                    <div className={dashStyles.activityTime}>Just now</div>
                    <div className={dashStyles.activityText}>System initialized</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <div style={{ position:'fixed', right:'1.6rem', bottom:'1.6rem', zIndex:3 }}>
          <Socials />
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
