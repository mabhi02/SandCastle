'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SideBar } from '@/components/nav/SideBar'
// Navbar removed for auth pages
import styles from '@/components/utils/auth.module.scss'
import ContourCanvas from '@/components/utils/ContourCanvas'
import { Socials } from '@/components/nav/Socials'
import { loginUser, getSession, registerUser } from '@/components/utils/auth'

const LoginPage = () => {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [signupUsername, setSignupUsername] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupConfirm, setSignupConfirm] = useState('')
  const [tab, setTab] = useState<'login'|'signup'>('login')

  useEffect(() => {
    const session = getSession()
    if (session) {
      router.replace('/app')
    }
  }, [router])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = loginUser(username.trim(), password)
    if (!res.ok) {
      setError(res.error || 'Login failed')
      return
    }
    router.replace('/app')
  }

  function onSignupSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (signupPassword !== signupConfirm) {
      setError('Passwords do not match')
      return
    }
    const res = registerUser(signupUsername.trim(), signupPassword)
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
            <button className={tab==='login'?styles.tabActive:styles.tab} onClick={()=>setTab('login')}>Login</button>
            <button className={tab==='signup'?styles.tabActive:styles.tab} onClick={()=>setTab('signup')}>Signup</button>
            <div className={styles.tabBarAccent} />
          </div>

          <div className={styles.sliderViewport}>
            <div className={styles.sliderTrack} style={{ transform: `translateX(${tab==='login' ? '0%' : '-50%'})` }}>
              <div className={styles.pane}>
                <h1 className={styles.authTitle}>Login</h1>
                {error && <div className={styles.error}>{error}</div>}
                <form onSubmit={onSubmit}>
                  <div className={styles.field}>
                    <label htmlFor="username">Username</label>
                    <input id="username" className={styles.input} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="password">Password</label>
                    <input id="password" type="password" className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />
                  </div>
                  <button className={styles.submit} type="submit">Sign in</button>
                </form>
              </div>
              <div className={styles.pane}>
                <h1 className={styles.authTitle}>Create account</h1>
                <form onSubmit={onSignupSubmit}>
                  <div className={styles.field}>
                    <label htmlFor="s-username">Username</label>
                    <input id="s-username" className={styles.input} value={signupUsername} onChange={(e)=>setSignupUsername(e.target.value)} placeholder="Choose a username" />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="s-password">Password</label>
                    <input id="s-password" type="password" className={styles.input} value={signupPassword} onChange={(e)=>setSignupPassword(e.target.value)} placeholder="Create a password" />
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="s-confirm">Confirm password</label>
                    <input id="s-confirm" type="password" className={styles.input} value={signupConfirm} onChange={(e)=>setSignupConfirm(e.target.value)} placeholder="Repeat password" />
                  </div>
                  <button className={styles.submit} type="submit">Sign up</button>
                </form>
              </div>
            </div>
          </div>
        </section>
        <div className={styles.cornerSocials}><Socials /></div>
      </main>
    </div>
  )
}

export default LoginPage


