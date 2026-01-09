import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle, AlertCircle, Key, ShieldCheck } from 'lucide-react';

const LICENSE_STORAGE_KEY = 'mavi_app_license';
const SECRET_SALT = 'MAVI_ROCKS_2024';

const LicenseGuard = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [licenseKey, setLicenseKey] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    // Simple custom hash for validation (Client-side)
    // Format: MAVI-XXXX-YYYY-ZZZZ
    // ZZZZ is hash(XXXX + YYYY + SALT)
    const validateLicense = (key) => {
        try {
            const parts = key.toUpperCase().trim().split('-');
            if (parts.length !== 4) return false;
            if (parts[0] !== 'MAVI') return false;

            const [prefix, part1, part2, checksum] = parts;

            // Validate checksum
            const input = part1 + part2 + SECRET_SALT;
            let hash = 0;
            for (let i = 0; i < input.length; i++) {
                const char = input.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }

            // Convert hash to 4 char hex string for comparison (normalized)
            const expectedChecksum = Math.abs(hash).toString(16).substring(0, 4).toUpperCase().padStart(4, '0');

            return checksum === expectedChecksum;
        } catch (e) {
            return false;
        }
    };

    useEffect(() => {
        // Check stored license
        const storedKey = localStorage.getItem(LICENSE_STORAGE_KEY);
        if (storedKey && validateLicense(storedKey)) {
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (validateLicense(licenseKey)) {
            localStorage.setItem(LICENSE_STORAGE_KEY, licenseKey);
            setIsAuthenticated(true);
        } else {
            setError('License key is invalid. Please check and try again.');
        }
    };

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#fff' }}>
            Checking License...
        </div>
    );

    if (isAuthenticated) {
        return children;
    }

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            background: 'radial-gradient(circle at center, #1a1a2e 0%, #000000 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                padding: '40px',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                width: '100%',
                maxWidth: '450px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px auto',
                        boxShadow: '0 10px 25px -5px rgba(118, 75, 162, 0.4)'
                    }}>
                        <ShieldCheck size={32} color="#fff" />
                    </div>
                    <h1 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '1.8rem' }}>Activation Required</h1>
                    <p style={{ color: '#888', margin: 0 }}>Please enter your product license key to continue.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', color: '#aaa', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '500' }}>License Key</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>
                                <Key size={18} />
                            </div>
                            <input
                                type="text"
                                value={licenseKey}
                                onChange={(e) => {
                                    // Auto-format for better UX: upper case, add dashes
                                    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                    if (val.length > 4) val = val.slice(0, 4) + '-' + val.slice(4);
                                    if (val.length > 9) val = val.slice(0, 9) + '-' + val.slice(9);
                                    if (val.length > 14) val = val.slice(0, 14) + '-' + val.slice(14);
                                    if (val.length > 19) val = val.slice(0, 19); // Max length
                                    setLicenseKey(val);
                                    setError('');
                                }}
                                placeholder="MAVI-XXXX-XXXX-XXXX"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px 12px 42px',
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    border: `1px solid ${error ? '#ff4444' : 'rgba(255, 255, 255, 0.1)'}`,
                                    borderRadius: '12px',
                                    color: '#fff',
                                    fontSize: '1rem',
                                    fontFamily: 'monospace',
                                    letterSpacing: '1px',
                                    outline: 'none',
                                    transition: 'all 0.2s'
                                }}
                            />
                        </div>
                        {error && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff4444', fontSize: '0.85rem', marginTop: '8px' }}>
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={licenseKey.length < 19}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: licenseKey.length >= 19 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#333',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: licenseKey.length >= 19 ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s',
                            opacity: licenseKey.length >= 19 ? 1 : 0.7
                        }}
                    >
                        Activate Application
                    </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.8rem', color: '#555' }}>
                    Don't have a key? Contact support@maviai.com
                </div>
            </div>
        </div>
    );
};

export default LicenseGuard;
