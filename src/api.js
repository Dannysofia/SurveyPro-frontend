import axios from 'axios';

// ✅ Vue CLI: usa process.env.VUE_APP_API_URL
const baseURL = process.env.VUE_APP_API_URL || 'http://localhost:4000';

export const api = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
});

export function setAuthToken(token) {
    if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        localStorage.setItem('token', token);
    } else {
        delete api.defaults.headers.common.Authorization;
        localStorage.removeItem('token');
    }
}

const saved = localStorage.getItem('token');
if (saved) setAuthToken(saved);