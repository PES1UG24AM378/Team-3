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
  const [bookingSlotId, setBookingSlotId] = useState(null);
  const [bookingMessage, setBookingMessage] = useState(null);

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

  const isConnected = healthData && (healthData.status === 'ok' || healthData.status === 'degraded');
  const dbConnected = healthData?.database?.status === 'connected';

  return (
    <div className="container">
      <header className="hero-header">
        <div className="badge">
          <span>🚀</span> Team 3 • Shared Foundation (Issue #1)
        </div>
        <h1 className="title-gradient">Peer-to-Peer Tutoring Scheduler</h1>
        <p className="subtitle">
          Small, runnable shared foundation with Express REST API, PostgreSQL schema,
          UTC timezone enforcement, and responsive React frontend.
        </p>
      </header>

      <main>
        <section className="glass-card search-card" id="slot-search">
          <div className="card-title">
            <span>Find an available tutoring slot</span>
            <span className="result-count">{slots.length} result{slots.length === 1 ? '' : 's'}</span>
          </div>
          <form className="search-form" onSubmit={searchSlots}>
            <label>Subject<input value={filters.subject} onChange={(e) => setFilters({ ...filters, subject: e.target.value })} placeholder="e.g. Mathematics" /></label>
            <label>From<input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /></label>
            <label>To<input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /></label>
            <label>Minimum tutor rating
              <select value={filters.minRating} onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}>
                <option value="">Any rating</option>
                {[4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating}+ stars</option>)}
              </select>
            </label>
            <button className="btn search-button" type="submit" disabled={searchLoading}>{searchLoading ? 'Searching...' : 'Search slots'}</button>
          </form>
          <div className="booking-controls">
            <label>Authenticated booking token<input type="password" value={authToken} onChange={(e) => setAuthToken(e.target.value)} placeholder="Bearer token from /api/auth/login" /></label>
            {bookingMessage && <p className={bookingMessage.type === 'error' ? 'message error-message' : 'message success-message'}>{bookingMessage.text}</p>}
          </div>
          {searchError && <p className="message error-message">{searchError}</p>}
          {!searchLoading && !searchError && slots.length === 0 && <p className="empty-state">No future, unbooked slots match these filters.</p>}
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
                      <button className="btn book-button" onClick={() => bookSlot(slot.id)} disabled={bookingSlotId === slot.id}>
                        {bookingSlotId === slot.id ? 'Booking...' : 'Book'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </section>

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

        {/* Conventions & Team Info */}
        <section className="glass-card" style={{ marginBottom: '2rem' }}>
          <div className="card-title">
            <span>Team 3 Conventions & Architecture</span>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
            All 4 members can build their assigned issues (#2 to #12) in parallel on top of this foundation.
          </p>

          <div className="team-grid">
            <div className="team-card team-lead">
              <strong>Mohammed Shahid Javed Mokashi</strong>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>PES1UG24AM378</div>
              <div style={{ color: '#818cf8', marginTop: '0.3rem', fontSize: '0.8rem' }}>Issue #1 Foundation Lead & Integration</div>
            </div>
            <div className="team-card">
              <strong>Team Member 2</strong>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Assigned Issues</div>
              <div style={{ color: 'var(--text-muted)', marginTop: '0.3rem', fontSize: '0.8rem' }}>Auth, Users & Profiles</div>
            </div>
            <div className="team-card">
              <strong>Team Member 3</strong>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Assigned Issues</div>
              <div style={{ color: 'var(--text-muted)', marginTop: '0.3rem', fontSize: '0.8rem' }}>Availability & Recurring Slots</div>
            </div>
            <div className="team-card">
              <strong>Team Member 4</strong>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Assigned Issues</div>
              <div style={{ color: 'var(--text-muted)', marginTop: '0.3rem', fontSize: '0.8rem' }}>Bookings, Ratings & Notifications</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
