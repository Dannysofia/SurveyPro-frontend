<template>
    <section>
        <!-- Encabezado -->
        <div class="list-header">
            <h1 style="margin:0;">Mi perfil</h1>
            <div style="display:flex;gap:8px;">
                <button class="btn btn-ghost" @click="goEdit">Editar perfil</button>
                <button class="btn btn-danger" @click="onLogout">Cerrar sesión</button>
            </div>
        </div>

        <!-- Card de datos del perfil -->
        <div class="card" style="margin-bottom:12px;">
            <div class="card-body">
                <div v-if="loading">Cargando…</div>
                <div v-else>
                    <div class="stack">
                        <div>
                            <div class="section-title">Nombre</div>
                            <p class="muted" style="margin:0;">{{ profile?.name || '—' }}</p>
                        </div>
                        <div>
                            <div class="section-title">Apellido</div>
                            <p class="muted" style="margin:0;">{{ profile?.last_name ?? '—' }}</p>
                        </div>
                        <div>
                            <div class="section-title">Correo</div>
                            <p class="muted" style="margin:0;">{{ profile?.email || '—' }}</p>
                        </div>
                        <div>
                            <div class="section-title">Miembro desde</div>
                            <p class="subtle" style="margin:0;">{{ formatDate(profile?.created_at) }}</p>
                        </div>
                    </div>

                    <p v-if="error" class="error" style="margin-top:8px;">{{ error }}</p>
                </div>
            </div>
        </div>

        <!-- Placeholder del gráfico -->
        <div class="card">
            <div class="card-body">
                <h3 style="margin:0 0 6px;">Respuestas por día</h3>
                <div
                    style="height:260px;border:1px dashed #ccc;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                    <span class="muted">Gráfico de respuestas por día (próximamente)</span>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useProfileStore } from '@/store/profileStore';
import { useAuthStore } from '@/store/authStore';
import '@/assets/css/surveys.css';

const router = useRouter();
const profileStore = useProfileStore();
const auth = useAuthStore();

const loading = computed(() => profileStore.loading);
const error = computed(() => profileStore.error);
const profile = computed(() => profileStore.profile);

onMounted(() => {
    profileStore.fetchProfile().catch(() => { });
});

function goEdit() {
    router.push({ name: 'profile-edit' });
}

function onLogout() {
    auth.logout();
    router.push({ name: 'login' });
}

function formatDate(iso) {
    if (!iso) return '';
    try { return new Date(iso).toLocaleString(); } catch { return '' }
}
</script>