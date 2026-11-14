import React, { useEffect, useMemo, useState } from 'react';

function App() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  // Authentication & session state
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('tutoring_auth_token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('tutoring_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [showAuthModal, setShowAuthModal] = useState(() => !localStorage.getItem('tutoring_auth_token'));
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [loginEmail, setLoginEmail] = useState('bob.tutee@university.edu');
  const [loginPassword, setLoginPassword] = useState('bob-password');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('student');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState(null);

  // Slot search & filters
  const [filters, setFilters] = useState({ subject: '', from: '', to: '', minRating: '' });
  const [slots, setSlots] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Booking & Session management
  const [bookingSlotId, setBookingSlotId] = useState(null);
  const [bookingMessage, setBookingMessage] = useState(null);
  const [myBookings, setMyBookings] = useState([]);
  const [myBookingsLoading, setMyBookingsLoading] = useState(false);
  const [sessionMessage, setSessionMessage] = useState(null);
  const [ratingDrafts, setRatingDrafts] = useState({});

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

  const loadMyBookings = async (token = authToken) => {
    if (!token) return;
    setMyBookingsLoading(true);
    setSessionMessage(null);
    try {
      const response = await fetch('/api/bookings/mine', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || 'Unable to load sessions');
      setMyBookings(payload.data || []);
    } catch (err) {
      setSessionMessage({ type: 'error', text: err.message });
    } finally {
      setMyBookingsLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      loadMyBookings(authToken);
    } else {
      setMyBookings([]);
    }
  }, [authToken]);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setAuthLoading(true);
    setAuthMessage(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || 'Login failed');

      const token = payload.data.token;
      const user = payload.data.user;

      setAuthToken(token);
      setCurrentUser(user);
      localStorage.setItem('tutoring_auth_token', token);
      localStorage.setItem('tutoring_user', JSON.stringify(user));

      setShowAuthModal(false);
      setBookingMessage({ type: 'success', text: `Signed in as ${user.name} (${user.role})` });
      await loadMyBookings(token);
    } catch (err) {
      setAuthMessage({ type: 'error', text: err.message });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    setAuthLoading(true);
    setAuthMessage(null);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          role: regRole
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || 'Registration failed');

      const token = payload.data.token;
      const user = payload.data.user;

      setAuthToken(token);
      setCurrentUser(user);
      localStorage.setItem('tutoring_auth_token', token);
      localStorage.setItem('tutoring_user', JSON.stringify(user));

      setShowAuthModal(false);
      setBookingMessage({ type: 'success', text: `Account created! Signed in as ${user.name}` });
      await loadMyBookings(token);
    } catch (err) {
      setAuthMessage({ type: 'error', text: err.message });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthToken('');
    setCurrentUser(null);
    localStorage.removeItem('tutoring_auth_token');
    localStorage.removeItem('tutoring_user');
    setMyBookings([]);
    setBookingMessage({ type: 'info', text: 'You have signed out.' });
  };

  const selectPreset = (email, password) => {
    setLoginEmail(email);
    setLoginPassword(password);
  };

  const bookSlot = async (slotId) => {
    if (!authToken) {
      setShowAuthModal(true);
      setBookingMessage({ type: 'error', text: 'Please sign in first to book a tutoring session.' });
      return;
    }
    setBookingSlotId(slotId);
    setBookingMessage(null);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ slotId })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || 'Unable to book this slot');
      setBookingMessage({ type: 'success', text: 'Slot booked successfully!' });
      await searchSlots();
      await loadMyBookings();
    } catch (err) {
      setBookingMessage({ type: 'error', text: err.message });
      await searchSlots();
    } finally {
      setBookingSlotId(null);
    }
  };

  const cancelSession = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    setSessionMessage(null);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || 'Unable to cancel booking');
      setSessionMessage({ type: 'success', text: 'Booking cancelled successfully.' });
      await searchSlots();
      await loadMyBookings();
    } catch (err) {
      setSessionMessage({ type: 'error', text: err.message });
    }
  };

  const updateSession = async (booking, action) => {
    setSessionMessage(null);
    try {
      const isRating = action === 'rating';
      const draft = ratingDrafts[booking.id] || { rating: '5', comment: '' };
      const response = await fetch(isRating ? `/api/bookings/${booking.id}/rating` : `/api/bookings/${booking.id}/complete`, {
        method: isRating ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        ...(isRating ? { body: JSON.stringify({ rating: Number(draft.rating), comment: draft.comment }) } : {})
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || 'Unable to update session');
      setSessionMessage({ type: 'success', text: isRating ? 'Thanks for your feedback!' : 'Session marked completed.' });
      await loadMyBookings();
    } catch (err) {
      setSessionMessage({ type: 'error', text: err.message });
    }
  };

  const slotsByDate = useMemo(() => slots.reduce((groups, slot) => {
    const date = new Date(slot.start_time).toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric'
    });
    groups[date] = groups[date] || [];
    groups[date].push(slot);
    return groups;
  }, {}), [slots]);

  const isConnected = healthData && (healthData.status === 'ok' || healthData.status === 'degraded');
  const dbConnected = healthData?.database?.status === 'connected';

  return (
    <div className="container">
      {/* Top Navigation & User Authentication Bar */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.85rem 1.25rem',
        background: 'rgba(17, 24, 39, 0.75)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.3rem' }}>🎓</span>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f3f4f6' }}>
            Peer Tutor Scheduler
          </span>
          <span className={`status-pill ${loading ? 'degraded' : isConnected ? 'online' : 'offline'}`} style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }}>
            <span className="status-dot"></span>
            {loading ? 'API...' : isConnected ? 'API Online' : 'API Offline'}
          </span>
        </div>

        <div>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
              <span style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>
                👤 <strong>{currentUser.name}</strong> <span style={{ opacity: 0.7 }}>({currentUser.role})</span>
              </span>
              <button
                className="btn-secondary"
                onClick={handleLogout}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem' }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              className="btn"
              onClick={() => { setAuthMode('login'); setAuthMessage(null); setShowAuthModal(true); }}
              style={{ padding: '0.45rem 1.25rem', fontSize: '0.88rem', fontWeight: 600 }}
            >
              🔑 Sign in / Register
            </button>
          )}
        </div>
      </nav>

      {/* Interactive Authentication Modal / Banner */}
      {showAuthModal && !currentUser && (
        <section className="glass-card" style={{
          marginBottom: '2rem',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          boxShadow: '0 10px 35px -5px rgba(99, 102, 241, 0.25)',
          background: 'rgba(15, 23, 42, 0.95)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={`btn ${authMode === 'login' ? '' : 'btn-secondary'}`}
                style={{ padding: '0.4rem 1.1rem', fontSize: '0.85rem' }}
                onClick={() => { setAuthMode('login'); setAuthMessage(null); }}
              >
                Sign In
              </button>
              <button
                className={`btn ${authMode === 'register' ? '' : 'btn-secondary'}`}
                style={{ padding: '0.4rem 1.1rem', fontSize: '0.85rem' }}
                onClick={() => { setAuthMode('register'); setAuthMessage(null); }}
              >
                Create Account
              </button>
            </div>
            <button
              onClick={() => setShowAuthModal(false)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>

          {authMessage && (
            <p className={authMessage.type === 'error' ? 'message error-message' : 'message success-message'} style={{ marginBottom: '1rem' }}>
              {authMessage.text}
            </p>
          )}

          {authMode === 'login' ? (
            <div>
              <form onSubmit={handleLogin} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', alignItems: 'flex-end' }}>
                <label style={{ flex: '1 1 240px' }}>
                  Institutional email
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@university.edu"
                    required
                  />
                </label>
                <label style={{ flex: '1 1 200px' }}>
                  Password
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                  />
                </label>
                <button className="btn" type="submit" disabled={authLoading} style={{ padding: '0.65rem 1.5rem', alignSelf: 'flex-end' }}>
                  {authLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginRight: '0.5rem' }}>Quick Test Accounts:</span>
                <div style={{ display: 'inline-flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}
                    onClick={() => selectPreset('bob.tutee@university.edu', 'bob-password')}
                  >
                    👤 Bob (Student/Tutee)
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}
                    onClick={() => selectPreset('alice.tutor@university.edu', 'alice-password')}
                  >
                    👩‍🏫 Alice (Tutor)
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}
                    onClick={() => selectPreset('admin@university.edu', 'admin-password')}
                  >
                    🛡️ Admin
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', alignItems: 'flex-end' }}>
              <label style={{ flex: '1 1 200px' }}>
                Full Name
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                />
              </label>
              <label style={{ flex: '1 1 220px' }}>
                Institutional Email
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="student@university.edu"
                  required
                />
              </label>
              <label style={{ flex: '1 1 180px' }}>
                Password (min 8 chars)
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                />
              </label>
              <label style={{ flex: '1 1 140px' }}>
                Role
                <select value={regRole} onChange={(e) => setRegRole(e.target.value)}>
                  <option value="student">Student (Tutee)</option>
                  <option value="tutor">Tutor</option>
                  <option value="both">Both</option>
                </select>
              </label>
              <button className="btn" type="submit" disabled={authLoading} style={{ padding: '0.65rem 1.5rem', alignSelf: 'flex-end' }}>
                {authLoading ? 'Creating...' : 'Register'}
              </button>
            </form>
          )}
        </section>
      )}

      <header className="hero-header">
        <div className="badge">
          <span>🚀</span> Team 3 • Shared Foundation (Issue #1)
        </div>
        <h1 className="title-gradient">Peer-to-Peer Tutoring Scheduler</h1>
        <p className="subtitle">
          Interactive peer tutoring platform with atomic bookings, tutor ratings, and cancellation management.
        </p>
      </header>

      <main>
        {/* Availability Search & Booking Section */}
        <section className="glass-card search-card" id="slot-search">
          <div className="card-title">
            <span>Find an available tutoring slot</span>
            <span className="result-count">{slots.length} result{slots.length === 1 ? '' : 's'}</span>
          </div>

          <form className="search-form" onSubmit={searchSlots}>
            <label>Subject
              <input
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                placeholder="e.g. Mathematics, Algorithms"
              />
            </label>
            <label>From
              <input
                type="date"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              />
            </label>
            <label>To
              <input
                type="date"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              />
            </label>
            <label>Minimum tutor rating
              <select value={filters.minRating} onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}>
                <option value="">Any rating</option>
                {[4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>{rating}+ stars</option>
                ))}
              </select>
            </label>
            <button className="btn search-button" type="submit" disabled={searchLoading}>
              {searchLoading ? 'Searching...' : 'Search slots'}
            </button>
          </form>

          {bookingMessage && (
            <p className={bookingMessage.type === 'error' ? 'message error-message' : 'message success-message'} style={{ marginTop: '0.85rem' }}>
              {bookingMessage.text}
            </p>
          )}

          {searchError && <p className="message error-message">{searchError}</p>}
          {!searchLoading && !searchError && slots.length === 0 && (
            <p className="empty-state">No future, unbooked slots match these filters.</p>
          )}

          <div className="calendar-grid">
            {Object.entries(slotsByDate).map(([date, dateSlots]) => (
              <div className="calendar-day" key={date}>
                <h3>{date}</h3>
                {dateSlots.map((slot) => (
                  <article className="slot-card" key={slot.id}>
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

        {/* My Sessions & Dashboard Section */}
        <section className="glass-card sessions-card">
          <div className="card-title">
            <span>My Bookings & Sessions</span>
            <span className="result-count">{myBookings.length} session{myBookings.length === 1 ? '' : 's'}</span>
          </div>

          {sessionMessage && (
            <p className={`message ${sessionMessage.type === 'error' ? 'error-message' : 'success-message'}`}>
              {sessionMessage.text}
            </p>
          )}

          {!currentUser && (
            <p className="empty-state">
              Please <button className="btn-secondary" onClick={() => { setAuthMode('login'); setShowAuthModal(true); }} style={{ padding: '0.2rem 0.7rem' }}>sign in</button> to view and manage your booked tutoring sessions.
            </p>
          )}

          {currentUser && !myBookings.length && !myBookingsLoading && (
            <p className="empty-state">You have no active sessions scheduled yet. Book one from the slots list above!</p>
          )}

          {myBookingsLoading && <p className="empty-state">Loading your sessions...</p>}

          <div className="sessions-list">
            {myBookings.map((booking) => {
              const draft = ratingDrafts[booking.id] || { rating: '5', comment: '' };
              const isPastNotice = (new Date(booking.start_time).getTime() - Date.now()) > 24 * 60 * 60 * 1000;

              return (
                <article className="session-card" key={booking.id}>
                  <div className="session-heading">
                    <div>
                      <strong>{booking.subject}</strong>
                      <span>{booking.viewer_role === 'tutor' ? `Tutee: ${booking.tutee_name}` : `Tutor: ${booking.tutor_name}`}</span>
                      <span>{new Date(booking.start_time).toLocaleString()} · {booking.duration_minutes} min</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className={`session-status status-${booking.status}`}>{booking.status}</span>
                      {booking.status === 'confirmed' && (
                        <button
                          className="btn-danger"
                          onClick={() => cancelSession(booking.id)}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                          title={isPastNotice ? 'Cancel booking' : 'Notice window alert'}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {booking.viewer_role === 'tutor' && booking.status === 'confirmed' && (
                    <button className="btn book-button" onClick={() => updateSession(booking, 'complete')}>
                      Mark session completed
                    </button>
                  )}

                  {booking.viewer_role === 'tutee' && booking.status === 'completed' && booking.my_rating == null && (
                    <div className="rating-form">
                      <label>Rating
                        <select
                          value={draft.rating}
                          onChange={(e) => setRatingDrafts({ ...ratingDrafts, [booking.id]: { ...draft, rating: e.target.value } })}
                        >
                          {[5, 4, 3, 2, 1].map((value) => (
                            <option key={value} value={value}>{value} star{value === 1 ? '' : 's'}</option>
                          ))}
                        </select>
                      </label>
                      <label className="comment-field">Comment (optional)
                        <textarea
                          maxLength={2000}
                          value={draft.comment}
                          onChange={(e) => setRatingDrafts({ ...ratingDrafts, [booking.id]: { ...draft, comment: e.target.value } })}
                          placeholder="Share feedback about this session"
                        />
                      </label>
                      <button className="btn book-button" onClick={() => updateSession(booking, 'rating')}>
                        Submit rating
                      </button>
                    </div>
                  )}

                  {booking.viewer_role === 'tutee' && booking.my_rating != null && (
                    <p className="submitted-rating">
                      Your rating: {'★'.repeat(booking.my_rating)}{'☆'.repeat(5 - booking.my_rating)}
                      {booking.my_rating_comment ? ` · ${booking.my_rating_comment}` : ''}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* System Health Monitor */}
        <section className="grid-cards">
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

          <div className="glass-card" id="db-status-card">
            <div className="card-title">
              <span>Database & Architecture</span>
              <span className={`status-pill ${dbConnected ? 'online' : 'degraded'}`}>
                <span className="status-dot"></span>
                {dbConnected ? 'Database Active' : 'Fallback Active'}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">Engine</span>
              <span className="info-value">PostgreSQL 14+ / In-Memory Fallback</span>
            </div>
            <div className="info-row">
              <span className="info-label">Timezone</span>
              <span className="info-value">UTC (TIMESTAMPTZ)</span>
            </div>
            <div className="info-row">
              <span className="info-label">Core Models</span>
              <span className="info-value">User, TutorProfile, Slot, Booking, Rating</span>
            </div>
            <div className="info-row">
              <span className="info-label">Concurrency</span>
              <span className="info-value">SELECT FOR UPDATE (Row Locking)</span>
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
