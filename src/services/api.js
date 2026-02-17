// API base URL - change this for production
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const createPoll = async (question, options) => {
    const res = await fetch(`${API_URL}/api/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ question, options }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create poll');
    return data;
};

export const getPoll = async (shareId, voterId) => {
    const params = voterId ? `?voterId=${voterId}` : '';
    const res = await fetch(`${API_URL}/api/polls/${shareId}${params}`, {
        credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch poll');
    return data;
};

export const votePoll = async (shareId, optionIndex, voterId) => {
    const res = await fetch(`${API_URL}/api/polls/${shareId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ optionIndex, voterId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to vote');
    return data;
};

export default API_URL;
