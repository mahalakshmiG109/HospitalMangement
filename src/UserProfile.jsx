import './App.css'

function UserProfile({ userName, onSignOut, onBackHome }) {
  return (
    <div className="auth-page">
      <section className="auth-shell">
        <div className="wrap auth-card profile-card">
          <div className="auth-header">
            <span className="eyebrow">
              <span className="dot"></span> Your profile
            </span>
            <h1>Welcome back, {userName}</h1>
            <p>You are signed in and can view your account details here.</p>
          </div>

          <div className="profile-box">
            <div className="profile-avatar">{userName.charAt(0).toUpperCase()}</div>
            <div>
              <h2>{userName}</h2>
              <p className="profile-role">Patient / Hospital User</p>
            </div>
          </div>

          <div className="profile-info">
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
          </div>

          <div className="profile-actions">
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
