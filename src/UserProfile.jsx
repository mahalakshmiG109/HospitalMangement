import './App.css'

function UserProfile({ userName, onSignOut, onBackHome, onOpenSymptoms }) {
  return (
    <div className="profile-page">
      <section className="profile-shell">
        <div className="wrap profile-card">
          <div className="profile-header">
            <div>
              <span className="eyebrow">
                <span className="dot"></span> Your profile
              </span>
              <h1>Welcome back, {userName}</h1>
              <p className="profile-subtitle">
                Manage your account details, access privileges, and session actions from a clean, secure workspace.
              </p>
            </div>
            <button type="button" className="btn btn-ghost profile-signout" onClick={onSignOut}>
              Sign out
            </button>
          </div>

          <div className="profile-main-grid">
            <aside className="profile-summary-card">
              <div className="profile-avatar-large">{userName.charAt(0).toUpperCase()}</div>
              <div className="profile-name">
                <h2>{userName}</h2>
                <p>Patient / Hospital User</p>
              </div>

              <div className="profile-badges">
                <span className="badge badge-success">Active</span>
                <span className="badge badge-soft">Dashboard access</span>
              </div>

              <div className="profile-summary-text">
                <p>
                  You can return to the home dashboard, review your profile details, and keep your account
                  information up to date.
                </p>
              </div>
            </aside>

            <div className="profile-details-card">
              <div className="profile-details-grid">
                <div>
                  <strong>Username</strong>
                  <span>{userName}</span>
                </div>
                <div>
                  <strong>Status</strong>
                  <span>Active account</span>
                </div>
                <div>
                  <strong>Access</strong>
                  <span>Hospital management dashboard</span>
                </div>
                <div>
                  <strong>Location</strong>
                  <span>Andhra Pradesh, India</span>
                </div>
              </div>

              <div className="profile-note">
                <h3>Secure access</h3>
                <p>
                  Your profile is protected with secure session controls. Sign out when you are finished and
                  keep your password private.
                </p>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button type="button" className="btn btn-secondary" onClick={onOpenSymptoms}>
              Symptom checker
            </button>
            <button type="button" className="btn btn-primary" onClick={onBackHome}>
              Go to home
            </button>
            <button type="button" className="btn btn-ghost" onClick={onSignOut}>
              Sign out
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default UserProfile
