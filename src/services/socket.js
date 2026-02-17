import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
    if (!socket) {
        socket = io(API_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            autoConnect: true,
        });
    }
    return socket;
};

export const joinPollRoom = (shareId) => {
    const s = getSocket();
    s.emit('join-poll', shareId);
};

export const leavePollRoom = (shareId) => {
    const s = getSocket();
    s.emit('leave-poll', shareId);
};

export const emitVote = (shareId, optionIndex, voterId) => {
    const s = getSocket();
    s.emit('vote', { shareId, optionIndex, voterId });
};

export default getSocket;
