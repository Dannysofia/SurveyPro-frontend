import axios from 'axios';

const baseURL = process.env.VUE_APP_API_URL || 'http://localhost:4000';

export const api = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
});

export function setAuthToken(token) {
    if (token) {
        api.defaults.headers.common.Authorization = "Bearer " + token;
    } else {
        delete api.defaults.headers.common.Authorization;
    }
}

const saved = localStorage.getItem('token');
if (saved) setAuthToken(saved);