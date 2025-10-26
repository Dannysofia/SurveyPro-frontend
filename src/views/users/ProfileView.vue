<template>
    <section>
        <!-- Encabezado -->
        <div class="list-header">
            <h1 style="margin:0;">Mi perfil</h1>
            <div style="display:flex;gap:8px;">
                <button class="btn btn-ghost" @click="goBack">Volver</button>
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

        <!-- Gráfico: Respuestas por día -->
        <div class="card">
            <div class="card-body">
                <h3 style="margin:0 0 6px;">Respuestas por día</h3>
                <div style="height:260px;">
                    <canvas ref="chartEl" style="width:100%;height:100%;"></canvas>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup>
import { onMounted, onBeforeUnmount, computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useProfileStore } from '@/store/profileStore';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/api';
import { Chart } from 'chart.js/auto';
import '@/assets/css/surveys.css';

const router = useRouter();
const profileStore = useProfileStore();
const auth = useAuthStore();

const loading = computed(() => profileStore.loading);
const error = computed(() => profileStore.error);
const profile = computed(() => profileStore.profile);

const chartEl = ref(null);
let chartInstance = null;

onMounted(async () => {
    await profileStore.fetchProfile().catch(() => { });

    const { from, to } = lastNDaysRange(30);
    const data = await fetchDailyResponses(from, to);
    renderChart(data.points);
});

onBeforeUnmount(() => {
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
});

function lastNDaysRange(n) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (n - 1));
    const iso = (d) => d.toISOString().slice(0, 10);
    return { from: iso(start), to: iso(end) };
}

async function fetchDailyResponses(from, to) {
    const { data } = await api.get('/stats/daily-responses', { params: { from, to } });
    return data;
}

function renderChart(points) {
    const ctx = chartEl.value?.getContext('2d');
    if (!ctx) return;

    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }

    const labels = points.map(p => p.date);
    const values = points.map(p => p.count);

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Respuestas',
                data: values
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { autoSkip: true, maxTicksLimit: 8 } },
                y: { beginAtZero: true, suggestedMax: Math.max(5, Math.max(...values) || 0) }
            }
        }
    });
}

function goBack() { 
    router.push({ name: 'survey-home' }); 
}

function goEdit() { 
    router.push({ name: 'profile-edit' }); 
}

function onLogout() { 
    auth.logout(); router.push({ name: 'login' }); 
}

function formatDate(iso) {
    if (!iso) return '';
    try { return new Date(iso).toLocaleString(); } catch { return '' }
}
</script>