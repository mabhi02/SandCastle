'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SideBar } from '@/components/nav/SideBar'
import styles from '@/components/utils/home.module.scss'
import dashStyles from '@/components/utils/dashboard.module.scss'
import { getSession, clearSession } from '@/components/utils/auth'
import { Socials } from '@/components/nav/Socials'
import { useMutation, useQuery, useAction } from 'convex/react'
import ContourCanvas from '@/components/utils/ContourCanvas'
import { api } from '@/convex/_generated/api'

const DashboardPage = () => {
  const router = useRouter()
  const session = getSession()
  const [hasMounted, setHasMounted] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [activeCall, setActiveCall] = useState<string | null>(null)
  const [activeCallId, setActiveCallId] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<Array<{speaker: string, text: string, timestamp?: number}>>([])
  const transcriptRef = useRef<HTMLDivElement | null>(null)

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
  
  // Poll for the latest call to get the real call ID
  const latestCall = useQuery(api.vapiCalls.listCalls, { limit: 1 })
  
  // Update activeCallId when we detect a new call
  useEffect(() => {
    if (activeCall && latestCall && latestCall.length > 0) {
      const mostRecentCall = latestCall[0]
      if (mostRecentCall.callId && mostRecentCall.callId !== activeCallId) {
        console.log('Updated call ID to:', mostRecentCall.callId)
        setActiveCallId(mostRecentCall.callId)
      }
    }
  }, [latestCall, activeCall, activeCallId])
  
  // Subscribe to live transcripts when there's an active call
  const liveTranscripts = useQuery(
    api.vapiTranscripts.byCall, 
    activeCallId && !activeCallId.startsWith('temp-') ? { callId: activeCallId } : "skip"
  )

  useEffect(() => {
    setHasMounted(true)
    if (!session) {
      router.replace('/auth/login')
      return
    }
  }, [router, session])

  // Update transcript when live transcripts change
  useEffect(() => {
    if (liveTranscripts && liveTranscripts.length > 0) {
      const formattedTranscripts = liveTranscripts.map((t: any) => ({
        speaker: t.role === 'assistant' ? 'agent' : 'vendor',
        text: t.text,
        timestamp: t.timestamp || t._creationTime
      }))
      setTranscript(formattedTranscripts)
    }
  }, [liveTranscripts])

  // Auto-scroll transcript to bottom on update
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [transcript])

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

  const formatTime = (ms?: number) => {
    if (!ms) return ''
    try {
      return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
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
    setActiveCallId(null) // Reset previous call ID
    setTranscript([
      { speaker: 'agent', text: `Initiating call to ${vendorName}...` }
    ])
    
    try {
      // Use the mutation which handles the VAPI call internally
      const result = await startCallMutation({ vendorId: vendorId as any })

      if (result.success) {
        setTranscript(prev => [...prev, 
          { speaker: 'agent', text: result.message || 'Call initiated successfully' }
        ])
        // Set the call ID if returned
        if (result.callId) {
          setActiveCallId(result.callId)
          console.log('Call ID set:', result.callId)
        }
      } else {
        throw new Error('Failed to initiate call')
      }
    } catch (error) {
      console.error('Failed to start call:', error)
      setTranscript(prev => [...prev, 
        { speaker: 'agent', text: `Error: ${error instanceof Error ? error.message : 'Failed to start call'}` }
      ])
      setActiveCall(null)
      setActiveCallId(null)
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
                <ContourCanvas 
                  maxFps={30}
                  thresholdIncrement={5}
                  resolution={6}
                  noiseScales={[0.06, 0.12, 0.24]}
                  noiseWeights={[1, 0.5, 0.35]}
                  motionJitter={0.0008}
                />
                <div className={dashStyles.tableTitle}>Outstanding Invoices</div>
                <div className={dashStyles.actionButtons}>
                  <button className={dashStyles.headerBtn}>Auto-Dial Queue</button>
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
                              {activeCall === invoice.vendorId ? 'Calling...' : 'Call'}
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
                <div className={dashStyles.transcriptArea} ref={transcriptRef}>
                  {transcript.length === 0 ? (
                    <div className={`${dashStyles.messageRow} ${dashStyles.agent}`}>
                      <div className={dashStyles.avatar}>A</div>
                      <div className={dashStyles.message}>
                        <div className={dashStyles.messageMeta}>
                          <span className={dashStyles.name}>Agent</span>
                          <span className={dashStyles.time}></span>
                        </div>
                        <div className={dashStyles.messageText}>Standing by for next call...</div>
                      </div>
                    </div>
                  ) : (
                    transcript.map((line, idx) => (
                      <div
                        key={idx}
                        className={`${dashStyles.messageRow} ${line.speaker === 'agent' ? dashStyles.agent : dashStyles.vendor}`}
                      >
                        <div className={dashStyles.avatar}>{line.speaker === 'agent' ? 'A' : 'V'}</div>
                        <div className={dashStyles.message}>
                          <div className={dashStyles.messageMeta}>
                            <span className={dashStyles.name}>{line.speaker === 'agent' ? 'Agent' : 'Vendor'}</span>
                            {line.timestamp && (
                              <span className={dashStyles.time}>{formatTime(line.timestamp)}</span>
                            )}
                          </div>
                          <div className={dashStyles.messageText}>{line.text}</div>
                        </div>
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
