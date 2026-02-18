import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPoll } from '../services/api';
import { getSocket, joinPollRoom, leavePollRoom, emitVote } from '../services/socket';
import { getVoterId, markPollAsVoted, hasVotedOnPoll } from '../services/voter';

/* --- PARTICLES COMPONENT --- */
const Confetti = ({ theme }) => {
    const particles = Array.from({ length: 40 });
    const getColors = () => {
        // Colors match the theme
        if (theme === 'theme-fire') return ['#EF4444', '#B91C1C', '#FFA500'];
        if (theme === 'theme-joy') return ['#D946EF', '#8B5CF6', '#F472B6'];
        if (theme === 'theme-emerald') return ['#10B981', '#059669', '#34D399'];
        return ['#3B82F6', '#60A5FA', '#93C5FD']; // Default Blue
    };
    const colors = getColors();

    return (
        <div className="confetti-container">
            {particles.map((_, i) => {
                const left = Math.random() * 100;
                const color = colors[Math.floor(Math.random() * colors.length)];
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
                            animation: `fall ${1 + Math.random() * 2}s linear ${Math.random() * 0.5}s forwards`,
                            opacity: 0.8
                        }}
                    />
                );
            })}
            <style>{`@keyframes fall { to { transform: translateY(100vh) rotate(360deg); opacity: 0; } }`}</style>
        </div>
    );
};

// --- NEURAL THEME LOGIC (Restored) ---
const determineTheme = (text) => {
    const t = text.toLowerCase();

    const fireKeywords = ['hate', 'worst', 'kill', 'war', 'danger', 'dead', 'die', 'bad', 'evil', 'fight', 'angry', 'error', 'fail'];
    if (fireKeywords.some(k => t.includes(k))) return 'theme-fire'; // RED

    const joyKeywords = ['love', 'best', 'happy', 'good', 'fun', 'joy', 'cute', 'win', 'party', 'laugh', 'friend', 'beautiful', 'nice'];
    if (joyKeywords.some(k => t.includes(k))) return 'theme-joy'; // PURPLE/PINK

    const moneyKeywords = ['money', 'rich', 'finance', 'cash', 'bitcoin', 'crypto', 'gold', 'wealth', 'invest', 'stock', 'profit', 'tree', 'nature', 'growth'];
    if (moneyKeywords.some(k => t.includes(k))) return 'theme-emerald'; // GREEN

    return ''; // Default Cyber Blue
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
    const [showConfetti, setShowConfetti] = useState(false);

    // Theme State
    const [themeClass, setThemeClass] = useState('');

    const prevTotalRef = useRef(0);
    const voterId = getVoterId();

    const showToast = useCallback((message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
    }, []);

    // Fetch Poll & Set Theme
    useEffect(() => {
        const fetchPoll = async () => {
            try {
                const data = await getPoll(shareId, voterId);
                setPoll(data.poll);
                prevTotalRef.current = data.poll.totalVotes;

                // Apply Neural Theme based on Question Content
                const detectedTheme = determineTheme(data.poll.question);
                if (detectedTheme) {
                    setThemeClass(detectedTheme);
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

    // Apply Theme to Body (Global Background Switch)
    useEffect(() => {
        if (themeClass) {
            document.body.className = themeClass; // Apply to body for full BG change
        } else {
            document.body.className = '';
        }
        return () => { document.body.className = ''; }; // Cleanup
    }, [themeClass]);


    useEffect(() => {
        const socket = getSocket();
        joinPollRoom(shareId);

        socket.on('poll-updated', (data) => {
            prevTotalRef.current = data.totalVotes;
            setPoll((prev) => prev ? { ...prev, options: data.options, totalVotes: data.totalVotes } : prev);
        });

        socket.on('poll-data', (data) => {
            setPoll((prev) => prev ? { ...prev, options: data.options, totalVotes: data.totalVotes } : prev);
        });

        socket.on('viewer-count', (data) => {
            setViewerCount(data.count);
        });

        socket.on('vote-success', (data) => {
            setHasVoted(true);
            setVotedOptionIndex(data.votedOptionIndex);
            setVoting(false);
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
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
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(true);
            showToast('Link copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const downloadReport = () => {
        if (!poll) return;
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += `Question,${poll.question}\n`;
        csvContent += `Total Votes,${poll.totalVotes}\n\n`;
        csvContent += "Option,Votes,%\n";
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
                <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Loading Neural Interface...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="app-container">
                <div className="card" style={{ textAlign: 'center', borderColor: '#EF4444' }}>
                    <p style={{ color: '#EF4444', marginBottom: '1rem' }}>{error}</p>
                    <Link to="/" className="btn btn-secondary">RETURN HOME</Link>
                </div>
            </div>
        );
    }

    const maxVotes = Math.max(...poll.options.map((o) => o.votes), 0);

    return (
        <div className={`app-container ${themeClass}`}>
            <header className="header">
                <Link to="/" className="header-logo" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <span>PollRoom</span>
                </Link>
                <div className="live-badge">NEURAL LIVE</div>
            </header>

            {showConfetti && <Confetti theme={themeClass} />}

            <div className="poll-grid">
                {/* Left Column: Voting */}
                <div style={{ flex: 2 }}>
                    <h1 className="poll-question">{poll.question}</h1>

                    <div style={{ marginTop: '2rem' }}>
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
                                    key={i}
                                    className={styleClass}
                                    onClick={() => { if (!hasVoted && !voting) setSelectedOption(i); }}
                                    role="button"
                                    tabIndex={!hasVoted ? 0 : -1}
                                >
                                    {/* Gradient Bar */}
                                    {(hasVoted || poll.totalVotes > 0) && (
                                        <div className="poll-option__bar" style={{ width: `${percent}%` }} />
                                    )}

                                    <div className="poll-option__content">
                                        <span className="poll-option__text" style={{ flex: 1 }}>
                                            {option.text}
                                            {isVotedOption && hasVoted && <span style={{ marginLeft: '8px', color: 'var(--primary)' }}>✓</span>}
                                        </span>

                                        {(hasVoted || poll.totalVotes > 0) && (
                                            <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                                                <span className="poll-option__percent">{percent}%</span>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                                                    {option.votes}
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
                            className="btn btn-primary btn-full"
                            style={{ marginTop: '1.5rem' }}
                            onClick={handleVote}
                            disabled={selectedOption < 0 || voting}
                        >
                            {voting ? 'TRANSMIT' : 'VOTE'}
                        </button>
                    ) : (
                        <div style={{ marginTop: '1.5rem', padding: '1rem', border: '1px solid var(--primary)', borderRadius: '12px', textAlign: 'center', color: 'var(--primary)', fontWeight: 'bold', boxShadow: '0 0 10px var(--primary-glow)' }}>
                            VOTE CONFIRMED
                        </div>
                    )}
                </div>

                {/* Right Column: Stats */}
                <div style={{ flex: 1 }}>
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Total Votes</span>
                            <span style={{ fontWeight: '700', fontSize: '1.5rem' }}>{poll.totalVotes}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Active Nodes</span>
                            <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{viewerCount}</span>
                        </div>
                    </div>

                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', background: 'var(--bg-input)', padding: '0.5rem', borderRadius: '8px' }}>
                            <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                {window.location.href}
                            </div>
                            <button onClick={copyShareLink} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                {copied ? 'COPIED' : 'COPY'}
                            </button>
                        </div>
                        <button className="btn btn-secondary btn-full" onClick={downloadReport} style={{ fontSize: '0.85rem' }}>
                            DOWNLOAD .CSV REPORT
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
