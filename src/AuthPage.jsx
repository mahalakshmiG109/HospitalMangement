import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'

const initialForm = { fullName: '', email: '', password: '', confirmPassword: '', phone: '', role: 'patient' }

function AuthPage({ mode = 'login' }) {
  const isSignUp = mode === 'signup'
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [loading, setLoading] = useState(false)
  const update = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }))
  const showError = (text) => { setMessage(text); setMessageType('error') }

  async function submit(event) {
    event.preventDefault()
    if (isSignUp && !form.fullName.trim()) return showError('Please enter your full name.')
    if (!form.email.trim() || !form.password) return showError('Please enter your email and password.')
    if (form.password.length < 6) return showError('Password must be at least 6 characters.')
    if (isSignUp && form.password !== form.confirmPassword) return showError('Passwords do not match.')
    if (isSignUp && !form.phone.trim()) return showError('Please enter your phone number.')
    if (!supabase) return showError('Supabase is not configured. Add the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values.')
    setLoading(true); setMessage('')
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email: form.email.trim(), password: form.password, options: { data: { full_name: form.fullName.trim(), phone: form.phone.trim(), role: form.role } } })
        if (error) throw error
        if (data.session) navigate(`/${form.role}/dashboard`, { replace: true })
        else { setMessage('Account created. Check your email to confirm your account, then log in.'); setMessageType('success') }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password })
        if (error) throw error
        const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('user_id', data.user.id).single()
        if (profileError || !profile?.role) throw new Error('Your account profile is incomplete. Please contact an administrator.')
        navigate(`/${profile.role}/dashboard`, { replace: true })
      }
    } catch (authError) { showError(authError.message || 'Authentication failed.') } finally { setLoading(false) }
  }

  return <div className="auth-page"><section className="auth-shell"><div className="wrap auth-card"><div className="auth-header"><span className="eyebrow"><span className="dot" /> Secure hospital access</span><h1>{isSignUp ? 'Create your account' : 'Welcome back'}</h1><p>{isSignUp ? 'Join Andhra Hospitals with a role-based account for secure care coordination.' : 'Sign in to continue to your hospital workspace.'}</p></div><form className="auth-form" onSubmit={submit}>{isSignUp && <><label>Full name<input name="fullName" value={form.fullName} onChange={update} autoComplete="name" /></label><label>Phone number<input name="phone" type="tel" value={form.phone} onChange={update} autoComplete="tel" /></label><fieldset className="role-fieldset"><legend>Account role</legend><div className="role-options">{['patient', 'doctor', 'admin'].map((role) => <label key={role}><input type="radio" name="role" value={role} checked={form.role === role} onChange={update} /> {role[0].toUpperCase() + role.slice(1)}</label>)}</div></fieldset></>}<label>Email<input name="email" type="email" value={form.email} onChange={update} autoComplete="email" /></label><label>Password<input name="password" type="password" value={form.password} onChange={update} autoComplete={isSignUp ? 'new-password' : 'current-password'} /></label>{isSignUp && <label>Confirm password<input name="confirmPassword" type="password" value={form.confirmPassword} onChange={update} autoComplete="new-password" /></label>}<button type="submit" className="btn btn-primary auth-submit" disabled={loading}>{loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Login'}</button></form>{message && <div className={`status-message ${messageType}`}>{message}</div>}<div className="auth-toggle"><p>{isSignUp ? 'Already have an account?' : 'New here?'} <Link to={isSignUp ? '/login' : '/signup'}>{isSignUp ? 'Login' : 'Create account'}</Link></p></div><Link className="btn btn-ghost auth-back" to="/">Back to home</Link></div></section></div>
}

export default AuthPage
