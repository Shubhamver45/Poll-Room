import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
        <div className="app-container">
            <header className="header" style={{ borderBottom: 'none' }}>
                <div className="header-logo">
                    <span>Configure New Poll</span>
                </div>
                <div style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}
                </div>
            </header>

            <div className="poll-grid"> {/* Uses grid for side-by-side layout */}

                {/* Left Panel: Form */}
                <div className="card" style={{ flex: 2 }}>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Poll Inquiry (Question)</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Type your question here..."
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Response Options</label>

                            {options.map((option, index) => (
                                <div key={index} className="option-row" style={{ position: 'relative' }}>
                                    <div style={{
                                        position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                                        width: '24px', height: '24px', background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold'
                                    }}>
                                        {index + 1}
                                    </div>
                                    <input
                                        type="text"
                                        className="form-input"
                                        style={{ paddingLeft: '3rem' }} // Space for number
                                        placeholder={`Option ${index + 1}`}
                                        value={option}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                    />
                                    {options.length > 2 && (
                                        <button
                                            type="button"
                                            className="remove-option-btn"
                                            onClick={() => removeOption(index)}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            className="btn btn-secondary btn-full"
                            style={{
                                marginBottom: '2rem',
                                borderStyle: 'dashed',
                                background: 'rgba(255,255,255,0.02)'
                            }}
                            onClick={addOption}
                            disabled={options.length >= 10}
                        >
                            + Add Response Parameter
                        </button>

                        {error && (
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: '#EF4444',
                                padding: '1rem',
                                borderRadius: '8px',
                                marginBottom: '1.5rem',
                                display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem'
                            }}>
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ width: '120px' }}
                                onClick={() => navigate('/')}
                            >
                                Abort
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ flex: 1, background: 'linear-gradient(90deg, #8B5CF6 0%, #EC4899 100%)', border: 'none' }}
                                disabled={loading}
                            >
                                {loading ? 'INITIALIZING...' : 'INITIALIZE POLL SYSTEM'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right Panel: Parameters (The box in your screenshot) */}
                <div className="card" style={{ flex: 1, height: 'fit-content' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: '700' }}>Parameters</h3>
                    <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#10B981' }}>✓</span> Max 500 characters
                        </li>
                        <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#10B981' }}>✓</span> Min 2 options required
                        </li>
                        <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#10B981' }}>✓</span> Max 10 options allowed
                        </li>
                        <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#10B981' }}>✓</span> Instant deployment
                        </li>
                    </ul>
                </div>

            </div>
        </div>
    );
}
