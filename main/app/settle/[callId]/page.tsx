'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import styles from './settle.module.scss'

export default function SettlementPortal() {
  const params = useParams()
  const callId = params.callId as string
  
  // State
  const [sliderValue, setSliderValue] = useState(0)
  const [isAccepting, setIsAccepting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [paymentUrl, setPaymentUrl] = useState('')

  // Convex queries
  const settlementData = useQuery(api.settlement.getSettlementData, { callId })
  const transcripts = useQuery(api.vapiTranscripts.byCall, { callId }) || []
  const transcriptRef = useRef<HTMLDivElement | null>(null)
  
  // Mutations
  const updateProposal = useMutation(api.settlement.updateProposal)
  const acceptProposal = useMutation(api.settlement.acceptProposal)

  // Initialize slider value
  useEffect(() => {
    if (settlementData && sliderValue === 0) {
      // Start at 60% of outstanding
      const initialValue = Math.floor(settlementData.outstandingCents * 0.6)
      setSliderValue(initialValue)
    }
  }, [settlementData])

  // Handle slider change
  const handleSliderChange = async (value: number) => {
    setSliderValue(value)
    
    if (settlementData) {
      // Debounced update to Convex
      await updateProposal({
        callId,
        vendorId: settlementData.vendorId,
        invoiceId: settlementData.invoiceId,
        proposedCents: value,
        outstandingCents: settlementData.outstandingCents,
        discountBps: settlementData.discountBps,
        minAcceptableCents: settlementData.minAcceptableCents,
      })
    }
  }

  // Handle accept
  const handleAccept = async () => {
    if (!settlementData || !meetsMinimum) return
    
    setIsAccepting(true)
    try {
      const result = await acceptProposal({
        callId,
        vendorId: settlementData.vendorId,
        invoiceId: settlementData.invoiceId,
      })
      
      if (result.success) {
        setPaymentUrl(result.paymentUrl)
        setShowSuccess(true)
        
        // Redirect to payment after 2 seconds
        setTimeout(() => {
          window.location.href = result.paymentUrl
        }, 2000)
      }
    } catch (error) {
      console.error('Failed to accept proposal:', error)
      alert('Failed to process acceptance. Please try again.')
    } finally {
      setIsAccepting(false)
    }
  }

  const formatTime = (ms?: number) => {
    if (!ms) return ''
    try {
      return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [transcripts])

  if (!settlementData) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Connecting to your call...</p>
        </div>
      </div>
    )
  }

  // Calculate display values
  const proposedAmount = sliderValue / 100
  const outstandingAmount = settlementData.outstandingCents / 100
  const minAmount = settlementData.minAcceptableCents / 100
  const meetsMinimum = sliderValue >= settlementData.minAcceptableCents
  const isFullPayment = sliderValue >= settlementData.outstandingCents
  const discountAmount = isFullPayment 
    ? Math.floor((sliderValue * settlementData.discountBps) / 10000) / 100
    : 0
  const finalAmount = proposedAmount - discountAmount
  const percentOfDebt = Math.round((sliderValue / settlementData.outstandingCents) * 100)

  // Determine status color
  const statusClass = !meetsMinimum ? styles.statusRed : 
                     isFullPayment ? styles.statusGreen : 
                     styles.statusYellow

  if (showSuccess) {
    return (
      <div className={styles.container}>
        <div className={styles.success}>
          <div className={styles.checkmark}>✓</div>
          <h1>Payment Accepted!</h1>
          <p>Amount: ${finalAmount.toFixed(2)}</p>
          <p>Redirecting to payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.liveIndicator}>
          <div className={styles.liveDot}></div>
          <span>LIVE CALL</span>
        </div>
        <h2>{settlementData.vendorName}</h2>
        <p>Invoice #{settlementData.invoiceNo}</p>
      </div>

      <div className={styles.transcriptSection}>
        <h3>Live Conversation</h3>
        <div className={styles.transcript} ref={transcriptRef}>
          {transcripts.length === 0 ? (
            <div className={`${styles.messageRow} ${styles.agent}`}>
              <div className={styles.avatar}>A</div>
              <div className={styles.message}>
                <div className={styles.messageMeta}>
                  <span className={styles.name}>Agent</span>
                  <span className={styles.time}></span>
                </div>
                <div className={styles.messageText}>Call connecting...</div>
              </div>
            </div>
          ) : (
            transcripts.slice(-10).map((t: any, idx: number) => (
              <div
                key={idx}
                className={`${styles.messageRow} ${t.role === 'assistant' ? styles.agent : styles.vendor}`}
              >
                <div className={styles.avatar}>{t.role === 'assistant' ? 'A' : 'Y'}</div>
                <div className={styles.message}>
                  <div className={styles.messageMeta}>
                    <span className={styles.name}>{t.role === 'assistant' ? 'Agent' : 'You'}</span>
                    {t.timestamp && (
                      <span className={styles.time}>{formatTime(t.timestamp)}</span>
                    )}
                  </div>
                  <div className={styles.messageText}>{t.text}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={styles.settlementSection}>
        <h3>Settlement Amount</h3>
        
        <div className={styles.amountDisplay}>
          <div className={styles.proposedAmount}>
            ${proposedAmount.toFixed(2)}
          </div>
          <div className={styles.debtPercentage}>
            {percentOfDebt}% of total debt
          </div>
        </div>

        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            <span>${minAmount.toFixed(0)}</span>
            <span>Full: ${outstandingAmount.toFixed(0)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={settlementData.outstandingCents}
            value={sliderValue}
            onChange={(e) => handleSliderChange(parseInt(e.target.value))}
            className={`${styles.slider} ${statusClass}`}
          />
        </div>

        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span>Amount Selected:</span>
            <span>${proposedAmount.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className={`${styles.detailRow} ${styles.discount}`}>
              <span>Same-Day Discount:</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className={`${styles.detailRow} ${styles.total}`}>
            <span>You Pay:</span>
            <span>${finalAmount.toFixed(2)}</span>
          </div>
          <div className={styles.detailRow}>
            <span>Remaining Debt:</span>
            <span>${Math.max(0, outstandingAmount - proposedAmount).toFixed(2)}</span>
          </div>
        </div>

        <div className={styles.status}>
          <div className={`${styles.statusIndicator} ${statusClass}`}>
            {!meetsMinimum ? '❌ Below minimum acceptable amount' :
             isFullPayment ? '✅ Eligible for discount!' :
             '✅ Acceptable offer'}
          </div>
        </div>

        <button
          className={styles.acceptButton}
          onClick={handleAccept}
          disabled={!meetsMinimum || isAccepting || settlementData.accepted}
        >
          {isAccepting ? 'Processing...' : 
           settlementData.accepted ? 'Already Accepted' :
           'Accept & Pay Now'}
        </button>

        <p className={styles.disclaimer}>
          By accepting, you agree to pay the amount shown above immediately.
          Your payment will be processed securely through Stripe.
        </p>
      </div>
    </div>
  )
}