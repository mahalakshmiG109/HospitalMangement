import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { supabase } from './supabaseClient'
import './Workflow.css'

const slotTimes = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00']

function nextDates(days = 14) {
  const dates = []
  const today = new Date()
  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(today)
    date.setDate(today.getDate() + offset)
    if (date.getDay() !== 0) dates.push(date.toISOString().slice(0, 10))
  }
  return dates
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${date}T00:00:00`))
}

function AppointmentPage() {
  const { user, role } = useOutletContext()
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState([])
  const [appointments, setAppointments] = useState([])
  const [profiles, setProfiles] = useState([])
  const [query, setQuery] = useState('')
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [selectedDate, setSelectedDate] = useState(nextDates()[0])
  const [selectedTime, setSelectedTime] = useState('')
  const [reason, setReason] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const dates = useMemo(() => nextDates(), [])

  const loadData = useCallback(async () => {
    if (!supabase) { setLoading(false); return }
    setLoading(true)
    const doctorsResult = await supabase.from('profiles').select('user_id, full_name, specialization, experience_years, availability, license_number').eq('role', 'doctor').order('full_name')
    const appointmentsResult = await supabase.from('appointments').select('*').order('appointment_date').order('appointment_time')
    const profilesResult = role === 'admin' || role === 'doctor'
      ? await supabase.from('profiles').select('user_id, full_name, email, role')
      : { data: [] }
    if (doctorsResult.error) setStatus({ type: 'error', message: doctorsResult.error.message })
    if (appointmentsResult.error) setStatus({ type: 'error', message: appointmentsResult.error.message })
    setDoctors(doctorsResult.data || [])
    setAppointments(appointmentsResult.data || [])
    setProfiles(profilesResult.data || [])
    setLoading(false)
  }, [role])

  useEffect(() => {
    const timer = setTimeout(loadData, 0)
    return () => clearTimeout(timer)
  }, [loadData])

  const filteredDoctors = doctors.filter((doctor) => `${doctor.full_name} ${doctor.specialization || ''}`.toLowerCase().includes(query.toLowerCase()))
  const bookedTimes = new Set(appointments.filter((appointment) => appointment.doctor_id === selectedDoctor?.user_id && appointment.appointment_date === selectedDate && appointment.status !== 'Cancelled').map((appointment) => appointment.appointment_time.slice(0, 5)))
  const patientAppointments = appointments.filter((appointment) => role === 'patient' && appointment.patient_id === user.id)
  const visibleAppointments = role === 'patient' ? patientAppointments : appointments.filter((appointment) => role === 'doctor' ? appointment.doctor_id === user.id : true)
  const profileName = (id) => profiles.find((profile) => profile.user_id === id)?.full_name || 'Hospital user'

  async function bookAppointment(event) {
    event.preventDefault()
    if (!supabase) return setStatus({ type: 'error', message: 'Supabase is not configured.' })
    if (!selectedDoctor || !selectedDate || !selectedTime) return setStatus({ type: 'error', message: 'Choose a doctor, date, and available time.' })
    setStatus(null)
    const { error } = await supabase.from('appointments').insert({ patient_id: user.id, doctor_id: selectedDoctor.user_id, appointment_date: selectedDate, appointment_time: selectedTime, reason: reason.trim() || null })
    if (error) {
      setStatus({ type: 'error', message: error.code === '23505' ? 'That slot was just booked. Choose another time.' : error.message })
      return loadData()
    }
    setStatus({ type: 'success', message: 'Appointment requested. Your care team can now confirm it.' })
    setSelectedTime('')
    setReason('')
    loadData()
  }

  async function updateAppointment(id, nextStatus) {
    const { error } = await supabase.from('appointments').update({ status: nextStatus, updated_at: new Date().toISOString() }).eq('id', id)
    setStatus(error ? { type: 'error', message: error.message } : { type: 'success', message: `Appointment ${nextStatus.toLowerCase()}.` })
    loadData()
  }

  return <div className="workflow-page"><div className="wrap workflow-shell">
    <header className="workflow-header"><div><button className="back-link" onClick={() => navigate(`/${role}/dashboard`)}>← Dashboard</button><span className="eyebrow"><span className="dot" /> Care scheduling</span><h1>{role === 'patient' ? 'Choose your doctor.' : 'Appointment operations.'}</h1><p>{role === 'patient' ? 'Find a clinician, choose a time, and request a visit.' : 'Review and update appointments assigned to your care team.'}</p></div></header>
    {status && <div className={`workflow-alert ${status.type}`}>{status.message}</div>}
    {role === 'patient' && <section className="workflow-grid appointment-grid"><div className="workflow-panel"><div className="panel-heading"><div><span className="kicker">01 / Care team</span><h2>Available doctors</h2></div><input className="search-input" placeholder="Search name or specialty" value={query} onChange={(event) => setQuery(event.target.value)} /></div>{loading ? <p className="empty-copy">Loading doctors...</p> : <div className="doctor-list">{filteredDoctors.map((doctor) => <button type="button" className={`doctor-card ${selectedDoctor?.user_id === doctor.user_id ? 'selected' : ''}`} key={doctor.user_id} onClick={() => { setSelectedDoctor(doctor); setSelectedTime('') }}><span className="doctor-avatar">{doctor.full_name?.charAt(0) || 'D'}</span><span><strong>{doctor.full_name}</strong><small>{doctor.specialization || 'General physician'} · {doctor.experience_years || 0} years</small><small>{doctor.availability || 'Appointments available this week'}</small></span><span className="doctor-arrow">→</span></button>)}</div>}</div>
      <div className="workflow-panel"><span className="kicker">02 / Time</span><h2>{selectedDoctor ? selectedDoctor.full_name : 'Select a doctor first'}</h2>{selectedDoctor && <><div className="date-strip">{dates.map((date) => <button type="button" className={selectedDate === date ? 'active' : ''} key={date} onClick={() => { setSelectedDate(date); setSelectedTime('') }}>{formatDate(date)}</button>)}</div><div className="slot-grid">{slotTimes.map((time) => <button type="button" disabled={bookedTimes.has(time)} className={`${selectedTime === time ? 'active' : ''} ${bookedTimes.has(time) ? 'booked' : ''}`} key={time} onClick={() => setSelectedTime(time)}>{time}{bookedTimes.has(time) && <small>Booked</small>}</button>)}</div><form onSubmit={bookAppointment} className="compact-form"><label>Reason for visit<input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Optional" /></label><button className="btn btn-primary" type="submit">Confirm appointment</button></form></>}</div></section>}
    <section className="workflow-panel appointment-history"><div className="panel-heading"><div><span className="kicker">03 / Record</span><h2>{role === 'patient' ? 'My appointments' : role === 'doctor' ? 'My booked appointments' : 'All appointments'}</h2></div><button className="btn btn-ghost" onClick={loadData}>Refresh</button></div>{visibleAppointments.length === 0 ? <p className="empty-copy">No appointments to show.</p> : <div className="table-wrap"><table><thead><tr><th>Date</th><th>Time</th><th>Patient</th><th>Doctor</th><th>Status</th>{role !== 'patient' && <th>Action</th>}</tr></thead><tbody>{visibleAppointments.map((appointment) => <tr key={appointment.id}><td>{formatDate(appointment.appointment_date)}</td><td>{appointment.appointment_time.slice(0, 5)}</td><td>{role === 'patient' ? 'You' : profileName(appointment.patient_id)}</td><td>{role === 'patient' ? profileName(appointment.doctor_id) : 'Your care team'}</td><td><span className={`status-pill ${appointment.status.toLowerCase()}`}>{appointment.status}</span></td>{role !== 'patient' && <td><select value={appointment.status} onChange={(event) => updateAppointment(appointment.id, event.target.value)}><option>Pending</option><option>Confirmed</option><option>Completed</option><option>Cancelled</option></select></td>}</tr>)}</tbody></table></div>}</section>
  </div></div>
}

export default AppointmentPage
