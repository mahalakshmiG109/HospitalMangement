import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient'

function ProtectedRoute({ allowedRoles }) {
  const location = useLocation()
  const [state, setState] = useState({ loading: true, user: null, role: null })

  useEffect(() => {
    let active = true
    async function loadSession() {
      if (!supabase) {
        setState({ loading: false, user: null, role: null })
        return
      }
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        if (active) setState({ loading: false, user: null, role: null })
        return
      }
      const { data } = await supabase.from('profiles').select('role').eq('user_id', session.user.id).single()
      if (active) setState({ loading: false, user: session.user, role: data?.role || session.user.user_metadata?.role })
    }
    loadSession()
    return () => { active = false }
  }, [location.pathname])

  if (state.loading) return <div className="route-loading">Checking secure access...</div>
  if (!state.user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!allowedRoles.includes(state.role)) return <Navigate to={`/${state.role || 'login'}/dashboard`} replace />
  return <Outlet context={{ user: state.user, role: state.role }} />
}

export default ProtectedRoute
