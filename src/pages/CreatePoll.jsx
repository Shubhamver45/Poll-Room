import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPoll } from '../services/api';

export default function CreatePoll() {
    const navigate = useNavigate();
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        if (options.length < 10) {
            setOptions([...options, '']);
        }
    };

    const removeOption = (index) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!question.trim()) {
            setError('System Error: Question parameter missing');
            setLoading(false);
            return;
        }

        const validOptions = options.filter(o => o.trim() !== '');
        if (validOptions.length < 2) {
            setError('System Error: Minimum 2 response vectors required');
            setLoading(false);
            return;
        }

        try {
            const data = await createPoll(question, validOptions);
            navigate(`/poll/${data.poll.shareId}`);
        } catch (err) {
            setError(err.message || 'Initialization Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', minHeight: '100vh' }}>

            {/* Header */}
            <header className="top-header" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-1px', margin: 0 }}>
                        <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: '#A78BFA' }}>Poll</span>Room
                        </Link>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: '0.5rem 0 0' }}>Configure new polling instance.</p>
                </div>
                <div style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '0.5rem 1rem', background: '#1F2937', borderRadius: '8px' }}>
                    ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}
                </div>
            </header>

            {/* Dashboard Grid Layout */}
            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem' }}>

                {/* Left Panel: Configuration Form */}
                <div className="card" style={{ gridColumn: 'span 1' }}>
                    <div className="card-title" style={{ marginBottom: '2rem' }}>
                        Poll Configuration
                        <span style={{ fontSize: '0.8rem', background: '#374151', padding: '2px 8px', borderRadius: '4px', color: '#9CA3AF' }}>DRAFT</span>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Question Input - FULL WIDTH VERTICAL STACK */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label style={{ color: '#A78BFA', fontWeight: '700', fontSize: '0.9rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                Poll Inquiry (Question)
                            </label>
                            <input
                                type="text"
                                placeholder="Enter system query..."
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: '#111827',
                                    border: '1px solid #374151',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '1.1rem',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        {/* Response Options - FULL WIDTH VERTICAL STACK */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <label style={{ color: '#A78BFA', fontWeight: '700', fontSize: '0.9rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                Response Vectors
                            </label>

                            {options.map((option, index) => (
                                <div key={index} style={{ position: 'relative', width: '100%' }}>
                                    <div style={{
                                        position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                                        width: '24px', height: '24px', background: '#374151',
                                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.75rem', color: '#FFF', fontWeight: 'bold', zIndex: 2
                                    }}>
                                        {index + 1}
                                    </div>
                                    <input
                                        type="text"
                                        style={{
                                            width: '100%',
                                            padding: '0.8rem 1rem 0.8rem 3.5rem',
                                            background: '#1F2937',
                                            border: '1px solid #374151',
                                            borderRadius: '10px',
                                            color: '#E5E7EB',
                                            fontSize: '1rem'
                                        }}
                                        placeholder={`Option ${index + 1}`}
                                        value={option}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                    />
                                    {options.length > 2 && (
                                        <button
                                            type="button"
                                            className="remove-option-btn"
                                            onClick={() => removeOption(index)}
                                            style={{
                                                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                                background: 'none', border: 'none', color: '#EF4444',
                                                cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px'
                                            }}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}

                            <button
                                type="button"
                                style={{
                                    width: '100%',
                                    marginTop: '0.5rem',
                                    border: '1px dashed #4B5563',
                                    borderRadius: '10px',
                                    background: 'transparent',
                                    color: '#9CA3AF',
                                    padding: '0.8rem',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    transition: 'border-color 0.2s, color 0.2s'
                                }}
                                onClick={addOption}
                                disabled={options.length >= 10}
                                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#A78BFA'; e.currentTarget.style.color = '#A78BFA'; }}
                                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#4B5563'; e.currentTarget.style.color = '#9CA3AF'; }}
                            >
                                + Add Response Parameter
                            </button>
                        </div>

                        {error && (
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: '#EF4444',
                                padding: '1rem',
                                borderRadius: '8px',
                                display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem'
                            }}>
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid #374151', paddingTop: '2rem' }}>
                            <button
                                type="button"
                                className="btn"
                                style={{ padding: '0.8rem 1.5rem', background: '#374151', color: '#FFF', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '500' }}
                                onClick={() => navigate('/')}
                            >
                                Abort
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ flex: 1, border: 'none', fontSize: '1rem', letterSpacing: '1px', borderRadius: '10px', padding: '0.8rem' }}
                                disabled={loading}
                            >
                                {loading ? 'INITIALIZING...' : 'INITIALIZE POLL SYSTEM'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right Panel: Parameters Info */}
                <div className="card" style={{ height: 'fit-content' }}>
                    <div className="card-title" style={{ marginBottom: '1.5rem' }}>
                        Parameters
                        <span style={{ fontSize: '1.2rem' }}>⚙️</span>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.95rem', color: '#D1D5DB', lineHeight: '2.2' }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: '#10B981' }}>✓</span> Max 500 characters
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: '#10B981' }}>✓</span> Min 2 options required
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: '#10B981' }}>✓</span> Max 10 options allowed
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: '#10B981' }}>✓</span> Instant deployment
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: '#10B981' }}>✓</span> Real-time encryption
                        </li>
                    </ul>

                    <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <div style={{ fontSize: '0.8rem', color: '#3B82F6', fontWeight: 'bold', marginBottom: '4px' }}>TIP</div>
                        <div style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>
                            Use clear, concise language for optimal voter engagement.
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
