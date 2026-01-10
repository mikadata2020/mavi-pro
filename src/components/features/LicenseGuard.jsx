import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle, AlertCircle, Key, ShieldCheck } from 'lucide-react';
import { getSupabase } from '../../utils/supabaseClient';

const LICENSE_STORAGE_KEY = 'mavi_app_license';
const SECRET_SALT = 'MAVI_ROCKS_2024';

const LicenseGuard = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [licenseKey, setLicenseKey] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);

    // Simple custom hash for validation (Client-side)
    const validateHash = (key) => {
        try {
            const parts = key.toUpperCase().trim().split('-');
            if (parts.length !== 4) return false;
            if (parts[0] !== 'MAVI') return false;

            const [prefix, part1, part2, checksum] = parts;
            const input = part1 + part2 + SECRET_SALT;
            let hash = 0;
            for (let i = 0; i < input.length; i++) {
                const char = input.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            const expectedChecksum = Math.abs(hash).toString(16).substring(0, 4).toUpperCase().padStart(4, '0');
            return checksum === expectedChecksum;
        } catch (e) {
            return false;
        }
    };

    const checkCloudLicense = async (key) => {
        try {
            const supabase = getSupabase();
            const { data, error } = await supabase
                .from('licenses')
                .select('*')
                .eq('key_string', key)
                .single();

            if (error) {
                // If table doesn't exist or not found, we act conservatively or fallback.
                console.warn('License verification warning:', error.message);
                if (error.code === 'PGRST116') return { valid: false, reason: 'License key not found in cloud database.' };
                // For other errors (network), we might optionally ALLOW identifying offline access, 
                // but for this task we enforce cloud verification as requested.
                return { valid: false, reason: 'Could not verify license with server.' };
            }

            if (!data) return { valid: false, reason: 'License key does not exist.' };
            if (data.status !== 'active') return { valid: false, reason: `License is ${data.status}.` };

            if (data.expires_at) {
                const now = new Date();
                const expiry = new Date(data.expires_at);
                if (now > expiry) return { valid: false, reason: 'License has expired.' };
            }

            return { valid: true };
        } catch (e) {
            console.error(e);
            return { valid: false, reason: 'Verification error: ' + e.message };
        }
    };

    const performValidation = async (key) => {
        // 1. Check Hash (Fast local check)
        if (!validateHash(key)) return { valid: false, reason: 'Invalid license format.' };

        // 2. Check Cloud (Async)
        return await checkCloudLicense(key);
    };

    useEffect(() => {
        const checkStoredLicense = async () => {
            const storedKey = localStorage.getItem(LICENSE_STORAGE_KEY);
            if (storedKey) {
                if (validateHash(storedKey)) {
                    // Optimistically set true for UI speed, but verify in background?
                    // No, for security we must verify.
                    const result = await checkCloudLicense(storedKey);
                    if (result.valid) {
                        setIsAuthenticated(true);
                    } else {
                        console.log('Stored license invalid:', result.reason);
                        localStorage.removeItem(LICENSE_STORAGE_KEY);
                    }
                } else {
                    localStorage.removeItem(LICENSE_STORAGE_KEY);
                }
            }
            setLoading(false);
        };
        checkStoredLicense();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setVerifying(true);

        const result = await performValidation(licenseKey);

        if (result.valid) {
            localStorage.setItem(LICENSE_STORAGE_KEY, licenseKey);
            setIsAuthenticated(true);
        } else {
            setError(result.reason || 'License validation failed.');
        }
        setVerifying(false);
    };

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#fff' }}>
            Initializing Security...
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
                    <p style={{ color: '#888', margin: 0 }}>
                        {verifying ? 'Connecting to license server...' : 'Enter your cloud license key to continue.'}
                    </p>
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
                                    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                    if (val.length > 4) val = val.slice(0, 4) + '-' + val.slice(4);
                                    if (val.length > 9) val = val.slice(0, 9) + '-' + val.slice(9);
                                    if (val.length > 14) val = val.slice(0, 14) + '-' + val.slice(14);
                                    if (val.length > 19) val = val.slice(0, 19);
                                    setLicenseKey(val);
                                    setError('');
                                }}
                                placeholder="MAVI-XXXX-XXXX-XXXX"
                                disabled={verifying}
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
                                    transition: 'all 0.2s',
                                    opacity: verifying ? 0.5 : 1
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
                        disabled={licenseKey.length < 19 || verifying}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: licenseKey.length >= 19 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#333',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: (licenseKey.length >= 19 && !verifying) ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s',
                            opacity: (licenseKey.length >= 19 && !verifying) ? 1 : 0.7
                        }}
                    >
                        {verifying ? 'Verifying...' : 'Activate Application'}
                    </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.8rem', color: '#555' }}>
                    <div style={{ marginBottom: '5px' }}>Requires Internet Connection</div>
                    Don't have a key? Contact support@maviai.com
                </div>
            </div>
        </div>
    );
};

export default LicenseGuard;
