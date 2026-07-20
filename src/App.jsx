import { useState } from 'react'
import './App.css'
import AboutPage from './AboutPage'

function App() {
  const [showAbout, setShowAbout] = useState(false)

  if (showAbout) {
    return <AboutPage onBackHome={() => setShowAbout(false)} />
  }

  return (
    <div className="app-shell">
      <div className="bg-field">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <svg className="bg-rings" viewBox="0 0 640 640">
          <circle cx="320" cy="320" r="120" />
          <circle cx="320" cy="320" r="200" />
          <circle cx="320" cy="320" r="280" />
        </svg>
        <div className="bg-grid"></div>
      </div>

      <header>
        <div className="wrap nav-row">
          <div className="brand">
            <div className="brand-mark">M+</div>
            <div>
              <div className="brand-name">MediCare</div>
              <div className="brand-sub">Management &amp; Diagnosis System</div>
            </div>
          </div>
          <nav className="links">
            <a href="#pillars">Platform</a>
            <a href="#flow">How it works</a>
            <a href="#trust">Trusted by</a>
            <a href="#cta">Pricing</a>
            <button type="button" className="nav-link-btn" onClick={() => setShowAbout(true)}>
              About
            </button>
          </nav>
          <div className="nav-cta">
            <a href="#" className="btn btn-ghost">Sign in</a>
            <a href="#cta" className="btn btn-primary">Request a demo</a>
          </div>
        </div>
      </header>

      <main>
        <div className="hero wrap">
          <span className="eyebrow">
            <span className="dot"></span> Live across 42 hospital floors right now
          </span>
          <h1>
            HOSPITAL MANAGEMENT AND <span className="accent">DIAGNOSIS</span> SYSTEM
          </h1>
          <p className="lead">
            Providing intelligent healthcare through online appointments, AI-assisted disease
            prediction, real-time bed availability, and secure patient management.
          </p>
          <div className="hero-cta">
            <a href="#cta" className="btn btn-primary btn-lg">
              Request a demo →
            </a>
            <a href="#flow" className="btn btn-ghost btn-lg">
              See how it works
            </a>
          </div>

          <div className="pulse-strip">
            <svg viewBox="0 0 1200 64" preserveAspectRatio="none">
              <path
                className="pulse-line"
                d="M0,32 L150,32 L168,32 L184,8 L200,56 L216,32 L246,32 L954,32 L970,14 L986,50 L1002,32 L1030,32 L1200,32"
              />
            </svg>
            <div className="stat-row">
              <div className="stat">
                <div className="num">3,140</div>
                <div className="label">Beds tracked in real time</div>
              </div>
              <div className="stat">
                <div className="num">96.4%</div>
                <div className="label">Prediction-to-diagnosis match rate</div>
              </div>
              <div className="stat">
                <div className="num">18m</div>
                <div className="label">Average admission wait time</div>
              </div>
              <div className="stat">
                <div className="num">42</div>
                <div className="label">Hospital floors live today</div>
              </div>
            </div>
          </div>
        </div>

        <section id="pillars">
          <div className="wrap">
            <div className="section-head">
              <span className="kicker">The platform</span>
              <h2>Three systems that used to live in three different places.</h2>
              <p>
                This platform brings bed logistics, diagnosis support, and treatment reference
                into a single record, so nothing gets re-typed, re-checked, or missed.
              </p>
            </div>

            <div className="pillars">
              <div className="pillar">
                <span className="tagnum">01</span>
                <div className="icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="10" width="18" height="8" rx="2" />
                    <path d="M3 14h18" />
                    <path d="M6 10V7a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3" />
                  </svg>
                </div>
                <h3>Bed availability</h3>
                <p>
                  Live occupancy across every ward — ICU, general, maternity, isolation —
                  updated the moment a patient is admitted, transferred, or discharged.
                </p>
                <div className="mini-bar">
                  <span style={{ width: '76%' }}></span>
                </div>
              </div>

              <div className="pillar">
                <span className="tagnum">02</span>
                <div className="icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 12h4l2-7 4 14 2-7h6" />
                  </svg>
                </div>
                <h3>Disease prediction</h3>
                <p>
                  Patients report symptoms; a trained model returns ranked, confidence-scored
                  conditions the doctor reviews, confirms, or overrides.
                </p>
                <div className="mini-bar">
                  <span style={{ width: '88%' }}></span>
                </div>
              </div>

              <div className="pillar">
                <span className="tagnum">03</span>
                <div className="icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M9 2h6l1 3h3a1 1 0 0 1 1 1v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1h3l1-3Z" />
                    <path d="M9 12h6M9 16h4" />
                  </svg>
                </div>
                <h3>Symptoms &amp; cure reference</h3>
                <p>
                  A curated, doctor-reviewed knowledge base ties every predicted condition to
                  standard treatment guidance — one click from prediction to plan.
                </p>
                <div className="mini-bar">
                  <span style={{ width: '64%' }}></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="flow">
          <div className="wrap">
            <div className="section-head">
              <span className="kicker">The flow</span>
              <h2>From symptom to signed-off diagnosis, in three steps.</h2>
            </div>
            <div className="flow">
              <div className="flow-step">
                <div className="flow-num">1</div>
                <h4>Symptoms are logged</h4>
                <p>
                  A nurse or patient enters symptoms, duration, and vitals at intake —
                  structured, not free-form guesswork.
                </p>
              </div>
              <div className="flow-step">
                <div className="flow-num">2</div>
                <h4>The model ranks conditions</h4>
                <p>
                  This platform returns a confidence-scored shortlist of likely conditions, with
                  the symptoms that drove each score.
                </p>
              </div>
              <div className="flow-step">
                <div className="flow-num">3</div>
                <h4>The doctor confirms</h4>
                <p>
                  The physician reviews, orders any confirmatory tests, and signs off — that
                  decision is what enters the record.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="trust">
          <div className="wrap">
            <div className="quote-band">
              <p className="quote">
                "Bed status used to live on a whiteboard. Now the ICU knows it's at 91% before
                I've finished my coffee — and the diagnosis shortlist saves us real minutes on
                every admission."
              </p>
              <div className="quote-attr">
                <div className="quote-avatar">DR</div>
                <div>
                  <div className="name">Available Doctor : General Physician</div>
                  <div className="role">Experience: 10+ Years , Available: Mon–Sat</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="cta">
          <div className="wrap cta-final">
            <h2>Bring your bed board, your intake sheets, and your diagnosis notes into one place.</h2>
            <p>
              Set up takes a week, not a quarter. Your clinical team keeps final say on every
              diagnosis.
            </p>
            <div className="hero-cta">
              <a href="#" className="btn btn-primary btn-lg">
                Request a demo →
              </a>
              <a href="#" className="btn btn-ghost btn-lg">
                Talk to sales
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div className="foot-row">
            <div className="brand">
              <div className="brand-mark" style={{ width: '30px', height: '30px', fontSize: '13px' }}>
                M+
              </div>
              <div className="brand-name">MediCare</div>
            </div>
            <div className="foot-links">
              <a href="#pillars">Platform</a>
              <a href="#flow">How it works</a>
              <a href="#">Security</a>
              <a href="#">Contact</a>
            </div>
          </div>
          <div className="foot-note">
            Advisory diagnosis support only — all clinical decisions are made and signed off by a
            licensed physician.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
