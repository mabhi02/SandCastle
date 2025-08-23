'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SideBar } from '@/components/nav/SideBar'
// Navbar removed for auth pages
import styles from '@/components/utils/auth.module.scss'
import ContourCanvas from '@/components/utils/ContourCanvas'
import { Socials } from '@/components/nav/Socials'
import { registerUser, getSession } from '@/components/utils/auth'

const SignupPage = () => {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'login'|'signup'>('signup')

  useEffect(() => {
    const session = getSession()
    if (session) {
      router.replace('/app')
    }
  }, [router])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    const res = registerUser(username.trim(), password)
    if (!res.ok) {
      setError(res.error || 'Signup failed')
      return
    }
    router.replace('/app')
  }

  return (
    <div className={styles.authWrapper}>
      <SideBar />
      <main className={styles.authMain}>
        <ContourCanvas />
        <section className={styles.authContainer}>
          <div className={styles.logoWrap}>
            <img src="/log.png" alt="SandCastle" className={styles.logoImg} />
          </div>
          <div className={styles.tabs}>
            <button className={tab==='login'?styles.tab:styles.tab} onClick={()=>router.replace('/auth/login')}>Login</button>
            <button className={tab==='signup'?styles.tabActive:styles.tab} onClick={()=>setTab('signup')}>Signup</button>
            <div className={styles.tabBarAccent} />
          </div>
          <div className={styles.sliderViewport}>
            <div className={styles.sliderTrack} style={{ transform: `translateX(${tab==='signup' ? '-50%' : '0%'})` }}>
              <div className={styles.pane}>
                <h1 className={styles.authTitle}>Login</h1>
              </div>
              <div className={styles.pane}>
                <h1 className={styles.authTitle}>Create account</h1>
              </div>
            </div>
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <form onSubmit={onSubmit}>
            <div className={styles.field}>
              <label htmlFor="username">Username</label>
              <input id="username" className={styles.input} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose a username" />
            </div>
            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <input id="password" type="password" className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" />
            </div>
            <div className={styles.field}>
              <label htmlFor="confirm">Confirm password</label>
              <input id="confirm" type="password" className={styles.input} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" />
            </div>
            <button className={styles.submit} type="submit">Sign up</button>
          </form>
          <p className={styles.muted}>Have an account? <a href="/auth/login">Sign in</a></p>
        </section>
        <div className={styles.cornerSocials}><Socials /></div>
      </main>
    </div>
  )
}

export default SignupPage
