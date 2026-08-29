import { useOutletContext, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'

const dashboardContent = {
  patient: { title: 'Patient dashboard', subtitle: 'Your care journey, organized in one calm workspace.', items: ['Profile', 'Book appointments', 'My appointments', 'Doctors', 'Medical records', 'Diagnosis / prediction', 'Notifications'] },
  doctor: { title: 'Doctor dashboard', subtitle: 'A focused view of today\'s care team and clinical decisions.', items: ['Profile', "Today's appointments", 'Patients', 'Appointment management', 'Patient medical information', 'Diagnosis / assessment', 'Notifications'] },
  admin: { title: 'Admin dashboard', subtitle: 'Hospital operations, capacity, and user access at a glance.', items: ['Statistics', 'Patients', 'Doctors', 'Appointments', 'Hospital beds', 'User management', 'System overview'] },
}

function DashboardPage({ role }) {
  const { user } = useOutletContext()
  const navigate = useNavigate()
  const content = dashboardContent[role]
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || role

  async function handleLogout() {
    await supabase?.auth.signOut()
    navigate('/login', { replace: true })
  }

  return <div className="dashboard-page"><div className="wrap dashboard-shell">
    <header className="dashboard-header"><div><span className="eyebrow"><span className="dot" /> Secure workspace</span><h1>{content.title}</h1><p>{content.subtitle}</p></div><button className="btn btn-ghost" onClick={handleLogout}>Logout</button></header>
    <div className="dashboard-welcome"><div><span className="kicker">Good to see you</span><h2>{name}</h2><p>{user.email}</p></div><span className="badge badge-success">{role}</span></div>
    <section className="dashboard-grid">{content.items.map((item, index) => <article className="dashboard-tile" key={item}><span className="tagnum">0{index + 1}</span><h3>{item}</h3><p>{role === 'patient' ? 'Review and manage your care details.' : role === 'doctor' ? 'Review the latest clinical workflow.' : 'Monitor and manage hospital operations.'}</p><button className="tile-action" type="button">Open view <span aria-hidden="true">-&gt;</span></button></article>)}</section>
  </div></div>
}

export default DashboardPage
