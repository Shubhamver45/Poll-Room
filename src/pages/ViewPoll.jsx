import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPoll } from '../services/api';
import { getSocket, joinPollRoom, leavePollRoom, emitVote } from '../services/socket';
import { getVoterId, markPollAsVoted } from '../services/voter';

export default function ViewPoll() {
    const { shareId } = useParams();
    const [poll, setPoll] = useState(null);
    const [viewerCount, setViewerCount] = useState(0);
    const [hasVoted, setHasVoted] = useState(false);
    const [votedOptionIndex, setVotedOptionIndex] = useState(-1);
    const [selectedOption, setSelectedOption] = useState(-1);
    const [copied, setCopied] = useState(false);

    const voterId = getVoterId();

    useEffect(() => {
        const fetchPoll = async () => {
            try {
                const data = await getPoll(shareId, voterId);
                setPoll(data.poll);
                if (data.hasVoted) {
                    setHasVoted(true);
                    setVotedOptionIndex(data.votedOptionIndex);
                }
            } catch (e) { console.error(e); }
        };
        fetchPoll();
    }, [shareId]);

    useEffect(() => {
        const socket = getSocket();
        joinPollRoom(shareId);

        socket.on('poll-updated', (data) => setPoll(prev => ({ ...prev, ...data })));
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

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!poll) return <div style={{ padding: '2rem', color: 'white', textAlign: 'center' }}>Loading Room...</div>;

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem', minHeight: '100vh' }}>

            {/* Minimal Header */}
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>
                        <span style={{ color: '#A78BFA' }}>Poll</span>Room
                    </h1>
                </Link>
                <div style={{ background: '#1F2937', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.8rem', color: '#9CA3AF' }}>
                    ID: {shareId}
                </div>
            </header>

            {/* Layout Grid: 2 Columns (Main Poll | Sidebar Stats) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '2rem' }}>

                {/* Check alignment on mobile via CSS later, simpler inline styles for now */}

                {/* LEFT: Main Poll Card */}
                <div className="card" style={{ padding: '2.5rem', border: '1px solid #374151' }}>

                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'
                    }}>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>{poll.question}</h2>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            LIVE
                        </div>
                    </div>

                    <div className="options-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {poll.options.map((option, i) => {
                            const isSelected = selectedOption === i;
                            const percent = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;

                            // Purple if voted or leading, else dark grey
                            const barColor = (hasVoted && i === votedOptionIndex) ? '#A78BFA' : '#4B5563';

                            return (
                                <div
                                    key={i}
                                    onClick={() => !hasVoted && setSelectedOption(i)}
                                    style={{
                                        position: 'relative',
                                        background: '#1F2937',
                                        borderRadius: '12px',
                                        cursor: hasVoted ? 'default' : 'pointer',
                                        overflow: 'hidden',
                                        border: isSelected ? '2px solid #A78BFA' : '2px solid transparent',
                                        transition: 'all 0.2s',
                                        padding: '1rem'
                                    }}
                                >
                                    {/* Progress Bar Background */}
                                    {hasVoted && (
                                        <div style={{
                                            position: 'absolute', top: 0, left: 0, bottom: 0,
                                            width: `${percent}%`,
                                            background: i === votedOptionIndex ? 'rgba(167, 139, 250, 0.2)' : 'rgba(75, 85, 99, 0.2)',
                                            transition: 'width 0.5s ease'
                                        }}></div>
                                    )}

                                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
                                        <span style={{ fontWeight: '500', fontSize: '1.1rem' }}>{option.text}</span>
                                        {hasVoted && (
                                            <span style={{ fontWeight: 'bold', color: i === votedOptionIndex ? '#A78BFA' : '#9CA3AF' }}>
                                                {percent}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {!hasVoted ? (
                        <button
                            className="btn-primary"
                            onClick={handleVote}
                            disabled={selectedOption < 0}
                            style={{ width: '100%', marginTop: '2rem', padding: '1rem', fontSize: '1.1rem', borderRadius: '12px', opacity: selectedOption < 0 ? 0.5 : 1 }}
                        >
                            Confirm Vote
                        </button>
                    ) : (
                        <div style={{
                            marginTop: '2rem', textAlign: 'center', padding: '1rem',
                            background: 'rgba(16, 185, 129, 0.1)', color: '#10B981',
                            borderRadius: '12px', fontWeight: 'bold', border: '1px solid rgba(16, 185, 129, 0.2)'
                        }}>
                            Vote Recorded Successfully ✓
                        </div>
                    )}
                </div>

                {/* RIGHT: Sidebar Stack */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Top Row: 2 Small Stat Cards */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="card" style={{ flex: 1, padding: '1.5rem', textAlign: 'center', background: '#1F2937' }}>
                            <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Total Votes</div>
                            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#FFF' }}>{poll.totalVotes}</div>
                        </div>
                        <div className="card" style={{ flex: 1, padding: '1.5rem', textAlign: 'center', background: '#1F2937' }}>
                            <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Active Users</div>
                            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10B981' }}>{viewerCount}</div>
                        </div>
                    </div>

                    {/* Share Card */}
                    <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #2D1B4E 0%, #1F2937 100%)', border: '1px solid #4C1D95' }}>
                        <div style={{ color: '#A78BFA', fontWeight: 'bold', marginBottom: '1rem', fontSize: '0.9rem' }}>SHARE POLL</div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                readOnly
                                value={window.location.href}
                                style={{
                                    flex: 1, background: 'rgba(0,0,0,0.3)', border: 'none',
                                    color: '#9CA3AF', borderRadius: '8px', padding: '0.5rem', fontSize: '0.8rem'
                                }}
                            />
                            <button
                                onClick={copyLink}
                                style={{
                                    background: '#A78BFA', border: 'none', borderRadius: '8px',
                                    padding: '0 1rem', fontWeight: 'bold', cursor: 'pointer', color: '#FFF'
                                }}
                            >
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    {/* Download Report Card */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Analytics Report</div>
                        <p style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: '1rem' }}>Download detailed voting data in CSV format.</p>
                        <button
                            onClick={() => alert("Report generation feature active.")}
                            style={{ width: '100%', padding: '0.8rem', background: '#374151', color: '#FFF', border: '1px solid #4B5563', borderRadius: '8px', cursor: 'pointer' }}
                        >
                            Download .CSV ⬇
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
}
