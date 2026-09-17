import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import './App.css'
import { getPossibleConditions, redFlagOptions, symptomOptions } from './symptomRules'

function SymptomsChecker() {
  const navigate = useNavigate()
  const { user } = useOutletContext()
  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const [redFlags, setRedFlags] = useState([])
  const [age, setAge] = useState('')
  const [sex, setSex] = useState('')
  const [pregnant, setPregnant] = useState('')
  const [conditions, setConditions] = useState('')
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState(null)

  const toggleValue = (value, setter) => setter((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (selectedSymptoms.length === 0 || !age || !duration) return
    setResult({
      urgent: redFlags.length > 0 || Number(age) < 3 && selectedSymptoms.includes('fever'),
      conditions: getPossibleConditions(selectedSymptoms),
    })
  }

  const resetChecker = () => {
    setResult(null)
    setSelectedSymptoms([])
    setRedFlags([])
    setAge('')
    setSex('')
    setPregnant('')
    setConditions('')
    setDuration('')
    setNotes('')
  }

  const displayName = user?.user_metadata?.full_name || 'Patient'

  return (
    <div className="symptoms-page">
      <section className="symptoms-shell">
        <div className="wrap symptoms-card">
          <div className="symptoms-header">
            <div>
              <span className="eyebrow">
                <span className="dot"></span> Symptom checker
              </span>
              <h1>Let&apos;s understand how you feel, {displayName}.</h1>
              <p className="profile-subtitle">
                This private, local tool offers general information from the symptoms you select. It does not diagnose illness.
              </p>
            </div>
            <button type="button" className="btn btn-ghost profile-signout" onClick={() => navigate('/patient/dashboard')}>
              Dashboard
            </button>
          </div>

          {!result ? <form className="symptoms-form" onSubmit={handleSubmit}>
            <fieldset className="symptom-picker">
              <legend>What are you experiencing? <span className="required">*</span></legend>
              <div className="symptom-options">
                {symptomOptions.map((option) => <label className={`symptom-option ${selectedSymptoms.includes(option.id) ? 'selected' : ''}`} key={option.id}>
                  <input type="checkbox" checked={selectedSymptoms.includes(option.id)} onChange={() => toggleValue(option.id, setSelectedSymptoms)} />
                  <span>{option.label}</span>
                </label>)}
              </div>
            </fieldset>

            <div className="checker-details-grid">
              <label>Age <span className="required">*</span><input type="number" min="0" max="120" value={age} onChange={(event) => setAge(event.target.value)} placeholder="Years" required /></label>
              <label>Symptoms for <span className="required">*</span><select value={duration} onChange={(event) => setDuration(event.target.value)} required><option value="">Select duration</option><option value="less-than-day">Less than a day</option><option value="1-3-days">1–3 days</option><option value="4-7-days">4–7 days</option><option value="more-than-week">More than a week</option></select></label>
              <label>Sex<select value={sex} onChange={(event) => setSex(event.target.value)}><option value="">Prefer not to say</option><option>Female</option><option>Male</option><option>Other</option></select></label>
              <label>Pregnant or may be pregnant?<select value={pregnant} onChange={(event) => setPregnant(event.target.value)}><option value="">Prefer not to say</option><option>Yes</option><option>No</option></select></label>
            </div>

            <label className="wide-field">Existing conditions or medicines<textarea value={conditions} onChange={(event) => setConditions(event.target.value)} placeholder="For example: asthma, diabetes, allergies, or regular medicines" /></label>
            <label className="wide-field">Anything else we should know?<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add context such as symptom severity or recent exposure" /></label>

            <fieldset className="red-flag-fieldset">
              <legend>Do any urgent warning signs apply?</legend>
              <p>Select any that apply. These signs need prompt medical attention.</p>
              <div className="red-flag-options">{redFlagOptions.map((option) => <label key={option.id}><input type="checkbox" checked={redFlags.includes(option.id)} onChange={() => toggleValue(option.id, setRedFlags)} /><span>{option.label}</span></label>)}</div>
            </fieldset>

            <div className="form-actions"><button type="button" className="btn btn-ghost" onClick={() => navigate('/patient/dashboard')}>Back</button><button type="submit" className="btn btn-primary">Check symptoms</button></div>
          </form> : <section className="checker-results" aria-live="polite">
            {result.urgent ? <div className="urgent-result"><span className="result-label">Priority care</span><h2>Consult a Doctor now</h2><p>Your answers include a warning sign, or a fever in a child under 3. Please seek urgent medical help. Do not rely on this checker to assess an emergency.</p><button className="btn btn-primary" type="button" onClick={() => navigate('/patient/appointments')}>Book an appointment</button></div> : <>
              <div className="result-heading"><span className="kicker">Local rule-based guidance</span><h2>Possible explanations</h2><p>These are possibilities based only on the details selected, not a confirmed diagnosis.</p></div>
              {result.conditions.length === 0 ? <div className="no-result"><h3>No clear match found</h3><p>Because symptoms can have many causes, please arrange a clinician review if you are concerned or symptoms continue.</p></div> : <div className="condition-list">{result.conditions.map((condition) => <article className="condition-result" key={condition.id}><div><h3>{condition.name}</h3><p>{condition.summary}</p></div><div className="result-columns"><div><strong>Basic care</strong><ul>{condition.care.map((item) => <li key={item}>{item}</li>)}</ul></div><div><strong>OTC guidance</strong><p><b>{condition.otc.name}:</b> {condition.otc.guidance}</p><p className="safety-note">Safety: {condition.otc.warnings}</p></div></div></article>)}</div>}
              <div className="result-actions"><button className="btn btn-primary" type="button" onClick={() => navigate('/patient/appointments')}>Consult a Doctor</button><button className="btn btn-ghost" type="button" onClick={resetChecker}>Start again</button></div>
            </>}
            <p className="medical-disclaimer"><strong>Medical disclaimer:</strong> This tool is informational only and is not a medical diagnosis or a substitute for professional care. Do not start antibiotics or prescription medicines based on this result. Ask a doctor or pharmacist before taking any medicine, especially for children, pregnancy, allergies, or existing conditions.</p>
          </section>}
        </div>
      </section>
    </div>
  )
}

export default SymptomsChecker
