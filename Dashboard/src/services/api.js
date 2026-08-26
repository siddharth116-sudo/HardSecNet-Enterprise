import { API_BASE_URL } from '../constants/config';

/**
 * Perform authenticated API calls.
 * @param {string} endpoint - API Endpoint (e.g. '/api/nodes')
 * @param {string} token - JWT Access Token
 * @param {Object} options - Fetch options (method, body, etc)
 * @returns {Promise<any>} JSON response
 */
/**
 * Exchange the stored refresh token for a fresh access token.
 * Returns the new access token, or null if refresh is not possible.
 */
const refreshAccessToken = async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) return null;
    try {
        const res = await fetch(`${API_BASE_URL}/api/refresh`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${refresh}` }
        });
        if (!res.ok) return null;
        const body = await res.json();
        if (body.access_token) {
            localStorage.setItem('token', body.access_token);
            if (body.role) localStorage.setItem('role', body.role);
            return body.access_token;
        }
    } catch (e) { /* fall through to null */ }
    return null;
};

export const authFetch = async (endpoint, token, options = {}, _retried = false) => {
    // localStorage is the source of truth so a refreshed token is picked up immediately.
    const current = localStorage.getItem('token') || token;
    const headers = { ...(options.headers || {}), 'Authorization': `Bearer ${current}` };

    const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

    if (res.status === 401) {
        // Access token likely expired — try a one-time silent refresh, then retry.
        if (!_retried) {
            const newToken = await refreshAccessToken();
            if (newToken) return authFetch(endpoint, newToken, options, true);
        }
        throw new Error('Unauthorized');
    }

    if (!res.ok) {
        // Try to parse error message if JSON
        try {
            const body = await res.json();
            throw new Error(body.message || body.error || 'Request Failed');
        } catch (e) {
            throw new Error(res.statusText || 'Request Failed');
        }
    }

    return res.json();
};

export const loginUser = async (username, password) => {
    const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const body = await res.json();
    if (!res.ok) throw new Error(body.msg || "Login Failed");
    return body;
};
