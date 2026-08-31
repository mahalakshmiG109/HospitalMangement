import { useOutletContext, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './PatientDashboard.css'

const patientActions = [
  ['01', 'Book an appointment', 'Find a doctor and request a convenient consultation.'],
  ['02', 'My appointments', 'See upcoming visits and your appointment history.'],
  ['03', 'Medical records', 'Keep your reports and care history in one place.'],
  ['04', 'Symptom checker', 'Record symptoms before speaking with your care team.'],
  ['05', 'Care team', 'View doctors and services available at Andhra Hospitals.'],
  ['06', 'Notifications', 'Stay informed about appointments and care updates.'],
]

function BedAvailabilityView() {
  const navigate = useNavigate()
  const [beds, setBeds] = useState([])
  const [wards, setWards] = useState([])
  const [stats, setStats] = useState({ total: 0, available: 0, occupied: 0, reserved: 0, maintenance: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      setError(null)

      const { data: bedsData, error: bedsError } = await supabase.from('beds').select('*, wards(id, name, floor)')
      if (bedsError) throw bedsError

      const { data: wardsData, error: wardsError } = await supabase.from('wards').select('*').order('floor')
      if (wardsError) throw wardsError

      setBeds(bedsData || [])
      setWards(wardsData || [])

      if (bedsData) {
        const statusCounts = {
          total: bedsData.length,
          available: bedsData.filter(b => b.status === 'Available').length,
          occupied: bedsData.filter(b => b.status === 'Occupied').length,
          reserved: bedsData.filter(b => b.status === 'Reserved').length,
          maintenance: bedsData.filter(b => b.status === 'Maintenance').length,
        }
        setStats(statusCounts)
      }
    } catch (err) {
      console.error('Error fetching bed data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'Available':
        return '#f5f5f5' // white/light
      case 'Occupied':
        return '#c92a2a' // red
      case 'Reserved':
        return '#f59e0b' // orange
      case 'Maintenance':
        return '#6b7280' // gray
      default:
        return '#9ca3af'
    }
  }

  function groupBedsByWard() {
    const grouped = {}
    beds.forEach(bed => {
      const wardName = bed.wards?.name || 'Unknown Ward'
      if (!grouped[wardName]) {
        grouped[wardName] = []
      }
      grouped[wardName].push(bed)
    })
    return grouped
  }

  function handleBookBed() {
    navigate('/patient/bed-booking')
  }

  const wardGroups = groupBedsByWard()

  return (
    <div className="bed-availability-view">
      <div className="bed-section-header">
        <div>
          <h2>Bed Availability Status</h2>
          <p>View real-time hospital bed availability across all wards</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchData} disabled={loading} className="btn btn-sm btn-outline">
            {loading ? 'Refreshing...' : '↻ Refresh'}
          </button>
          <button onClick={handleBookBed} className="btn btn-primary btn-lg">
            BOOK YOUR BED
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>Error loading bed data: {error}</span>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-available">
          <div className="stat-color available"></div>
          <div className="stat-content">
            <div className="stat-value">{stats.available}</div>
            <div className="stat-label">Available</div>
          </div>
        </div>
        <div className="stat-card stat-occupied">
          <div className="stat-color occupied"></div>
          <div className="stat-content">
            <div className="stat-value">{stats.occupied}</div>
            <div className="stat-label">Occupied</div>
          </div>
        </div>
        <div className="stat-card stat-reserved">
          <div className="stat-color reserved"></div>
          <div className="stat-content">
            <div className="stat-value">{stats.reserved}</div>
            <div className="stat-label">Reserved</div>
          </div>
        </div>
        <div className="stat-card stat-maintenance">
          <div className="stat-color maintenance"></div>
          <div className="stat-content">
            <div className="stat-value">{stats.maintenance}</div>
            <div className="stat-label">Maintenance</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="legend-section">
        <div className="legend-item">
          <input type="checkbox" disabled checked />
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-box" style={{ backgroundColor: '#147d77' }}></div>
          <span>Occupied</span>
        </div>
        <div className="legend-item">
          <div className="legend-box" style={{ backgroundColor: '#0ab3a4' }}></div>
          <span>Reserved</span>
        </div>
        <div className="legend-item">
          <div className="legend-box" style={{ backgroundColor: '#9baaa9' }}></div>
          <span>Selected</span>
        </div>
      </div>

      {/* Beds by Ward Grid */}
      <div className="beds-section">
        {loading ? (
          <div className="loading-state">Loading bed availability...</div>
        ) : Object.keys(wardGroups).length === 0 ? (
          <div className="empty-state">
            <p>No wards available.</p>
          </div>
        ) : (
          <div className="wards-container">
            {Object.entries(wardGroups).map(([wardName, wardBeds]) => (
              <div key={wardName} className="ward-section">
                <h3 className="ward-name">{wardName}</h3>
                <div className="beds-grid-visual">
                  {wardBeds.map((bed) => (
                    <div
                      key={bed.id}
                      className="bed-square"
                      style={{ backgroundColor: getStatusColor(bed.status) }}
                      title={`${bed.bed_id} - ${bed.status}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PatientDashboard() {
  const { user } = useOutletContext()
  const navigate = useNavigate()
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Patient'

  async function handleLogout() {
    await supabase?.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="dashboard-page">
      <div className="wrap dashboard-shell">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">
              <span className="dot" /> Patient workspace
            </span>
            <h1>Your care, in one place.</h1>
            <p>Manage appointments, records, and the next step in your care journey.</p>
          </div>
          <button className="btn btn-ghost" onClick={handleLogout}>
            Logout
          </button>
        </header>
        <section className="patient-hero">
          <div>
            <span className="kicker">Good to see you</span>
            <h2>{name}</h2>
            <p>{user.email}</p>
          </div>
          <span className="badge badge-success">Patient</span>
        </section>
        <section className="dashboard-grid">
          {patientActions.map(([number, title, description]) => (
            <article className="dashboard-tile" key={title}>
              <span className="tagnum">{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <button className="tile-action" type="button">
                Open view <span aria-hidden="true">-&gt;</span>
              </button>
            </article>
          ))}
        </section>

        {/* Bed Availability Section */}
        <section className="bed-availability-section">
          <BedAvailabilityView />
        </section>
      </div>
    </div>
  )
}

export default PatientDashboard