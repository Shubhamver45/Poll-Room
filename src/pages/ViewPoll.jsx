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

    const downloadReport = () => {
        if (!poll) return;
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += `Question,${poll.question}\nTotal Votes,${poll.totalVotes}\n\nOption,Votes\n`;
        poll.options.forEach(opt => { csvContent += `"${opt.text}",${opt.votes}\n`; });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `poll_analytics_${shareId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!poll) return <div style={{ padding: '2rem', color: 'white', textAlign: 'center' }}>Loading Room...</div>;

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem', minHeight: '100vh' }}>

            {/* Header */}
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

            {/* Layout Grid */}
            <div className="viewpoll-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)', gap: '2rem' }}>

                {/* LEFT: Main Poll Card (Question & Options) */}
                <div className="card" style={{ padding: '2.5rem', border: '1px solid #374151', height: 'fit-content' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0 }}>{poll.question}</h2>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            LIVE
                        </div>
                    </div>

                    <div className="options-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {poll.options.map((option, i) => {
                            const isSelected = selectedOption === i;
                            const percent = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;

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

                    {/* Row 1: Stats */}
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

                    {/* Row 2: ORANGE ANALYTICS CARD (Middle) */}
                    <div className="card" style={{
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, #F59E0B 0%, #ea580c 100%)',
                        border: 'none',
                        boxShadow: '0 8px 16px -4px rgba(245, 158, 11, 0.5)',
                        color: 'white'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <div style={{ fontWeight: '800', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                PREMIUM ANALYTICS
                            </div>
                            <div style={{ fontSize: '1.2rem' }}>⚡</div>
                        </div>

                        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: '500', lineHeight: '1.5' }}>
                            Export detailed visualization and voting pattern data.
                        </p>

                        <button
                            onClick={downloadReport}
                            style={{
                                width: '100%', padding: '0.8rem',
                                background: 'white', color: '#ea580c',
                                border: 'none', borderRadius: '8px',
                                cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                        >
                            Download Report ⬇
                        </button>
                    </div>

                    {/* Row 3: Share / Copy Link (Bottom) */}
                    <div className="card" style={{ padding: '1.5rem', background: '#1F2937', border: '1px solid #374151' }}>
                        <div style={{ color: '#9CA3AF', fontWeight: 'bold', marginBottom: '0.8rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>INVITE VOTERS</div>
                        <div style={{ display: 'flex', gap: '0.5rem', background: '#111827', padding: '4px', borderRadius: '8px', border: '1px solid #374151' }}>
                            <input
                                readOnly
                                value={window.location.href}
                                style={{
                                    flex: 1, background: 'transparent', border: 'none',
                                    color: '#D1D5DB', padding: '0.5rem', fontSize: '0.8rem', outline: 'none'
                                }}
                            />
                            <button
                                onClick={copyLink}
                                style={{
                                    background: '#374151', border: '1px solid #4B5563', borderRadius: '6px',
                                    padding: '0 1rem', fontWeight: 'bold', cursor: 'pointer', color: '#FFF', fontSize: '0.8rem'
                                }}
                            >
                                {copied ? '✓' : 'Copy'}
                            </button>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
