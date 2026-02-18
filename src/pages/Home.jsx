import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', minHeight: '100vh' }}>

            {/* Simple Header */}
            <header className="top-header" style={{ marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-1px' }}>
                        <span style={{ color: '#A78BFA' }}>Poll</span>Room
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Real-time polling infrastructure status.</p>
                </div>
            </header>

            {/* Main Grid: Exact Match to Screenshot */}
            <div className="dashboard-grid">

                {/* Hero Card (Left) */}
                <div className="card" style={{ gridColumn: 'span 1', background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)', border: '1px solid #374151', padding: '3rem' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <span style={{ background: 'rgba(167, 139, 250, 0.2)', color: '#A78BFA', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '1px' }}>
                            SYSTEM ONLINE
                        </span>
                    </div>

                    <h2 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '1.5rem', lineHeight: '1.1', background: 'linear-gradient(90deg, #FFF 0%, #9CA3AF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Real-time polling<br />infrastructure.
                    </h2>

                    <p style={{ color: '#9CA3AF', marginBottom: '3rem', maxWidth: '500px', lineHeight: '1.7', fontSize: '1.1rem' }}>
                        Deploy instant polls. Collect votes in real-time. Secure, anonymous, and powered by PollRoom.
                    </p>

                    <Link to="/create" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', padding: '1rem 2rem', fontSize: '1.1rem' }}>
                        Deploy New Poll →
                    </Link>
                </div>

                {/* Right Column: Status Widgets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Status Widget */}
                    <div className="card">
                        <div className="card-title">
                            System Status
                            <span style={{ color: '#FCD34D' }}>⚡</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                            <span style={{ color: '#9CA3AF' }}>Vote Stream</span>
                            <span style={{ color: '#10B981', fontWeight: 'bold' }}>Active</span>
                        </div>
                        <div style={{ height: '4px', background: '#374151', borderRadius: '2px', marginBottom: '1.5rem' }}>
                            <div style={{ width: '100%', height: '100%', background: '#10B981', borderRadius: '2px', boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' }}></div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                            <span style={{ color: '#9CA3AF' }}>Anti-Abuse</span>
                            <span style={{ color: '#F59E0B', fontWeight: 'bold' }}>Enabled</span>
                        </div>
                        <div style={{ height: '4px', background: '#374151', borderRadius: '2px', marginBottom: '1.5rem' }}>
                            <div style={{ width: '100%', height: '100%', background: '#F59E0B', borderRadius: '2px' }}></div>
                        </div>

                        {/* Uptime Score Circle */}
                        <div style={{ position: 'relative', width: '140px', height: '140px', margin: '1rem auto 0' }}>
                            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#374151" strokeWidth="3" />
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#7C3AED" strokeWidth="3" strokeDasharray="100, 100" />
                            </svg>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>100%</div>
                                <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Uptime</div>
                            </div>
                        </div>
                    </div>

                    {/* Latency Widget */}
                    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Global Latency</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3B82F6' }}>&lt; 50ms</div>
                        </div>
                        <div style={{ fontSize: '2rem' }}>🌐</div>
                    </div>

                </div>
            </div>
        </div>
    );
}
