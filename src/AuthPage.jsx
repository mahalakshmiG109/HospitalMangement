import { useState } from 'react'
import './App.css'
import { supabase } from './supabaseClient'
import UserProfile from './UserProfile'
import SymptomsChecker from './SymptomsChecker'

function AuthPage({ onBackHome }) {
  const [isSignUp, setIsSignUp] = useState(true)
  const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '' })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [loading, setLoading] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [showSymptoms, setShowSymptoms] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const username = formData.username.trim()
    const password = formData.password

    if (!username || !password) {
      setMessage('Please enter both a username and password.')
      setMessageType('error')
      return
    }

    if (isSignUp && password !== formData.confirmPassword) {
      setMessage('Passwords do not match.')
      setMessageType('error')
      return
    }

    if (!supabase) {
      setMessage('Supabase is not configured yet. Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values first.')
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')
    setMessageType('')

    try {
      if (isSignUp) {
        const { data: existingUser, error: selectError } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .maybeSingle()

        if (selectError) throw selectError
        if (existingUser) {
          setMessage('That username already exists. Please choose another one.')
          setMessageType('error')
          setLoading(false)
          return
        }

        const { error: insertError } = await supabase.from('users').insert([{ username, password }])

        if (insertError) throw insertError

        setMessage('Account created successfully. You can now sign in.')
        setMessageType('success')
        setFormData({ username: '', password: '', confirmPassword: '' })
        setIsSignUp(false)
      } else {
        const { data, error } = await supabase
          .from('users')
          .select('username')
          .eq('username', username)
          .eq('password', password)
          .maybeSingle()

        if (error) throw error
        if (!data) {
          setMessage('Invalid username or password.')
          setMessageType('error')
          return
        }

        setLoggedInUser(data.username)
        setMessage(`Welcome back, ${data.username}!`)
        setMessageType('success')
        setFormData({ username: '', password: '', confirmPassword: '' })
      }
    } catch (error) {
      setMessage(error.message || 'Something went wrong while saving your data.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  if (loggedInUser) {
    if (showSymptoms) {
      return <SymptomsChecker onBack={() => setShowSymptoms(false)} onSignOut={() => setLoggedInUser(null)} />
    }

    return (
      <UserProfile
        userName={loggedInUser}
        onSignOut={() => setLoggedInUser(null)}
        onBackHome={onBackHome}
        onOpenSymptoms={() => setShowSymptoms(true)}
      />
    )
  }

  return (
    <div className="auth-page">
      <section className="auth-shell">
        <div className="wrap auth-card">
          <div className="auth-header">
            <span className="eyebrow">
              <span className="dot"></span> Simple Supabase storage
            </span>
            <h1>{isSignUp ? 'Create your account' : 'Sign in to your account'}</h1>
            <p>
              This version stores the username and password directly in a Supabase table named
              users.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
              <label>
                Username
                <input
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                />
              </label>

              <label>
                Password
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                />
              </label>

              {isSignUp && (
                <label>
                  Confirm password
                  <input
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                  />
                </label>
              )}

              <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                {loading ? 'Please wait...' : isSignUp ? 'Sign up' : 'Sign in'}
              </button>
            </form>

          {message && <div className={`status-message ${messageType}`}>{message}</div>}

          <div className="auth-toggle">
            {isSignUp ? (
              <p>
                Already have an account?{' '}
                <button type="button" onClick={() => setIsSignUp(false)}>
                  Sign in
                </button>
              </p>
            ) : (
              <p>
                New here?{' '}
                <button type="button" onClick={() => setIsSignUp(true)}>
                  Create account
                </button>
              </p>
            )}
          </div>

          <button type="button" className="btn btn-ghost auth-back" onClick={onBackHome}>
            Back to home
          </button>
        </div>
      </section>
    </div>
  )
}

export default AuthPage
