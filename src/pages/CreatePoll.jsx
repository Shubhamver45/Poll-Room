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
            setError('Please enter a question.');
            setLoading(false);
            return;
        }

        const validOptions = options.filter(o => o.trim() !== '');
        if (validOptions.length < 2) {
            setError('Please provide at least 2 options.');
            setLoading(false);
            return;
        }

        try {
            const data = await createPoll(question, validOptions);
            navigate(`/poll/${data.poll.shareId}`);
        } catch (err) {
            setError(err.message || 'Failed to create poll');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container">
            <header className="header" style={{ border: 'none', paddingBottom: '0' }}>
                <div className="header-logo">
                    <span>PollRoom</span>
                </div>
            </header>

            <div style={{ maxWidth: '600px', margin: '4rem auto' }}>
                <div className="card">
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: '600' }}>Create a new poll</h1>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Question</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="What would you like to ask?"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Options</span>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>Min 2</span>
                            </label>

                            {options.map((option, index) => (
                                <div key={index} className="option-row">
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder={`Option ${index + 1}`}
                                        value={option}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                    />
                                    {options.length > 2 && (
                                        <button
                                            type="button"
                                            className="remove-option-btn"
                                            onClick={() => removeOption(index)}
                                            aria-label="Remove option"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={addOption}
                            style={{ marginBottom: '2rem', borderStyle: 'dashed' }}
                            disabled={options.length >= 10}
                        >
                            + Add Option
                        </button>

                        {error && (
                            <div style={{ color: '#EF4444', marginBottom: '1rem', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary btn-full"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Poll'}
                        </button>
                    </form>
                </div>

                <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    <p>No account required • Instant setup • Secure</p>
                </div>
            </div>
        </div>
    );
}
