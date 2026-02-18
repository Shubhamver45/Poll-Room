import { useEffect, useRef, useState } from 'react';

const LOG_TYPES = {
    INFO: { color: '#3B82F6', prefix: 'INF' },
    SUCCESS: { color: '#10B981', prefix: 'SUC' },
    WARN: { color: '#F59E0B', prefix: 'WRN' },
    ERROR: { color: '#EF4444', prefix: 'ERR' },
    SYSTEM: { color: '#8B5CF6', prefix: 'SYS' },
};

export default function LiveTerminal({ logs = [], height = '200px' }) {
    const bottomRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="terminal-container" style={{ height }}>
            <div className="terminal-header">
                <div className="terminal-dots">
                    <div className="dot red"></div>
                    <div className="dot yellow"></div>
                    <div className="dot green"></div>
                </div>
                <div className="terminal-title">LIVE_EVENT_STREAM // ENCRYPTED</div>
            </div>
            <div className="terminal-body font-mono">
                {logs.length === 0 && (
                    <div style={{ opacity: 0.5 }}>Waiting for stream data...</div>
                )}
                {logs.map((log, i) => {
                    const type = LOG_TYPES[log.type] || LOG_TYPES.INFO;
                    return (
                        <div key={i} className="log-line">
                            <span className="log-time">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                            <span style={{ color: type.color, margin: '0 8px', fontWeight: 'bold' }}>{type.prefix}</span>
                            <span className="log-msg">&gt; {log.message}</span>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
