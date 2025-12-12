import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function Login({ onLoginSuccess, onBack }) {
    const { signIn, signUp } = useAuth();

    // UI State
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await signUp(email, password);
                if (error) throw error;
                setMessage('Account created! Please check your email for verification.');
                // Optionally switch to sign in mode
                // setIsSignUp(false);
            } else {
                const { error } = await signIn(email, password);
                if (error) throw error;
                // onLoginSuccess handled by AuthContext listener in App.jsx
            }
        } catch (err) {
            setError(err.message || 'An error occurred during authentication');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#0a0a0a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <div style={{
                backgroundColor: '#1a1a1a',
                padding: '40px',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                border: '1px solid #333',
                minWidth: '400px',
                maxWidth: '500px'
            }}>
                {/* Logo/Title */}
                <div style={{ textAlign: 'center', marginBottom: '30px', position: 'relative' }}>
                    {onBack && (
                        <button
                            onClick={onBack}
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: '#666',
                                cursor: 'pointer',
                                fontSize: '1.2rem',
                                padding: '5px'
                            }}
                            title="Back to Home"
                        >
                            ←
                        </button>
                    )}
                    <h1 style={{
                        color: 'var(--accent-blue)',
                        margin: '0 0 10px 0',
                        fontSize: '2rem',
                        fontWeight: 'bold'
                    }}>
                        Mavi
                    </h1>
                    <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>
                        {isSignUp ? 'Create a new account' : 'Sign in to continue'}
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                    {/* Email Field */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: '#ccc',
                            fontSize: '0.9rem',
                            fontWeight: '500'
                        }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            autoFocus
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#222',
                                border: '1px solid #444',
                                borderRadius: '6px',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--accent-blue)'}
                            onBlur={(e) => e.target.style.borderColor = '#444'}
                        />
                    </div>

                    {/* Password Field */}
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: '#ccc',
                            fontSize: '0.9rem',
                            fontWeight: '500'
                        }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    paddingRight: '45px',
                                    backgroundColor: '#222',
                                    border: '1px solid #444',
                                    borderRadius: '6px',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--accent-blue)'}
                                onBlur={(e) => e.target.style.borderColor = '#444'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#888',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem',
                                    padding: '5px'
                                }}
                                title={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    {/* Feedback Messages */}
                    {error && (
                        <div style={{
                            padding: '12px',
                            backgroundColor: 'rgba(197, 15, 31, 0.2)',
                            border: '1px solid #c50f1f',
                            borderRadius: '6px',
                            color: '#ff6b6b',
                            marginBottom: '20px',
                            fontSize: '0.9rem',
                            textAlign: 'center'
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    {message && (
                        <div style={{
                            padding: '12px',
                            backgroundColor: 'rgba(50, 205, 50, 0.15)',
                            border: '1px solid #32cd32',
                            borderRadius: '6px',
                            color: '#32cd32',
                            marginBottom: '20px',
                            fontSize: '0.9rem',
                            textAlign: 'center'
                        }}>
                            ✅ {message}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '14px',
                            backgroundColor: loading ? '#444' : 'var(--accent-blue)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: loading ? 'none' : '0 4px 12px rgba(74, 158, 255, 0.3)',
                            opacity: loading ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.target.style.backgroundColor = '#3a8aff';
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 16px rgba(74, 158, 255, 0.4)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading) {
                                e.target.style.backgroundColor = 'var(--accent-blue)';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 12px rgba(74, 158, 255, 0.3)';
                            }
                        }}
                    >
                        {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                    </button>
                </form>

                {/* Toggle Mode */}
                <div style={{
                    marginTop: '20px',
                    textAlign: 'center',
                    borderTop: '1px solid #333',
                    paddingTop: '20px'
                }}>
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError('');
                            setMessage('');
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-blue)',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            textDecoration: 'underline'
                        }}
                    >
                        {isSignUp
                            ? 'Already have an account? Sign In'
                            : 'Don\'t have an account? Sign Up'}
                    </button>
                </div>

                {/* Footer Info */}
                <div style={{
                    marginTop: '25px',
                    textAlign: 'center',
                    color: '#666',
                    fontSize: '0.75rem'
                }}>
                    © 2025 Motion Analysis System
                </div>
            </div>
        </div>
    );
}

export default Login;
