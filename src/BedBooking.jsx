import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient'
import './BedBooking.css'

function BedBooking() {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedBed, setSelectedBed] = useState(location.state?.bed || null)
  const [beds, setBeds] = useState([])
  const [wards, setWards] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingData, setBookingData] = useState({
    bedId: selectedBed?.id || '',
    admissionDate: new Date().toISOString().split('T')[0],
    reason: '',
    notes: '',
  })
  const [bookingStatus, setBookingStatus] = useState(null)
  const [filterWard, setFilterWard] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const { data: bedsData, error: bedsError } = await supabase
        .from('beds')
        .select('*, wards(id, name)')
        .eq('status', 'Available')

      const { data: wardsData, error: wardsError } = await supabase.from('wards').select('*')

      if (bedsError) throw bedsError
      if (wardsError) throw wardsError

      setBeds(bedsData || [])
      setWards(wardsData || [])
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  function getFilteredBeds() {
    if (filterWard === 'all') return beds
    return beds.filter((bed) => bed.wards?.id === filterWard)
  }

  async function handleBookBed() {
    if (!bookingData.bedId) {
      setBookingStatus({ type: 'error', message: 'Please select a bed' })
      return
    }

    if (!bookingData.admissionDate) {
      setBookingStatus({ type: 'error', message: 'Please select an admission date' })
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setBookingStatus({ type: 'error', message: 'User not authenticated' })
        return
      }

      // Create admission record
      const { error: admissionError } = await supabase.from('admissions').insert([
        {
          patient_id: user.id,
          bed_id: bookingData.bedId,
          ward_id: selectedBed?.ward_id,
          admission_date: bookingData.admissionDate,
          status: 'Active',
        },
      ])

      if (admissionError) throw admissionError

      // Update bed status to Reserved
      const { error: bedError } = await supabase
        .from('beds')
        .update({ status: 'Reserved' })
        .eq('id', bookingData.bedId)

      if (bedError) throw bedError

      setBookingStatus({
        type: 'success',
        message: 'Bed booked successfully! Redirecting to dashboard...',
      })

      setTimeout(() => {
        navigate('/patient/dashboard')
      }, 2000)
    } catch (err) {
      console.error('Error booking bed:', err)
      setBookingStatus({ type: 'error', message: err.message || 'Failed to book bed' })
    }
  }

  const filteredBeds = getFilteredBeds()
  const selectedBedData = beds.find((b) => b.id === bookingData.bedId)

  return (
    <div className="bed-booking-page">
      <div className="booking-container">
        <div className="booking-header">
          <button onClick={() => navigate('/patient/dashboard')} className="back-button">
            ← Back
          </button>
          <h1>Book Your Bed</h1>
          <p>Select an available bed and confirm your booking</p>
        </div>

        {bookingStatus && (
          <div className={`booking-alert booking-alert-${bookingStatus.type}`}>
            <span>{bookingStatus.message}</span>
            {bookingStatus.type === 'error' && (
              <button
                onClick={() => setBookingStatus(null)}
                className="alert-close"
              >
                ×
              </button>
            )}
          </div>
        )}

        <div className="booking-content">
          {/* Bed Selection Panel */}
          <div className="bed-selection-panel">
            <div className="panel-header">
              <h2>Select Your Bed</h2>
              <div className="filter-group">
                <label htmlFor="ward-filter">Filter by Ward:</label>
                <select
  id="ward-filter"
  value={filterWard}
  onChange={(e) => setFilterWard(e.target.value)}
  className="filter-select"
>
  <option value="all">All Wards</option>
  <option value="GENERAL WARD">GENERAL WARD</option>
  <option value="ICU">ICU</option>
  <option value="MATERNITY WARD">MATERNITY WARD</option>
  <option value="SURGICAL WARD">SURGICAL WARD</option>
  {wards.map((ward) => (
    <option key={ward.id} value={ward.id}>
      {ward.name}
    </option>
  ))}
</select>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">Loading available beds...</div>
            ) : filteredBeds.length === 0 ? (
              <div className="empty-state">
                <p>No available beds in the selected ward.</p>
                <button onClick={() => setFilterWard('all')} className="btn btn-secondary btn-sm">
                  View all beds
                </button>
              </div>
            ) : (
              <div className="beds-list">
                {filteredBeds.map((bed) => (
                  <div
                    key={bed.id}
                    className={`bed-option ${bookingData.bedId === bed.id ? 'selected' : ''}`}
                    onClick={() => setBookingData({ ...bookingData, bedId: bed.id })}
                  >
                    <div className="bed-option-content">
                      <div className="bed-option-main">
                        <div className="bed-id">{bed.bed_id}</div>
                        <div className="bed-info">
                          <span className="ward-name">{bed.wards?.name}</span>
                          <span className="bed-type">{bed.bed_type}</span>
                        </div>
                      </div>
                      <div className="bed-details-mini">
                        <span>Room: {bed.room_number}</span>
                        <span>Floor: {bed.floor}</span>
                      </div>
                    </div>
                    <div className="selection-indicator">
                      <input
                        type="radio"
                        name="bed-selection"
                        checked={bookingData.bedId === bed.id}
                        onChange={() => {}}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Booking Details Panel */}
          <div className="booking-details-panel">
            <div className="panel-header">
              <h2>Booking Details</h2>
            </div>

            {selectedBedData && (
              <div className="selected-bed-summary">
                <div className="summary-title">Selected Bed</div>
                <div className="summary-content">
                  <div className="summary-row">
                    <span className="label">Bed ID:</span>
                    <span className="value">{selectedBedData.bed_id}</span>
                  </div>
                  <div className="summary-row">
                    <span className="label">Ward:</span>
                    <span className="value">{selectedBedData.wards?.name}</span>
                  </div>
                  <div className="summary-row">
                    <span className="label">Bed Type:</span>
                    <span className="value">{selectedBedData.bed_type}</span>
                  </div>
                  <div className="summary-row">
                    <span className="label">Room:</span>
                    <span className="value">{selectedBedData.room_number}</span>
                  </div>
                  <div className="summary-row">
                    <span className="label">Floor:</span>
                    <span className="value">{selectedBedData.floor}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="admission-date">Admission Date:</label>
              <input
                id="admission-date"
                type="date"
                value={bookingData.admissionDate}
                onChange={(e) =>
                  setBookingData({ ...bookingData, admissionDate: e.target.value })
                }
                min={new Date().toISOString().split('T')[0]}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reason">Reason for Admission (Optional):</label>
              <input
                id="reason"
                type="text"
                placeholder="Enter reason for admission"
                value={bookingData.reason}
                onChange={(e) =>
                  setBookingData({ ...bookingData, reason: e.target.value })
                }
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Additional Notes (Optional):</label>
              <textarea
                id="notes"
                placeholder="Enter any additional notes or medical information"
                value={bookingData.notes}
                onChange={(e) =>
                  setBookingData({ ...bookingData, notes: e.target.value })
                }
                className="form-textarea"
                rows="4"
              />
            </div>

            <div className="booking-actions">
              <button
                onClick={() => navigate('/patient/dashboard')}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button onClick={handleBookBed} className="btn btn-primary" disabled={loading}>
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BedBooking
