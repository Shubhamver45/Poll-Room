import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPoll } from '../services/api';
import { getSocket, joinPollRoom, leavePollRoom, emitVote } from '../services/socket';
import { getVoterId, markPollAsVoted, hasVotedOnPoll } from '../services/voter';
// Removed: LiveTerminal, LiveLedger (User Request: "Remove Both")

// --- Neural UI Logic (Client-Side AI) ---
const determineTheme = (text) => {
    const t = text.toLowerCase();

    const fireKeywords = ['hate', 'worst', 'kill', 'war', 'danger', 'dead', 'die', 'bad', 'evil', 'fight', 'angry', 'error', 'fail'];
    if (fireKeywords.some(k => t.includes(k))) return 'theme-fire';

    const joyKeywords = ['love', 'best', 'happy', 'good', 'fun', 'joy', 'cute', 'win', 'party', 'laugh', 'friend', 'beautiful', 'nice'];
    if (joyKeywords.some(k => t.includes(k))) return 'theme-joy';

    const moneyKeywords = ['money', 'rich', 'finance', 'cash', 'bitcoin', 'crypto', 'gold', 'wealth', 'invest', 'stock', 'profit', 'tree', 'nature', 'growth'];
    if (moneyKeywords.some(k => t.includes(k))) return 'theme-emerald';

    return ''; // Default Cyber Blue
};

// Audio Generation Utility (Simple Beeps)
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
        osc.type = 'square'; // Sharper sound
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'theme') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
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

    // Track previous total to play sound on incoming votes
    const prevTotalRef = useRef(0);
    const voterId = getVoterId();

    const showToast = useCallback((message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3500);
    }, []);

    // Fetch Initial Data
    useEffect(() => {
        const fetchPoll = async () => {
            try {
                const data = await getPoll(shareId, voterId);
                setPoll(data.poll);
                prevTotalRef.current = data.poll.totalVotes;

                // Neural Theme
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

    // Socket.IO Events
    useEffect(() => {
        const socket = getSocket();
        joinPollRoom(shareId);

        socket.on('poll-updated', (data) => {
            // Check if vote count increased to play sound
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
            setPoll((prev) =>
                prev ? { ...prev, options: data.options, totalVotes: data.totalVotes } : prev
            );
        });

        socket.on('viewer-count', (data) => {
            setViewerCount(data.count);
        });

        socket.on('vote-success', (data) => {
            playSound('vote');
            setHasVoted(true);
            setVotedOptionIndex(data.votedOptionIndex);
            setVoting(false);
            showToast('Vote Registered Successfully', 'success');
        });

        socket.on('vote-error', (data) => {
            playSound('error');
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
                    <Link to="/create" className="btn btn-primary">
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    const maxVotes = Math.max(...poll.options.map((o) => o.votes), 1);

    // Find Winning Option
    const winningOption = poll.options.reduce((prev, current) => (prev.votes > current.votes) ? prev : current);
    const winningPercent = poll.totalVotes > 0 ? Math.round((winningOption.votes / poll.totalVotes) * 100) : 0;

    return (
        <div className={`app-container ${themeClass}`}>
            <PollHeader />

            {/* Responsive Grid: Stacks on mobile */}
            <div className="poll-grid">

                {/* Left Column: Main Voting Area */}
                <div style={{ flex: '2', minWidth: '320px' }}>
                    <div className="card" style={{ borderTop: `4px solid var(--primary)` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <h1 className="poll-question" style={{ fontSize: '1.5rem', wordBreak: 'break-word', lineHeight: '1.4' }}>
                                {poll.question}
                            </h1>
                            <div className="live-badge">Live</div>
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
                                            if (!hasVoted && !voting) {
                                                setSelectedOption(i);
                                                // playSound('update'); // Subtle sound on selection
                                            }
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
                                {voting ? 'Processing...' : 'Submit Vote'}
                            </button>
                        ) : (
                            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: '12px', textAlign: 'center', fontWeight: '600' }}>
                                Vote Recorded
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Clean Analytics Dashboard */}
                <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {/* Total Votes Card */}
                        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--bg-card-secondary, #1F2937)' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Total Votes
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                                {poll.totalVotes}
                            </div>
                        </div>

                        {/* Live Viewers Card */}
                        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--bg-card-secondary, #1F2937)' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Live Viewers
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981' }}>
                                {viewerCount}
                            </div>
                        </div>
                    </div>

                    {/* Current Leader Spotlight Card */}
                    {poll.totalVotes > 0 && (
                        <div className="card" style={{
                            padding: '1.5rem',
                            textAlign: 'center',
                            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.0) 100%)',
                            border: '1px solid rgba(245, 158, 11, 0.2)'
                        }}>
                            <div style={{ fontSize: '0.7rem', color: '#F59E0B', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Currently In The Lead
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                                {winningOption.text}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#F59E0B' }}>
                                {winningPercent}% of Total Votes
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
                            <span>📥</span> Download Results (.csv)
                        </button>
                    </div>

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
