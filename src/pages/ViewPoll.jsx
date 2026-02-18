import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPoll } from '../services/api';
import { getSocket, joinPollRoom, leavePollRoom, emitVote } from '../services/socket';
import { getVoterId, markPollAsVoted, hasVotedOnPoll } from '../services/voter';

// --- CUSTOM SVG CHARTS (VertexGuard Style) ---

// 1. Smooth Spline Chart (Vote Velocity)
const SplineChart = ({ data, color = '#A78BFA' }) => {
    // Generate a simple smooth path based on data points
    // Simplified for demo: just visualizes random "activity" curve
    const points = data.map((val, i) => `${(i / (data.length - 1)) * 100},${100 - val}`).join(' ');
    // Smooth curve approximation (Catmull-Rom or similar logic omitted for brevity, using polyline for now with CSS smoothing)

    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            <defs>
                <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`M 0,100 ${points} 100,100`} fill="url(#gradient)" stroke="none" />
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                style={{ filter: 'drop-shadow(0 0 4px rgba(167, 139, 250, 0.5))' }}
            />
        </svg>
    );
};

// 2. Donut Chart (Option Distribution)
const DonutChart = ({ options, total }) => {
    let cumulative = 0;
    const colors = ['#A78BFA', '#F472B6', '#3B82F6', '#F97316', '#10B981', '#FCD34D'];

    // Default empty grey circle if 0 votes
    if (total === 0) {
        return (
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#1F2937" strokeWidth="3" />
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            {options.map((opt, i) => {
                const percent = (opt.votes / total) * 100;
                const strokeDasharray = `${percent} ${100 - percent}`;
                const offset = 100 - cumulative;
                cumulative += percent;

                return (
                    <circle
                        key={i}
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="none"
                        stroke={colors[i % colors.length]}
                        strokeWidth="3"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={offset}
                        style={{ transition: 'stroke-dasharray 0.5s ease' }}
                    />
                );
            })}
        </svg>
    );
};

export default function ViewPoll() {
    const { shareId } = useParams();
    const [poll, setPoll] = useState(null);
    const [viewerCount, setViewerCount] = useState(0);
    const [hasVoted, setHasVoted] = useState(false);
    const [votedOptionIndex, setVotedOptionIndex] = useState(-1);
    const [selectedOption, setSelectedOption] = useState(-1);
    const [chartData, setChartData] = useState([20, 40, 25, 50, 30, 60, 40, 70, 50, 80]); // Dummy history for animation

    const voterId = getVoterId();

    useEffect(() => {
        const fetchPoll = async () => {
            const data = await getPoll(shareId, voterId);
            setPoll(data.poll);
            if (data.hasVoted) {
                setHasVoted(true);
                setVotedOptionIndex(data.votedOptionIndex);
            }
        };
        fetchPoll();
    }, [shareId]);

    // Socket Listener
    useEffect(() => {
        const socket = getSocket();
        joinPollRoom(shareId);

        socket.on('poll-updated', (data) => {
            setPoll(prev => ({ ...prev, ...data }));
            // Add a random "bump" to chart to simulate live activity
            setChartData(prev => [...prev.slice(1), Math.min(100, Math.max(10, prev[prev.length - 1] + (Math.random() * 40 - 20)))]);
        });

        socket.on('viewer-count', (data) => setViewerCount(data.count));

        socket.on('vote-success', (data) => {
            setHasVoted(true);
            setVotedOptionIndex(data.votedOptionIndex);
        });

        return () => leavePollRoom(shareId);
    }, [shareId]);

    const handleVote = () => {
        if (selectedOption >= 0 && !hasVoted) {
            emitVote(shareId, selectedOption, voterId);
            markPollAsVoted(shareId, selectedOption);
        }
    };

    if (!poll) return <div style={{ padding: '2rem', color: 'white' }}>Loading Dashboard...</div>;

    const colors = ['#A78BFA', '#F472B6', '#3B82F6', '#F97316', '#10B981', '#FCD34D'];

    return (
        <div className="app-layout">

            {/* Sidebar (Left Nav) */}
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

            {/* Main Content */}
            <main className="main-content">

                {/* Header */}
                <header className="top-header">
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Dashboard Overview</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Real-time poll analytics and threat detection.</p>
                    </div>
                    <div className="search-bar">
                        🔍 <span>Search metrics...</span>
                    </div>
                </header>

                {/* KPI Cards Row */}
                <div className="stats-row">
                    <div className="mini-stat">
                        <div className="mini-card-title" style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '5px' }}>TOTAL VOTES</div>
                        <div style={{ fontSize: '2rem', fontWeight: '700' }}>{poll.totalVotes}</div>
                    </div>
                    <div className="mini-stat">
                        <div className="mini-card-title" style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '5px' }}>ACTIVE VIEWERS</div>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: '#34D399' }}>{viewerCount}</div>
                    </div>
                    <div className="mini-stat">
                        <div className="mini-card-title" style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '5px' }}>THREAT LEVEL</div>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: '#F87171' }}>Low</div>
                    </div>
                    <div className="mini-stat">
                        <div className="mini-card-title" style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '5px' }}>SYSTEM STATUS</div>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: '#60A5FA' }}>98%</div>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="dashboard-grid">

                    {/* Left: Vote Velocity (Line Chart) */}
                    <div className="card">
                        <div className="card-title">
                            <span>Vote Velocity (Threat Summary)</span>
                            <span style={{ fontSize: '0.8rem', background: '#7C3AED', padding: '2px 8px', borderRadius: '10px' }}>Live</span>
                        </div>
                        <div className="chart-container">
                            <SplineChart data={chartData} />
                        </div>
                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', color: '#9CA3AF', fontSize: '0.8rem' }}>
                            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                        </div>
                    </div>

                    {/* Right: Risk Score (Donut) */}
                    <div className="card">
                        <div className="card-title">Vote Distribution</div>
                        <div className="donut-container">
                            <DonutChart options={poll.options} total={poll.totalVotes} />

                            {/* Center Text in Donut */}
                            <div className="donut-text">
                                <div className="donut-total">{poll.totalVotes}</div>
                                <div className="donut-label">Total</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem' }}>
                            {poll.options.map((opt, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '0.9rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors[i % colors.length], marginRight: '10px' }}></div>
                                    <div style={{ flex: 1, color: '#D1D5DB' }}>{opt.text}</div>
                                    <div style={{ fontWeight: 'bold' }}>{Math.round((opt.votes / poll.totalVotes) * 100) || 0}%</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom: Poll Voting Options (Threat Details) */}
                <div className="card">
                    <div className="card-title">
                        <span>Poll Options (Action Required)</span>
                        <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>Select an option to mitigate risk</div>
                    </div>

                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{poll.question}</h2>

                    <div className="options-list">
                        {poll.options.map((option, i) => {
                            const isSelected = selectedOption === i;
                            const color = colors[i % colors.length];

                            return (
                                <div
                                    key={i}
                                    className="option-row"
                                    onClick={() => !hasVoted && setSelectedOption(i)}
                                    style={{
                                        opacity: hasVoted && i !== votedOptionIndex ? 0.5 : 1,
                                        background: isSelected ? 'rgba(167, 139, 250, 0.1)' : 'transparent',
                                        borderLeft: isSelected ? `4px solid ${color}` : '4px solid transparent'
                                    }}
                                >
                                    <div className="option-circle" style={{ background: color }}></div>
                                    <div style={{ flex: 1, fontWeight: '500' }}>{option.text}</div>

                                    {hasVoted && (
                                        <div style={{ fontWeight: 'bold', color: color }}>
                                            {option.votes} votes
                                        </div>
                                    )}

                                    {hasVoted && i === votedOptionIndex && (
                                        <span style={{ marginLeft: '1rem', background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                            Voted
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {!hasVoted && (
                        <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                            <button
                                className="btn-primary"
                                onClick={handleVote}
                                disabled={selectedOption < 0}
                                style={{ opacity: selectedOption < 0 ? 0.5 : 1 }}
                            >
                                Submit Decision →
                            </button>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}
