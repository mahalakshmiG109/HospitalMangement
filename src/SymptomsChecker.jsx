import { useState } from 'react'
import './App.css'

const symptomsOptions = [
  'Fever',
  'Headache',
  'Cold',
  'Cough',
  'Body pains',
  'Fatigue',
  'Sore throat',
]

const ageOptions = ['0-10', '11-19', '20-50', '51-100']

function SymptomsChecker({ onBack, onSignOut }) {
  const [symptom, setSymptom] = useState('')
  const [gender, setGender] = useState('')
  const [age, setAge] = useState('')
  const [report, setReport] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!symptom || !gender || !age || !report.trim()) {
      return
    }
    alert('Symptom information submitted successfully!')
  }

  return (
    <div className="symptoms-page">
      <section className="symptoms-shell">
        <div className="wrap symptoms-card">
          <div className="symptoms-header">
            <div>
              <span className="eyebrow">
                <span className="dot"></span> Symptom checker
              </span>
              <h1>Tell us how you feel today</h1>
              <p className="profile-subtitle">
                Select your symptoms, gender, age range, and provide a short health report to help us guide you.
              </p>
            </div>
            <button type="button" className="btn btn-ghost profile-signout" onClick={onSignOut}>
              Sign out
            </button>
          </div>

          <form className="symptoms-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label>
                Symptom <span className="required">*</span>
                <select value={symptom} onChange={(e) => setSymptom(e.target.value)} required>
                  <option value="">Select symptom</option>
                  {symptomsOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <fieldset className="gender-fieldset">
                <legend>
                  Gender <span className="required">*</span>
                </legend>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="gender"
                    value="Male"
                    checked={gender === 'Male'}
                    onChange={(e) => setGender(e.target.value)}
                    required
                  />
                  Male
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="gender"
                    value="Female"
                    checked={gender === 'Female'}
                    onChange={(e) => setGender(e.target.value)}
                    required
                  />
                  Female
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="gender"
                    value="Other"
                    checked={gender === 'Other'}
                    onChange={(e) => setGender(e.target.value)}
                    required
                  />
                  Other
                </label>
              </fieldset>
            </div>

            <div className="form-row">
              <label>
                Age range <span className="required">*</span>
                <select value={age} onChange={(e) => setAge(e.target.value)} required>
                  <option value="">Select age range</option>
                  {ageOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-row textarea-row">
              <label>
                Previous health report <span className="required"></span>
                <textarea
                  value={report}
                  onChange={(e) => setReport(e.target.value)}
                  placeholder="Describe any previous illnesses, medical conditions, or ongoing treatment"
                  required
                ></textarea>
              </label>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-ghost" onClick={onBack}>
                Back
              </button>
              <button type="submit" className="btn btn-primary">
                Submit
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}

export default SymptomsChecker
