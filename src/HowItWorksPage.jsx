import { Link } from 'react-router-dom'

const audiences = [
  ['Patients', 'Start with symptoms, request an appointment, and keep your records and care instructions together.'],
  ['Doctors', 'Review structured intake, appointments, and diagnosis suggestions before confirming the clinical plan.'],
  ['Admins', 'Track beds, teams, appointments, and access permissions from a single operational overview.'],
]

function HowItWorksPage() {
  return <div className="how-page"><div className="wrap how-shell"><span className="eyebrow"><span className="dot" /> A connected care workflow</span><h1>How Andhra Hospitals works</h1><p className="lead">One shared system gives every role the right information at the right moment, while licensed clinicians keep final say.</p><section className="how-steps"><article><span>01</span><h2>Capture</h2><p>Symptoms, vitals, appointments, and capacity updates enter one secure record.</p></article><article><span>02</span><h2>Understand</h2><p>Diagnosis support organizes signals and gives care teams a clear starting point.</p></article><article><span>03</span><h2>Coordinate</h2><p>Patients, doctors, and hospital operators act from the same current information.</p></article></section><section className="audience-grid">{audiences.map(([title, text]) => <article className="about-card" key={title}><span className="kicker">For {title}</span><h2>{title}</h2><p>{text}</p></article>)}</section><Link className="btn btn-primary btn-lg" to="/">Back to home</Link></div></div>
}

export default HowItWorksPage
