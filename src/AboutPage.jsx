import './App.css'

function AboutPage({ onBackHome }) {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="wrap">
          <span className="eyebrow">
            <span className="dot"></span> About the project
          </span>
          <h1>Meridian Health is a digital hospital management and diagnosis platform designed to simplify care delivery.</h1>
          <p className="lead">
            The system combines patient intake, diagnosis support, bed tracking, and care reference in one place so hospitals can work faster while keeping clinical decisions human-led.
          </p>
          <div className="hero-cta">
            <button type="button" className="btn btn-primary btn-lg" onClick={onBackHome}>
              Back to home
            </button>
          </div>
        </div>
      </section>

      <section className="wrap about-grid">
        <article className="about-card">
          <span className="kicker">Project overview</span>
          <h2>What this project does</h2>
          <p>
            MediCare is built to support modern hospitals with a connected workflow for admissions, capacity planning, symptom collection, AI-assisted diagnosis suggestions, and treatment guidance.
          </p>
        </article>

        <article className="about-card">
          <span className="kicker">Core objectives</span>
          <h2>Why it was created</h2>
          <ul>
            <li>Reduce delays in patient admission and ward allocation</li>
            <li>Make diagnosis support faster and more structured</li>
            <li>Improve visibility across departments and hospital floors</li>
            <li>Provide a clear, centralized record for clinical staff</li>
          </ul>
        </article>
      </section>

      <section className="wrap about-grid about-grid-2">
        <article className="about-card">
          <span className="kicker">Main features</span>
          <h2>Key capabilities</h2>
          <ul>
            <li>Online appointment and patient intake workflow</li>
            <li>Real-time bed availability across ICU, maternity, isolation, and general wards</li>
            <li>AI-assisted disease prediction with confidence scoring</li>
            <li>Symptom and cure reference for treatment support</li>
            <li>Secure patient record management for hospital operations</li>
          </ul>
        </article>

        <article className="about-card">
          <span className="kicker">Who it serves</span>
          <h2>Target users</h2>
          <ul>
            <li>Patients seeking faster appointments and better care coordination</li>
            <li>Doctors reviewing prediction suggestions and clinical records</li>
            <li>Nurses and administrators tracking bed occupancy and intake flow</li>
            <li>Hospital teams that want a more connected workflow</li>
          </ul>
        </article>
      </section>

      <section className="wrap about-cta">
        <div className="quote-band about-band">
          <p className="quote">
            This project is designed to bring hospital management and diagnosis support into one modern experience while keeping the final medical decision in the hands of licensed professionals.
          </p>
          <div className="hero-cta">
            <button type="button" className="btn btn-ghost btn-lg" onClick={onBackHome}>
              Explore the homepage
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage
