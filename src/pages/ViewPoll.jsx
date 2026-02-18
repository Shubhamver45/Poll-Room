import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPoll } from '../services/api';
import { getSocket, joinPollRoom, leavePollRoom, emitVote } from '../services/socket';
import { getVoterId, markPollAsVoted, hasVotedOnPoll } from '../services/voter';

/* --- PARTICLES COMPONENT (No external lib needed) --- */
const Confetti = () => {
    const particles = Array.from({ length: 50 });
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
            {particles.map((_, i) => {
                const left = Math.random() * 100;
                const animDuration = 1 + Math.random() * 2;
                const animDelay = Math.random() * 0.5;
                const color = ['#FFD700', '#FF69B4', '#00BFFF', '#32CD32'][Math.floor(Math.random() * 4)];

                return (
                    <div
                        key={i}
                        style={{
                            position: 'absolute',
                            top: '-10px',
                            left: `${left}%`,
                            width: '8px',
                            height: '8px',
                            backgroundColor: color,
                            borderRadius: '50%',
                            animation: `fall ${animDuration}s linear ${animDelay}s forwards`,
                            opacity: 0.8
                        }}
                    />
                );
            })}
            <style>{`
        @keyframes fall {
          to { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
        </div>
    );
};

// --- Neural UI Logic ---
const determineTheme = (text) => {
    const t = text.toLowerCase();
    const fireKeywords = ['hate', 'worst', 'kill', 'war', 'danger', 'dead', 'die', 'bad', 'evil', 'fight', 'angry', 'error', 'fail'];
    if (fireKeywords.some(k => t.includes(k))) return 'theme-fire';
    const joyKeywords = ['love', 'best', 'happy', 'good', 'fun', 'joy', 'cute', 'win', 'party', 'laugh', 'friend', 'beautiful', 'nice'];
    if (joyKeywords.some(k => t.includes(k))) return 'theme-joy';
    const moneyKeywords = ['money', 'rich', 'finance', 'cash', 'bitcoin', 'crypto', 'gold', 'wealth', 'invest', 'stock', 'profit', 'tree', 'nature', 'growth'];
    if (moneyKeywords.some(k => t.includes(k))) return 'theme-emerald';
    return '';
};

const playSound = (type) => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'vote') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'update') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime); // High ping
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'theme') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    }
};

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
    const [themeClass, setThemeClass] = useState('');
    const [showConfetti, setShowConfetti] = useState(false);

    const prevTotalRef = useRef(0);
    const voterId = getVoterId();

    const showToast = useCallback((message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3500);
    }, []);

    useEffect(() => {
        const fetchPoll = async () => {
            try {
                const data = await getPoll(shareId, voterId);
                setPoll(data.poll);
                prevTotalRef.current = data.poll.totalVotes;
                const detectedTheme = determineTheme(data.poll.question);
                if (detectedTheme) {
                    setThemeClass(detectedTheme);
                    setTimeout(() => playSound('theme'), 500);
                }
                if (data.hasVoted) {
                    setHasVoted(true);
                    setVotedOptionIndex(data.votedOptionIndex);
                }
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

    useEffect(() => {
        const socket = getSocket();
        joinPollRoom(shareId);

        socket.on('poll-updated', (data) => {
            if (data.totalVotes > prevTotalRef.current) {
                playSound('update');
            }
            prevTotalRef.current = data.totalVotes;
            setPoll((prev) => {
                if (!prev) return prev;
                return { ...prev, options: data.options, totalVotes: data.totalVotes };
            });
        });

        socket.on('poll-data', (data) => {
            setPoll((prev) => prev ? { ...prev, options: data.options, totalVotes: data.totalVotes } : prev);
        });

        socket.on('viewer-count', (data) => {
            setViewerCount(data.count);
        });

        socket.on('vote-success', (data) => {
            playSound('vote');
            setHasVoted(true);
            setVotedOptionIndex(data.votedOptionIndex);
            setVoting(false);
            setShowConfetti(true); // Trigger Confetti
            setTimeout(() => setShowConfetti(false), 3000);
            showToast('Vote Registered Successfully', 'success');
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
            setCopied(true);
            showToast('Link copied to clipboard');
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const downloadReport = () => {
        if (!poll) return;
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += `Poll Question: ${poll.question}\n`;
        csvContent += `Total Votes: ${poll.totalVotes}\n\n`;
        csvContent += "Option,Votes,Percentage\n";
        poll.options.forEach(opt => {
            const percent = poll.totalVotes > 0 ? ((opt.votes / poll.totalVotes) * 100).toFixed(1) : 0;
            csvContent += `"${opt.text}",${opt.votes},${percent}%\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `poll_${shareId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PollHeader />
                <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Loading Poll...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="app-container">
                <PollHeader />
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <h2 className="card-title" style={{ justifyContent: 'center', color: '#EF4444' }}>
                        System Error
                    </h2>
                    <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>{error}</p>
                    <Link to="/create" className="btn btn-primary">Return Home</Link>
                </div>
            </div>
        );
    }

    const maxVotes = Math.max(...poll.options.map((o) => o.votes), 1);
    const winningOption = poll.options.reduce((prev, current) => (prev.votes > current.votes) ? prev : current);
    const winningPercent = poll.totalVotes > 0 ? Math.round((winningOption.votes / poll.totalVotes) * 100) : 0;

    return (
        <div className={`app-container ${themeClass}`}>
            <PollHeader />
            {showConfetti && <Confetti />}

            <div className="poll-grid">
                {/* Left Column: Main Voting Area */}
                <div style={{ flex: '2', minWidth: '320px' }}>
                    <div className="card" style={{ borderTop: `1px solid rgba(255,255,255,0.1)` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <h1 className="poll-question">
                                {poll.question}
                            </h1>
                            <div className="live-badge">Live</div>
                        </div>

                        <div className="poll-options">
                            {poll.options.map((option, i) => {
                                const percent = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
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
                                        onClick={() => { if (!hasVoted && !voting) setSelectedOption(i); }}
                                        role="button"
                                        tabIndex={!hasVoted ? 0 : -1}
                                    >
                                        {(hasVoted || poll.totalVotes > 0) && (
                                            <div
                                                className="poll-option__bar"
                                                style={{ width: `${percent}%` }}
                                            />
                                        )}

                                        <div className="poll-option__content">
                                            <span className="poll-option__text" style={{ flex: 1 }}>
                                                {isVotedOption && hasVoted && <span style={{ marginRight: '8px', color: 'var(--accent-success)' }}>✓</span>}
                                                {option.text}
                                            </span>
                                            {(hasVoted || poll.totalVotes > 0) && (
                                                <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                                    <span style={{ color: isWinner ? 'var(--accent-gold)' : 'inherit' }}>{percent}%</span>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                                                        {option.votes} votes
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {!hasVoted ? (
                            <button
                                className="btn btn-full btn-lg btn-primary"
                                style={{ marginTop: '2rem' }}
                                onClick={handleVote}
                                disabled={selectedOption < 0 || voting}
                            >
                                {voting ? 'Encrypting Vote...' : 'Submit Vote'}
                            </button>
                        ) : (
                            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#34D399', borderRadius: '12px', textAlign: 'center', fontWeight: '600', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                Vote Confirmed on Ledger
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Clean Analytics Dashboard */}
                <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Total Votes
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                                {poll.totalVotes}
                            </div>
                        </div>

                        <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Live Viewers
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#34D399' }}>
                                {viewerCount}
                            </div>
                        </div>
                    </div>

                    {/* Current Leader Spotlight Card */}
                    {poll.totalVotes > 0 && (
                        <div className="card" style={{
                            padding: '1.5rem',
                            textAlign: 'center',
                            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.0) 100%)',
                            border: '1px solid rgba(251, 191, 36, 0.3)'
                        }}>
                            <div style={{ fontSize: '0.7rem', color: '#FBBF24', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Currently Leading
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                                {winningOption.text}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#FBBF24' }}>
                                {winningPercent}% Dominance
                            </div>
                        </div>
                    )}

                    {/* Actions Card */}
                    <div className="card">
                        <label className="form-label">Share Poll</label>
                        <div className="share-box">
                            <div className="share-box__url" style={{ fontSize: '0.8rem' }}>{window.location.href}</div>
                            <button className="share-box__btn" onClick={copyShareLink}>
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>

                        <button
                            className="btn btn-secondary btn-full"
                            style={{ marginTop: '1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            onClick={downloadReport}
                        >
                            <span>📥</span> Download Report
                        </button>
                    </div>

                </div>
            </div>

            <div className={`toast ${toast.show ? 'toast--visible' : ''}`}>
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
            <div className="live-badge">Dashboard View</div>
        </header>
    );
}
