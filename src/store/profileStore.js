// src/store/profileStore.js
import { defineStore } from 'pinia';
import { api } from '@/api';

export const useProfileStore = defineStore('profile', {
    state: () => ({
        profile: null,
        loading: false,
        error: null,
    }),

    actions: {
        async fetchProfile() {
            try {
                this.loading = true;
                this.error = null;
                const { data } = await api.get('/profile');
                this.profile = data?.user || null;
                return this.profile;
            } catch (e) {
                this.error = e?.response?.data?.error || 'No se pudo cargar el perfil';
                throw e;
            } finally {
                this.loading = false;
            }
        },

        async updateProfile({ name, last_name, email }) {
            try {
                this.loading = true;
                this.error = null;
                const { data } = await api.put('/profile', { name, last_name, email });
                this.profile = data?.user || this.profile;
                return this.profile;
            } catch (e) {
                this.error = e?.response?.data?.error || 'No se pudo actualizar el perfil';
                throw e;
            } finally {
                this.loading = false;
            }
        },
    },
});