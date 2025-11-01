import { defineStore } from 'pinia';
import { api, setAuthToken } from '@/api';
import { useSurveys } from './surveysStore';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        token: localStorage.getItem('token') || null,
        loading: false,
        error: null,
    }),

    actions: {
        async register({ nombre, apellido, correo, password }) {
            try {
                this.loading = true;
                this.error = null;
                const { data } = await api.post('/usuarios', { nombre, apellido, correo, password });
                return data.user;
            } catch (e) {
                this.error = e?.response?.data?.error || 'Error al registrar';
                throw e;
            } finally {
                this.loading = false;
            }
        },

        async login({ correo, password }) {
            try {
                this.loading = true;
                this.error = null;
                const { data } = await api.post('/auth/login', { correo, email: correo, password });
                this.user = data.user;
                this.token = data.token;
                localStorage.setItem('token', data.token);
                setAuthToken(data.token);
                return data.user;
            } catch (e) {
                this.error = e?.response?.data?.error || 'Credenciales inválidas';
                throw e;
            } finally {
                this.loading = false;
            }
        },

        logout() {
            this.user = null;
            this.token = null;
            setAuthToken(null);
            localStorage.removeItem('token');
            const surveysStore = useSurveys();
            surveysStore.reset();
        },
    },
});