import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle, AlertCircle, Key, ShieldCheck, Mail, Send } from 'lucide-react';
import { getSupabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { validateKeyFormat } from '../../utils/licenseUtils';

const LICENSE_STORAGE_KEY = 'mavi_app_license';

const LicenseGuard = ({ children }) => {
    const { user } = useAuth();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [licenseKey, setLicenseKey] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);

    // License Request States
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [requestSubmitted, setRequestSubmitted] = useState(false);
    const [requestError, setRequestError] = useState('');
    const [submittingRequest, setSubmittingRequest] = useState(false);

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
        if (!validateKeyFormat(key)) return { valid: false, reason: 'Invalid license format.' };

        // 2. Check Cloud (Async)
        return await checkCloudLicense(key);
    };

    useEffect(() => {
        const checkStoredLicense = async () => {
            const storedKey = localStorage.getItem(LICENSE_STORAGE_KEY);
            if (storedKey) {
                if (validateKeyFormat(storedKey)) {
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

    const handleRequestLicense = async () => {
        if (!user) {
            setRequestError('You must be logged in to request a license.');
            return;
        }

        setSubmittingRequest(true);
        setRequestError('');

        try {
            const supabase = getSupabase();

            // Check if user already has a pending request
            const { data: existingRequest, error: checkError } = await supabase
                .from('license_requests')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'pending')
                .single();

            if (existingRequest) {
                setRequestError('You already have a pending license request.');
                setSubmittingRequest(false);
                return;
            }

            // Insert new license request
            const { error: insertError } = await supabase
                .from('license_requests')
                .insert({
                    user_id: user.id,
                    email: user.email,
                    status: 'pending',
                    created_at: new Date().toISOString()
                });

            if (insertError) throw insertError;

            setRequestSubmitted(true);
            setShowRequestForm(false);
        } catch (err) {
            console.error('Error submitting license request:', err);
            setRequestError(err.message || 'Failed to submit license request. Please try again.');
        } finally {
            setSubmittingRequest(false);
        }
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
                    {requestSubmitted ? (
                        <div style={{
                            padding: '16px',
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                            border: '1px solid rgba(76, 175, 80, 0.3)',
                            borderRadius: '12px',
                            color: '#4CAF50',
                            marginBottom: '16px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                                <CheckCircle size={20} />
                                <strong>Request Submitted!</strong>
                            </div>
                            <div style={{ fontSize: '0.85rem' }}>
                                Your license request has been sent to the admin. You will receive your license key via email once approved.
                            </div>
                        </div>
                    ) : showRequestForm ? (
                        <div style={{
                            padding: '20px',
                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            marginBottom: '16px'
                        }}>
                            <h3 style={{ color: '#fff', margin: '0 0 16px 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Mail size={20} />
                                Request License Key
                            </h3>
                            <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '16px' }}>
                                Your request will be sent to the admin for approval.
                            </p>
                            {user && (
                                <div style={{
                                    padding: '12px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                    borderRadius: '8px',
                                    marginBottom: '16px',
                                    textAlign: 'left'
                                }}>
                                    <div style={{ color: '#888', fontSize: '0.75rem', marginBottom: '4px' }}>Account Email</div>
                                    <div style={{ color: '#fff', fontSize: '0.9rem', fontFamily: 'monospace' }}>{user.email}</div>
                                </div>
                            )}
                            {requestError && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    color: '#ff4444',
                                    fontSize: '0.85rem',
                                    marginBottom: '12px',
                                    padding: '8px',
                                    backgroundColor: 'rgba(255, 68, 68, 0.1)',
                                    borderRadius: '6px'
                                }}>
                                    <AlertCircle size={14} />
                                    {requestError}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={handleRequestLicense}
                                    disabled={submittingRequest || !user}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: submittingRequest ? '#444' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                        cursor: submittingRequest || !user ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        opacity: submittingRequest || !user ? 0.6 : 1
                                    }}
                                >
                                    <Send size={16} />
                                    {submittingRequest ? 'Sending...' : 'Send Request'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowRequestForm(false);
                                        setRequestError('');
                                    }}
                                    disabled={submittingRequest}
                                    style={{
                                        padding: '12px 20px',
                                        background: 'transparent',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '8px',
                                        color: '#aaa',
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                        cursor: submittingRequest ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={{ marginBottom: '5px' }}>Requires Internet Connection</div>
                            <div style={{ marginBottom: '16px' }}>
                                Don't have a key?{' '}
                                <button
                                    onClick={() => setShowRequestForm(true)}
                                    disabled={!user}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: user ? '#667eea' : '#555',
                                        textDecoration: 'underline',
                                        cursor: user ? 'pointer' : 'not-allowed',
                                        fontSize: '0.8rem',
                                        padding: 0
                                    }}
                                    title={!user ? 'Please log in first to request a license' : 'Request a license key from admin'}
                                >
                                    Request License
                                </button>
                            </div>
                            {!user && (
                                <div style={{
                                    padding: '12px',
                                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                                    border: '1px solid rgba(255, 193, 7, 0.3)',
                                    borderRadius: '8px',
                                    color: '#FFC107',
                                    fontSize: '0.75rem'
                                }}>
                                    ⚠️ Please log in to your account to request a license key
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LicenseGuard;
