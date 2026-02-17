// Generates a unique voter ID and persists it in localStorage
const VOTER_ID_KEY = 'pollroom_voter_id';

export const getVoterId = () => {
    let voterId = localStorage.getItem(VOTER_ID_KEY);
    if (!voterId) {
        voterId = `voter_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(VOTER_ID_KEY, voterId);
    }
    return voterId;
};

// Track which polls a voter has voted on (client-side)
const VOTED_POLLS_KEY = 'pollroom_voted_polls';

export const getVotedPolls = () => {
    try {
        return JSON.parse(localStorage.getItem(VOTED_POLLS_KEY) || '{}');
    } catch {
        return {};
    }
};

export const markPollAsVoted = (shareId, optionIndex) => {
    const voted = getVotedPolls();
    voted[shareId] = { optionIndex, votedAt: Date.now() };
    localStorage.setItem(VOTED_POLLS_KEY, JSON.stringify(voted));
};

export const hasVotedOnPoll = (shareId) => {
    const voted = getVotedPolls();
    return voted[shareId] || null;
};
