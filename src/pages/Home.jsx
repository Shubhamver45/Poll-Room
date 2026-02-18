import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div className="app-layout">

            {/* Sidebar (Desktop Only) */}
            <aside className="sidebar">
                <div className="logo">
                    <span>Vertex</span>Guard
                </div>

                <nav>
                    <div className="nav-item active">
                        <span>📊</span> Overview
                    </div>
                    <div className="nav-item">
                        <span>⚠️</span> Issues
                    </div>
                    <div className="nav-item">
                        <span>📂</span> Files
                    </div>
                    <br />
                    <div style={{ color: '#6B7280', fontSize: '0.8rem', paddingLeft: '1rem', marginBottom: '0.5rem' }}>REPORTS</div>
                    <div className="nav-item">
                        <span>🛡️</span> Threat Details
                    </div>
                </nav>

                <div style={{ marginTop: 'auto', background: '#1F2937', padding: '1rem', borderRadius: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem' }}>💎</div>
                    <div style={{ fontWeight: '600', marginBottom: '5px' }}>Premium Access</div>
                    <button style={{ width: '100%', background: 'var(--primary)', border: 'none', padding: '0.5rem', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Upgrade</button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-content">

                {/* Header (Rich Welcome) */}
                <header className="top-header">
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>System Overview</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Real-time polling infrastructure status.</p>
                    </div>
                    <div className="search-bar" style={{ display: 'none' /* Hidden on mobile initially */ }}>
                        🔍 <span>Search logs...</span>
                    </div>
                    {/* Mobile Menu Toggle (Visible only on mobile via CSS) */}
                    <div className="mobile-menu-btn" style={{ display: 'none' }}>☰</div>
                </header>

                {/* Dashboard Grid */}
                <div className="dashboard-grid" style={{ marginTop: '2rem' }}>

                    {/* Hero Card (Create Poll) */}
                    <div className="card" style={{ gridColumn: 'span 1', background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)', border: '1px solid #374151' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <span style={{ background: 'rgba(167, 139, 250, 0.2)', color: '#A78BFA', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                SYSTEM ONLINE
                            </span>
                        </div>

                        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', background: 'linear-gradient(90deg, #FFF 0%, #9CA3AF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Real-time polling<br />infrastructure.
                        </h2>

                        <p style={{ color: '#9CA3AF', marginBottom: '2rem', maxWidth: '500px', lineHeight: '1.6' }}>
                            Deploy instant polls. Collect votes in real-time. Secure, anonymous, and powered by VertexGuard protection.
                        </p>

                        <Link to="/create" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                            Deploy New Poll →
                        </Link>
                    </div>

                    {/* Right Column: System Status Widgets */}
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
                            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto' }}>
                                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#374151" strokeWidth="3" />
                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#7C3AED" strokeWidth="3" strokeDasharray="100, 100" />
                                </svg>
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>100%</div>
                                    <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>Uptime</div>
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

                {/* Recent Polls Placeholder (Bottom Row) */}
                <div className="card" style={{ marginTop: '1.5rem' }}>
                    <div className="card-title">
                        Recent Activity
                        <button style={{ background: 'none', border: 'none', color: '#A78BFA', cursor: 'pointer', fontSize: '0.9rem' }}>View All</button>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                        {[1, 2, 3].map((i) => (
                            <div key={i} style={{ minWidth: '200px', background: '#1F2937', padding: '1rem', borderRadius: '12px' }}>
                                <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.5rem' }}>POLL ID: #{Math.random().toString(36).substr(2, 6).toUpperCase()}</div>
                                <div style={{ fontWeight: '600' }}>Feature Request {i}</div>
                                <div style={{ marginTop: '0.5rem', height: '4px', background: '#374151', borderRadius: '2px' }}>
                                    <div style={{ width: `${Math.random() * 100}%`, height: '100%', background: '#A78BFA', borderRadius: '2px' }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </main>
        </div>
    );
}
