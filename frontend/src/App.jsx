import React, { useEffect, useMemo, useState } from 'react';

function App() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({ subject: '', from: '', to: '', minRating: '' });
  const [slots, setSlots] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [authToken, setAuthToken] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('bob.tutee@university.edu');
  const [loginPassword, setLoginPassword] = useState('bob-password');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [bookingSlotId, setBookingSlotId] = useState(null);
  const [bookingMessage, setBookingMessage] = useState(null);
  const [showLoginForm, setShowLoginForm] = useState(false);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setLoginLoading(true);
    setLoginMessage(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || 'Login failed');
      setAuthToken(payload.data.token);
      setCurrentUser(payload.data.user);
      setLoginMessage({ type: 'success', text: `Welcome, ${payload.data.user.name}!` });
      setShowLoginForm(false);
    } catch (err) {
      setLoginMessage({ type: 'error', text: err.message });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthToken('');
    setCurrentUser(null);
    setLoginMessage(null);
    setBookings([]);
    setBookingMessage(null);
    setActionMessage(null);
  };

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setHealthData(data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message || 'Failed to connect to backend API');
      setLastChecked(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const searchSlots = async (event) => {
    event?.preventDefault();
    setSearchLoading(true);
    setSearchError(null);
    setBookingMessage(null);

    const params = new URLSearchParams();
    if (filters.subject.trim()) params.set('subject', filters.subject.trim());
    if (filters.from) params.set('from', new Date(`${filters.from}T00:00:00`).toISOString());
    if (filters.to) params.set('to', new Date(`${filters.to}T23:59:59.999`).toISOString());
    if (filters.minRating) params.set('minRating', filters.minRating);

    try {
      const response = await fetch(`/api/slots?${params.toString()}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || 'Unable to search available slots');
      setSlots(payload.data || []);
    } catch (err) {
      setSearchError(err.message);
      setSlots([]);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    searchSlots();
  }, []);

  const slotsByDate = useMemo(() => slots.reduce((groups, slot) => {
    const date = new Date(slot.start_time).toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric'
    });
    groups[date] = groups[date] || [];
    groups[date].push(slot);
    return groups;
  }, {}), [slots]);

  const bookSlot = async (slotId) => {
    if (!authToken) {
      setBookingMessage({ type: 'error', text: 'Sign in and provide an authentication token before booking.' });
      return;
    }
    setBookingSlotId(slotId);
    setBookingMessage(null);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ slotId })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || 'Unable to book this slot');
      setBookingMessage({ type: 'success', text: 'Slot booked successfully.' });
      await searchSlots();
    } catch (err) {
      setBookingMessage({ type: 'error', text: err.message });
      await searchSlots();
    } finally {
      setBookingSlotId(null);
    }
  };

  const [bookings, setBookings] = useState([]);
  const [bookingFilter, setBookingFilter] = useState('upcoming');
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchBookings = async () => {
    if (!authToken) return;
    setBookingsLoading(true);
    setActionMessage(null);
    try {
      const response = await fetch(`/api/bookings?status=${bookingFilter}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || 'Failed to load bookings');
      setBookings(payload.data || []);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard' && authToken) {
      fetchBookings();
    }
  }, [activeTab, bookingFilter, authToken]);

  const cancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ reason: 'Cancelled from dashboard' })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || 'Failed to cancel booking');
      setActionMessage({ type: 'success', text: payload.message });
      fetchBookings();
      searchSlots();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const isConnected = healthData && (healthData.status === 'ok' || healthData.status === 'degraded');
  const dbConnected = healthData?.database?.status === 'connected';

  return (
    <div className="container">
      <header className="hero-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div className="badge">
            <span>🚀</span> Team 3 • Peer-to-Peer Tutoring Scheduler
          </div>
          {/* Auth status in top-right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {currentUser ? (
              <>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Signed in as <strong style={{ color: 'white' }}>{currentUser.name}</strong>
                  <span style={{ marginLeft: '0.4rem', padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem', background: currentUser.role === 'tutor' ? 'rgba(99,102,241,0.25)' : 'rgba(16,185,129,0.2)', color: currentUser.role === 'tutor' ? '#a5b4fc' : '#6ee7b7' }}>{currentUser.role}</span>
                </span>
                <button className="btn-secondary" onClick={handleLogout} style={{ padding: '0.35rem 0.9rem', fontSize: '0.82rem' }}>Sign out</button>
              </>
            ) : (
              <button className="btn" onClick={() => setShowLoginForm(v => !v)} style={{ padding: '0.4rem 1.1rem', fontSize: '0.85rem' }}>
                {showLoginForm ? 'Cancel' : '🔑 Sign in'}
              </button>
            )}
          </div>
        </div>

        {/* Inline login form — shown when not signed in and button clicked */}
        {showLoginForm && !currentUser && (
          <form onSubmit={handleLogin} style={{ marginTop: '1.25rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: '1 1 220px' }}>
              <label htmlFor="login-email" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>University email</label>
              <input
                id="login-email"
                type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="you@university.edu"
                required
                style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '0.9rem' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: '1 1 180px' }}>
              <label htmlFor="login-password" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Password</label>
              <input
                id="login-password"
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="Password"
                required
                style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '0.9rem' }}
              />
            </div>
            <button type="submit" className="btn" disabled={loginLoading} style={{ padding: '0.5rem 1.4rem', alignSelf: 'flex-end' }}>
              {loginLoading ? 'Signing in…' : 'Sign in'}
            </button>
            {loginMessage && (
              <p style={{ width: '100%', margin: 0, fontSize: '0.85rem', color: loginMessage.type === 'error' ? '#f87171' : '#6ee7b7' }}>
                {loginMessage.text}
              </p>
            )}
            <p style={{ width: '100%', margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Demo accounts — Tutee: <code>bob.tutee@university.edu / bob-password</code> &nbsp;|&nbsp; Tutors: <code>alice.tutor@university.edu</code>, <code>david.chen@university.edu</code>, <code>elena.gomez@university.edu</code>, <code>marcus.vance@university.edu</code> (passwords: <code>&lt;firstname&gt;-password</code>)
            </p>
          </form>
        )}

        <h1 className="title-gradient">Peer-to-Peer Tutoring Scheduler</h1>
        <p className="subtitle">
          Find tutors, book sessions, and manage your schedule — all in one place.
        </p>
      </header>

      <nav className="tab-navigation" role="tablist" aria-label="Main Navigation">
        <button
          role="tab"
          aria-selected={activeTab === 'overview'}
          aria-controls="slot-search"
          id="tab-overview"
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          🔍 Search & Book Slots
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'dashboard'}
          aria-controls="my-bookings-dashboard"
          id="tab-dashboard"
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📅 My Bookings Dashboard
        </button>
      </nav>

      <main>
        {activeTab === 'overview' && (
          <section className="glass-card search-card" id="slot-search" role="tabpanel" aria-labelledby="tab-overview">
            <div className="card-title">
              <h2>Find an available tutoring slot</h2>
              <span className="result-count">{slots.length} result{slots.length === 1 ? '' : 's'}</span>
            </div>
            <form className="search-form" onSubmit={searchSlots} aria-label="Tutoring Slot Search Form">
              <label htmlFor="filter-subject">
                Subject
                <select
                  id="filter-subject"
                  value={filters.subject}
                  onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                >
                  <option value="">All subjects</option>
                  <optgroup label="Computer Science">
                    <option value="Algorithms">Algorithms</option>
                    <option value="Algorithms & Complexity">Algorithms &amp; Complexity</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Data Structures">Data Structures</option>
                    <option value="Operating Systems">Operating Systems</option>
                    <option value="Database Systems">Database Systems</option>
                    <option value="Computer Networks">Computer Networks</option>
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Machine Learning">Machine Learning</option>
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                    <option value="Web Development">Web Development</option>
                  </optgroup>
                  <optgroup label="Mathematics">
                    <option value="Mathematics">Mathematics</option>
                    <option value="Discrete Mathematics">Discrete Mathematics</option>
                    <option value="Linear Algebra">Linear Algebra</option>
                    <option value="Calculus">Calculus</option>
                    <option value="Statistics">Statistics</option>
                    <option value="Probability">Probability</option>
                  </optgroup>
                  <optgroup label="Sciences">
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                  </optgroup>
                  <optgroup label="Other">
                    <option value="Economics">Economics</option>
                    <option value="English">English</option>
                    <option value="History">History</option>
                  </optgroup>
                </select>
              </label>
              <label htmlFor="filter-from">
                From Date
                <input
                  id="filter-from"
                  type="date"
                  value={filters.from}
                  onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                />
              </label>
              <label htmlFor="filter-to">
                To Date
                <input
                  id="filter-to"
                  type="date"
                  value={filters.to}
                  onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                />
              </label>
              <label htmlFor="filter-min-rating">
                Minimum tutor rating
                <select
                  id="filter-min-rating"
                  value={filters.minRating}
                  onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                >
                  <option value="">Any rating</option>
                  {[4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating}+ stars</option>)}
                </select>
              </label>
              <button
                className="btn search-button"
                type="submit"
                disabled={searchLoading}
                aria-label="Search available slots"
              >
                {searchLoading ? 'Searching...' : 'Search slots'}
              </button>
            </form>
            <div className="booking-controls">
              {!currentUser ? (
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                  👆 <button
                    className="btn-secondary"
                    onClick={() => { setShowLoginForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{ padding: '0.3rem 0.8rem', fontSize: '0.82rem' }}
                  >Sign in</button> to book a session.
                </p>
              ) : (
                <p style={{ fontSize: '0.88rem', color: '#6ee7b7', margin: 0 }}>
                  ✅ Signed in as <strong>{currentUser.name}</strong> — click <em>Book</em> on any slot below.
                </p>
              )}
              {bookingMessage && (
                <p
                  role="alert"
                  className={bookingMessage.type === 'error' ? 'message error-message' : 'message success-message'}
                >
                  {bookingMessage.text}
                </p>
              )}
            </div>
            {searchError && <p role="alert" className="message error-message">{searchError}</p>}
            {!searchLoading && !searchError && slots.length === 0 && <p className="empty-state">No future, unbooked slots match these filters.</p>}
            <div className="calendar-grid">
              {Object.entries(slotsByDate).map(([date, dateSlots]) => (
                <div className="calendar-day" key={date}>
                  <h3>{date}</h3>
                  {dateSlots.map((slot) => (
                    <article className="slot-card" key={slot.id} aria-label={`${slot.subject} slot by ${slot.tutor_name}`}>
                      <div>
                        <strong>{new Date(slot.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</strong>
                        <span>{slot.duration_minutes} min · {slot.subject}</span>
                      </div>
                      <div className="slot-meta">
                        <span>{slot.tutor_name} · ★ {Number(slot.tutor_rating).toFixed(1)}</span>
                        <button
                          className="btn book-button"
                          onClick={() => bookSlot(slot.id)}
                          disabled={bookingSlotId === slot.id}
                          aria-label={`Book slot for ${slot.subject} with ${slot.tutor_name}`}
                        >
                          {bookingSlotId === slot.id ? 'Booking...' : 'Book'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'dashboard' && (
          <section className="glass-card" id="my-bookings-dashboard" role="tabpanel" aria-labelledby="tab-dashboard">
            <div className="card-title">
              <h2>My Bookings Dashboard (TUT-F-040)</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className={`btn-secondary ${bookingFilter === 'upcoming' ? 'active' : ''}`}
                  onClick={() => setBookingFilter('upcoming')}
                  aria-pressed={bookingFilter === 'upcoming'}
                >
                  Upcoming
                </button>
                <button
                  className={`btn-secondary ${bookingFilter === 'past' ? 'active' : ''}`}
                  onClick={() => setBookingFilter('past')}
                  aria-pressed={bookingFilter === 'past'}
                >
                  Past & Cancelled
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {currentUser ? (
                <span style={{ fontSize: '0.88rem', color: '#6ee7b7' }}>
                  ✅ Viewing bookings for <strong>{currentUser.name}</strong>
                </span>
              ) : (
                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  <button
                    className="btn-secondary"
                    onClick={() => { setShowLoginForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{ padding: '0.3rem 0.8rem', fontSize: '0.82rem' }}
                  >Sign in</button> to view your bookings.
                </span>
              )}
              {currentUser && (
                <button className="btn" style={{ padding: '0.4rem 0.8rem' }} onClick={fetchBookings}>
                  ↻ Refresh
                </button>
              )}
            </div>

            {actionMessage && (
              <p className={actionMessage.type === 'error' ? 'message error-message' : 'message success-message'}>
                {actionMessage.text}
              </p>
            )}

            {!currentUser && (
              <p className="empty-state">Sign in using the button at the top to view your bookings.</p>
            )}

            {currentUser && bookingsLoading && <p>Loading your bookings...</p>}

            {currentUser && !bookingsLoading && bookings.length === 0 && (
              <p className="empty-state">No {bookingFilter} bookings found for your account.</p>
            )}

            {currentUser && !bookingsLoading && bookings.length > 0 && (
              <div className="bookings-list">
                {bookings.map((b) => (
                  <div className="booking-item-card" key={b.id}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <strong style={{ fontSize: '1.05rem' }}>{b.subject}</strong>
                        <span className={`status-badge badge-${b.status}`}>{b.status}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Tutor: <strong>{b.tutor_name}</strong> | Tutee: <strong>{b.tutee_name}</strong>
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                        📅 {new Date(b.start_time).toLocaleString()} ({b.duration_minutes} mins)
                      </div>
                      {b.cancellation_reason && (
                        <div style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.25rem' }}>
                          Reason / Note: {b.cancellation_reason}
                        </div>
                      )}
                    </div>

                    <div className="booking-actions">
                      {b.status === 'confirmed' && (
                        <button
                          className="btn-danger"
                          onClick={() => cancelBooking(b.id)}
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="grid-cards">
          {/* Backend Connectivity Status */}
          <div className="glass-card" id="backend-health-card">
            <div className="card-title">
              <span>Backend API Status</span>
              <span className={`status-pill ${loading ? 'degraded' : isConnected ? 'online' : 'offline'}`}>
                <span className="status-dot"></span>
                {loading ? 'Checking...' : isConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
            
            <div className="info-row">
              <span className="info-label">Endpoint</span>
              <span className="info-value">GET /api/health</span>
            </div>
            <div className="info-row">
              <span className="info-label">Service Name</span>
              <span className="info-value">{healthData?.service || 'Tutoring API'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Server Time (UTC)</span>
              <span className="info-value">{healthData?.timestampUtc ? new Date(healthData.timestampUtc).toUTCString() : '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Uptime</span>
              <span className="info-value">{healthData?.uptimeSeconds !== undefined ? `${healthData.uptimeSeconds}s` : '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Last Ping</span>
              <span className="info-value">{lastChecked || 'Pending'}</span>
            </div>

            {error && (
              <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '6px', fontSize: '0.85rem' }}>
                ⚠️ {error} (Ensure backend is running on port 5000)
              </div>
            )}

            <button className="btn" onClick={fetchHealth} disabled={loading} id="refresh-health-btn">
              {loading ? 'Pinging Server...' : '↻ Re-check Backend Health'}
            </button>
          </div>

          {/* Database & Model Architecture */}
          <div className="glass-card" id="db-status-card">
            <div className="card-title">
              <span>Database & Schema</span>
              <span className={`status-pill ${dbConnected ? 'online' : 'degraded'}`}>
                <span className="status-dot"></span>
                {dbConnected ? 'PostgreSQL Active' : 'Configured / Pending PG'}
              </span>
            </div>
            
            <div className="info-row">
              <span className="info-label">Engine</span>
              <span className="info-value">PostgreSQL 14+</span>
            </div>
            <div className="info-row">
              <span className="info-label">Timezone Handling</span>
              <span className="info-value">Stored in UTC (TIMESTAMPTZ)</span>
            </div>
            <div className="info-row">
              <span className="info-label">Core Models</span>
              <span className="info-value">User, TutorProfile, Slot, Booking, Rating</span>
            </div>
            <div className="info-row">
              <span className="info-label">Conflict Resolution</span>
              <span className="info-value">Row Lock (FOR UPDATE)</span>
            </div>
            
            <div style={{ marginTop: '0.9rem' }}>
              <span className="info-label" style={{ fontSize: '0.8rem' }}>Health Payload:</span>
              <pre className="code-box">
                {JSON.stringify(healthData || { status: 'awaiting backend response' }, null, 2)}
              </pre>
            </div>
          </div>
        </section>


      </main>
    </div>
  );
}

export default App;
