import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPoll } from '../services/api';
import { getSocket, joinPollRoom, leavePollRoom, emitVote } from '../services/socket';
import { getVoterId, markPollAsVoted, hasVotedOnPoll } from '../services/voter';

export default function ViewPoll() {
    const { shareId } = useParams();
    const [poll, setPoll] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [hasVoted, setHasVoted] = useState(false);
    const [votedOptionIndex, setVotedOptionIndex] = useState(-1);
    const [selectedOption, setSelectedOption] = useState(-1);
    const [voting, setVoting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const [viewerCount, setViewerCount] = useState(0);
    const prevTotalRef = useRef(0);

    const voterId = getVoterId();

    const showToast = useCallback((message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3500);
    }, []);

    // Fetch poll data
    useEffect(() => {
        const fetchPoll = async () => {
            try {
                const data = await getPoll(shareId, voterId);
                setPoll(data.poll);
                prevTotalRef.current = data.poll.totalVotes;

                // Check server-side vote status
                if (data.hasVoted) {
                    setHasVoted(true);
                    setVotedOptionIndex(data.votedOptionIndex);
                }

                // Check client-side vote status
                const localVote = hasVotedOnPoll(shareId);
                if (localVote) {
                    setHasVoted(true);
                    setVotedOptionIndex(localVote.optionIndex);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPoll();
    }, [shareId, voterId]);

    // Setup Socket.io
    useEffect(() => {
        const socket = getSocket();
        joinPollRoom(shareId);

        socket.on('poll-updated', (data) => {
            setPoll((prev) => {
                if (!prev) return prev;
                prevTotalRef.current = prev.totalVotes;
                return { ...prev, options: data.options, totalVotes: data.totalVotes };
            });
        });

        socket.on('poll-data', (data) => {
            setPoll((prev) =>
                prev
                    ? { ...prev, options: data.options, totalVotes: data.totalVotes }
                    : prev
            );
        });

        socket.on('viewer-count', (data) => {
            setViewerCount(data.count);
        });

        socket.on('vote-success', (data) => {
            setHasVoted(true);
            setVotedOptionIndex(data.votedOptionIndex);
            setVoting(false);
            showToast('Vote successfully recorded');
        });

        socket.on('vote-error', (data) => {
            setVoting(false);
            if (data.votedOptionIndex !== undefined) {
                setHasVoted(true);
                setVotedOptionIndex(data.votedOptionIndex);
                markPollAsVoted(shareId, data.votedOptionIndex);
            }
            showToast(data.error || 'Failed to record vote', 'error');
        });

        return () => {
            leavePollRoom(shareId);
            socket.off('poll-updated');
            socket.off('poll-data');
            socket.off('vote-success');
            socket.off('vote-error');
            socket.off('viewer-count');
        };
    }, [shareId, showToast]);

    const handleVote = () => {
        if (selectedOption < 0 || hasVoted || voting) return;

        setVoting(true);
        emitVote(shareId, selectedOption, voterId);
        markPollAsVoted(shareId, selectedOption);
    };

    const copyShareLink = async () => {
        const url = window.location.href;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            showToast('Link copied to clipboard');
            setTimeout(() => setCopied(false), 2500);
        } catch {
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            showToast('Link copied to clipboard');
            setTimeout(() => setCopied(false), 2500);
        }
    };

    if (loading) {
        return (
            <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PollHeader />
                <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Scanning database...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="app-container">
                <PollHeader />
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <h2 className="card-title" style={{ justifyContent: 'center', color: '#EF4444' }}>
                        Error Found
                    </h2>
                    <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>{error}</p>
                    <Link to="/create" className="btn btn-primary">
                        Initiate New Poll
                    </Link>
                </div>
            </div>
        );
    }

    const maxVotes = Math.max(...poll.options.map((o) => o.votes), 1);

    return (
        <div className="app-container">
            <PollHeader />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>

                {/* Main Results / Voting Area */}
                <div>
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <h1 className="poll-question" style={{ fontSize: '1.75rem', maxWidth: '80%' }}>
                                {poll.question}
                            </h1>
                            <div className="live-badge">
                                <div className="live-dot" /> Live
                            </div>
                        </div>

                        <div className="poll-options">
                            {poll.options.map((option, i) => {
                                const percent =
                                    poll.totalVotes > 0
                                        ? Math.round((option.votes / poll.totalVotes) * 100)
                                        : 0;
                                const isWinner = option.votes === maxVotes && poll.totalVotes > 0;
                                const isSelected = selectedOption === i;
                                const isVotedOption = votedOptionIndex === i;

                                let styleClass = 'poll-option';
                                if (isSelected && !hasVoted) styleClass += ' poll-option--selected';
                                if (hasVoted) styleClass += ' poll-option--voted';

                                return (
                                    <div
                                        key={option._id || i}
                                        className={styleClass}
                                        onClick={() => {
                                            if (!hasVoted && !voting) setSelectedOption(i);
                                        }}
                                        role="button"
                                        tabIndex={!hasVoted ? 0 : -1}
                                    >
                                        {/* Gradient Bar */}
                                        {(hasVoted || poll.totalVotes > 0) && (
                                            <div
                                                className="poll-option__bar"
                                                style={{
                                                    width: `${percent}%`,
                                                    opacity: isWinner ? 0.25 : 0.1,
                                                    background: isWinner ? 'var(--primary-gradient)' : 'var(--bg-input)'
                                                }}
                                            />
                                        )}

                                        <div className="poll-option__content">
                                            <span className="poll-option__text" style={{ flex: 1 }}>
                                                {isVotedOption && hasVoted && (
                                                    <span style={{ marginRight: '8px', color: 'var(--primary)' }}>✓</span>
                                                )}
                                                {option.text}
                                            </span>

                                            <div className="poll-option__stats">
                                                {(hasVoted || poll.totalVotes > 0) && (
                                                    <div style={{ textAlign: 'right' }}>
                                                        <span className="poll-option__percent">{percent}%</span>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                            {option.votes} votes
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {!hasVoted ? (
                            <button
                                className="btn btn-primary btn-full btn-lg"
                                style={{ marginTop: '2rem' }}
                                onClick={handleVote}
                                disabled={selectedOption < 0 || voting}
                            >
                                {voting ? 'Securely Transmitting...' : 'Submit Vote'}
                            </button>
                        ) : (
                            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: '12px', textAlign: 'center', fontWeight: '600' }}>
                                Vote Confirmed & Logged
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Donut Chart Simulation (CSS) */}
                    <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>Analytics</h3>

                        <div style={{
                            width: '180px', height: '180px',
                            margin: '0 auto',
                            borderRadius: '50%',
                            background: 'conic-gradient(#8B5CF6 0% 65%, #1F2937 65% 100%)',
                            position: 'relative',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <div style={{
                                width: '140px', height: '140px',
                                background: '#151A23',
                                borderRadius: '50%',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <span style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: '1' }}>
                                    {poll.totalVotes}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Votes</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8B5CF6' }}></span>
                                Recorded
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1F2937' }}></span>
                                Remaining
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <label className="form-label">Share Access</label>
                        <div className="share-box">
                            <div className="share-box__url" style={{ fontSize: '0.8rem' }}>{window.location.href}</div>
                            <button className="share-box__btn" onClick={copyShareLink}>
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    {viewerCount > 0 && (
                        <div style={{
                            padding: '1rem', background: '#1F2937', borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            border: '1px solid #2D3748'
                        }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Active Viewers</span>
                            <span style={{ color: '#10B981', fontWeight: 'bold' }}>{viewerCount}</span>
                        </div>
                    )}
                </div>

            </div>

            <div
                className={`toast ${toast.show ? 'toast--visible' : ''} ${toast.type === 'error' ? 'toast--error' : 'toast--success'
                    }`}
            >
                {toast.type === 'error' ? '⚠️' : '✅'} {toast.message}
            </div>
        </div>
    );
}

function PollHeader() {
    return (
        <header className="header" style={{ marginBottom: '2rem' }}>
            <Link to="/" className="header-logo">
                <span>PollRoom</span>
            </Link>
            <div className="live-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                Dashboard View
            </div>
        </header>
    );
}
