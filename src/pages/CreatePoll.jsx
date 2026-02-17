import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPoll } from '../services/api';

export default function CreatePoll() {
    const navigate = useNavigate();
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const addOption = () => {
        if (options.length < 10) setOptions([...options, '']);
    };

    const removeOption = (index) => {
        if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
    };

    const updateOption = (index, value) => {
        const updated = [...options];
        updated[index] = value;
        setOptions(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const trimmedOptions = options.map(o => o.trim()).filter(o => o);
        if (!question.trim() || trimmedOptions.length < 2) {
            setError('Please input a valid question and at least 2 options.');
            return;
        }

        setLoading(true);
        try {
            const data = await createPoll(question.trim(), trimmedOptions);
            navigate(`/poll/${data.poll.shareId}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container">
            <header className="header" style={{ marginBottom: '2rem' }}>
                <h1 className="header-title" style={{ fontSize: '1.5rem', marginBottom: '0rem' }}>
                    Configure New Poll
                </h1>
                <div style={{ color: 'var(--text-muted)' }}>ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '2rem' }}>

                {/* Main Form */}
                <form onSubmit={handleSubmit} className="card">
                    <div className="form-group">
                        <label className="form-label">Poll Inquiry (Question)</label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="Type your question here..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Response Options</label>
                        {options.map((opt, i) => (
                            <div className="option-row" key={i}>
                                <div style={{
                                    width: '24px', height: '24px',
                                    background: '#1F2937', color: '#6B7280',
                                    borderRadius: '50%', textAlign: 'center', lineHeight: '24px',
                                    fontSize: '0.75rem', fontWeight: 'bold'
                                }}>
                                    {i + 1}
                                </div>
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder={`Option ${i + 1}`}
                                    value={opt}
                                    onChange={(e) => updateOption(i, e.target.value)}
                                    style={{ flex: 1 }}
                                />
                                {options.length > 2 && (
                                    <button
                                        type="button"
                                        className="remove-option-btn"
                                        onClick={() => removeOption(i)}
                                    >
                                        &times;
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {options.length < 10 && (
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ width: '100%', marginBottom: '1.5rem', border: '1px dashed #2D3748' }}
                            onClick={addOption}
                        >
                            + Add Response Parameter
                        </button>
                    )}

                    {error && (
                        <div style={{
                            padding: '1rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#EF4444',
                            borderRadius: '8px',
                            marginBottom: '1.5rem',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #2D3748' }}>
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => navigate('/')}
                        >
                            Abort
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ flex: 1 }}
                        >
                            {loading ? 'Initiating...' : 'Initialize Poll System'}
                        </button>
                    </div>
                </form>

                {/* Help Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Parameters</h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            <li style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                <span style={{ color: '#10B981' }}>✓</span> Max 500 characters
                            </li>
                            <li style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                <span style={{ color: '#10B981' }}>✓</span> Min 2 options required
                            </li>
                            <li style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                                <span style={{ color: '#10B981' }}>✓</span> Max 10 options allowed
                            </li>
                            <li style={{ display: 'flex', gap: '0.5rem' }}>
                                <span style={{ color: '#10B981' }}>✓</span> Instant deployment
                            </li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
}
