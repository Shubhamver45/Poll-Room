import { useNavigate } from 'react-router-dom';

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="app-container">
            <header className="header" style={{ marginBottom: '2rem' }}>
                <a href="/" className="header-logo">
                    <span>PollRoom</span>
                </a>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="live-badge">
                        <div className="live-dot" /> System Online
                    </div>
                </div>
            </header>

            {/* Dashboard Grid Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>

                {/* Main Action Area */}
                <div>
                    <div className="card" style={{ padding: '3rem', textAlign: 'left', background: 'linear-gradient(145deg, #151A23 0%, #0B0E14 100%)' }}>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', lineHeight: '1.2' }}>
                            Real-time polling <br />
                            <span style={{ color: '#8B5CF6' }}>infrastructure.</span>
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2.5rem', maxWidth: '500px' }}>
                            Deploy instant polls. Collect votes in real-time.
                            Secure, anonymous, and powered by Supabase.
                        </p>
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={() => navigate('/create')}
                        >
                            Deploy New Poll &rarr;
                        </button>
                    </div>

                    {/* Stats Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Active Polls</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10B981' }}>Live</span>
                        </div>
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Latency</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3B82F6' }}>&lt; 50ms</span>
                        </div>
                    </div>
                </div>

                {/* Sidebar / Status Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card" style={{ height: '100%', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1rem' }}>System Status</h3>
                            <span style={{ fontSize: '1.2rem' }}>⚡</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                <span>Vote Stream</span>
                                <span style={{ color: '#10B981' }}>Active</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: '#2D3748', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: '100%', height: '100%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                <span>Anti-Abuse</span>
                                <span style={{ color: '#F59E0B' }}>Enabled</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: '#2D3748', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: '100%', height: '100%', background: '#F59E0B', boxShadow: '0 0 8px #F59E0B' }} />
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto', paddingTop: '2rem', textAlign: 'center' }}>
                            <div style={{
                                width: '120px', height: '120px',
                                margin: '0 auto',
                                borderRadius: '50%',
                                border: '8px solid #1F2937',
                                borderTopColor: '#8B5CF6',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>100%</span>
                            </div>
                            <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Uptime Score</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
