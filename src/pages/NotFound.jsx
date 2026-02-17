import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div className="app-container" style={{ textAlign: 'center', marginTop: '10%' }}>
            <h1 style={{ fontSize: '5rem', marginBottom: '0rem', color: '#EF4444', lineHeight: 1 }}>404</h1>
            <p style={{ marginTop: '0.5rem', marginBottom: '2rem', color: '#EF4444', letterSpacing: '2px', fontWeight: 'bold' }}>
                SYSTEM ERROR: RESOURCE NOT FOUND
            </p>
            <div style={{ maxWidth: '400px', margin: '0 auto', color: 'var(--text-muted)' }}>
                The requested URL path does not map to any active polling resource.
                Please verify the link integrity or return to the main dashboard.
            </div>
            <div style={{ marginTop: '3rem' }}>
                <Link to="/" className="btn btn-ghost">
                    Return to Dashboard
                </Link>
            </div>
        </div>
    );
}
