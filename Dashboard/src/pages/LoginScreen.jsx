import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Shield } from 'lucide-react';
import { loginUser } from '../services/api';

const LoginScreen = ({ setToken, setUserRole, setUsername }) => {
    const [loginUserVal, setLoginUser] = useState("");
    const [loginPass, setLoginPass] = useState("");
    const [loginError, setLoginError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLoginError("");

        try {
            const data = await loginUser(loginUserVal, loginPass);
            localStorage.setItem('token', data.access_token);
            if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('username', data.username);

            setToken(data.access_token);
            setUserRole(data.role);
            setUsername(data.username);
        } catch (err) {
            setLoginError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden" style={{ background: 'var(--hsn-bg)', color: 'var(--hsn-text)' }}>
            <div className="hsn-grid-bg absolute inset-0 pointer-events-none" aria-hidden="true"></div>
            <div className="relative w-full max-w-sm">
                <div className="flex items-center gap-3 mb-8 justify-center">
                    <div className="flex items-center justify-center w-11 h-11 rounded-xl" style={{ background: 'var(--hsn-accent-weak)' }}>
                        <Shield className="w-6 h-6" style={{ color: 'var(--hsn-accent)' }} />
                    </div>
                    <div className="leading-tight text-left">
                        <div className="text-lg font-semibold tracking-tight">HardSecNet</div>
                        <div className="text-xs" style={{ color: 'var(--hsn-text-muted)' }}>Security command center</div>
                    </div>
                </div>

                <div className="hsn-card p-7">
                    <h1 className="text-base font-medium mb-1">Sign in to your console</h1>
                    <p className="text-xs mb-6" style={{ color: 'var(--hsn-text-muted)' }}>Enter your operator credentials to continue.</p>

                    {loginError && (
                        <div className="text-sm mb-4 px-3 py-2 rounded-lg flex items-center gap-2" style={{ color: 'var(--hsn-danger)', background: 'var(--hsn-danger-weak)' }}>
                            {loginError}
                        </div>
                    )}
                    <form onSubmit={handleLogin} className="space-y-3">
                        <div>
                            <label className="block text-xs mb-1.5" style={{ color: 'var(--hsn-text-muted)' }}>Username</label>
                            <input
                                type="text"
                                placeholder="admin"
                                className="hsn-input w-full px-3.5 py-2.5 text-sm"
                                value={loginUserVal}
                                onChange={e => setLoginUser(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs mb-1.5" style={{ color: 'var(--hsn-text-muted)' }}>Password</label>
                            <input
                                type="password"
                                placeholder="••••••••••"
                                className="hsn-input w-full px-3.5 py-2.5 text-sm"
                                value={loginPass}
                                onChange={e => setLoginPass(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="hsn-btn-primary w-full py-2.5 text-sm mt-2 disabled:opacity-50"
                        >
                            {loading ? 'Authenticating…' : 'Sign in'}
                        </button>
                    </form>
                </div>

                <div className="flex items-center justify-center gap-2 mt-5 text-xs" style={{ color: 'var(--hsn-text-dim)' }}>
                    <span className="hsn-dot" style={{ background: 'var(--hsn-ok)' }}></span>
                    Encrypted session · mTLS enforced for agents
                </div>
            </div>
        </div>
    );
};

LoginScreen.propTypes = {
    setToken: PropTypes.func.isRequired,
    setUserRole: PropTypes.func.isRequired,
    setUsername: PropTypes.func.isRequired
};

export default LoginScreen;
