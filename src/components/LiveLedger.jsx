import { useEffect, useState, useRef } from 'react';

export default function LiveLedger({ options, totalVotes, theme = 'default' }) {
    const svgRef = useRef(null);
    const [points, setPoints] = useState([]);

    // Calculate chart data
    useEffect(() => {
        if (!options || options.length === 0) return;

        const maxVotes = Math.max(...options.map(o => o.votes), 1);

        // Map options to X,Y coordinates
        // X: Option Index (spaced evenly)
        // Y: Vote count (normalized to height)
        const newPoints = options.map((opt, i) => {
            const x = (i / (options.length - 1 || 1)) * 100; // 0 to 100%
            const y = 100 - ((opt.votes / maxVotes) * 80);   // 20% to 100% (leave space at top)
            return { x, y, votes: opt.votes, label: opt.text };
        });

        setPoints(newPoints);

    }, [options, totalVotes]);

    // Generate SVG path for the area chart
    const getPath = () => {
        if (points.length < 2) return '';

        // Start from bottom-left
        let d = `M 0,100 `;

        // Curve through points
        points.forEach((p, i) => {
            // Simple line to point
            d += `L ${p.x},${p.y} `;
        });

        // Close shape to bottom-right
        d += `L 100,100 Z`;
        return d;
    };

    // Generate line only (for stroke)
    const getLine = () => {
        if (points.length < 2) return '';
        let d = `M ${points[0].x},${points[0].y} `;
        points.slice(1).forEach(p => {
            d += `L ${p.x},${p.y} `;
        });
        return d;
    };

    // Colors based on theme
    const getColors = () => {
        if (theme === 'theme-fire') return { stroke: '#EF4444', fill: 'rgba(239, 68, 68, 0.2)' };
        if (theme === 'theme-joy') return { stroke: '#EC4899', fill: 'rgba(236, 72, 153, 0.2)' };
        if (theme === 'theme-emerald') return { stroke: '#10B981', fill: 'rgba(16, 185, 129, 0.2)' };
        return { stroke: '#3B82F6', fill: 'rgba(59, 130, 246, 0.2)' };
    };

    const { stroke, fill } = getColors();

    return (
        <div className="ledger-container" style={{ position: 'relative', height: '160px', width: '100%', overflow: 'hidden', padding: '10px' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                LIVE MARKET VELOCITY
            </div>

            <svg
                ref={svgRef}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
                {/* Grid Lines */}
                <line x1="0" y1="25" x2="100" y2="25" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2" />
                <line x1="0" y1="75" x2="100" y2="75" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2" />

                {/* Area Fill */}
                <path
                    d={getPath()}
                    fill={fill}
                    style={{ transition: 'd 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                />

                {/* Stroke Line */}
                <path
                    d={getLine()}
                    fill="none"
                    stroke={stroke}
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                    style={{ transition: 'd 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                />

                {/* Points */}
                {points.map((p, i) => (
                    <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="3"
                        fill="#fff"
                        stroke={stroke}
                        strokeWidth="1.5"
                        vectorEffect="non-scaling-stroke"
                        style={{ transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    />
                ))}
            </svg>

            {/* Floating Labels (HTML overlay for better text rendering) */}
            {points.map((p, i) => (
                <div
                    key={i}
                    style={{
                        position: 'absolute',
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        transform: 'translate(-50%, -140%)',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        color: 'var(--text-main)',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        transition: 'top 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    {p.votes}
                </div>
            ))}
        </div>
    );
}
