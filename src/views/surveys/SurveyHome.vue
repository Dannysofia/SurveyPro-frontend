<template>
    <section>
        <!-- fila superior: botón Perfil (sin función por ahora) -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <button class="btn btn-ghost" @click="onProfile">Perfil</button>
        </div>

        <!-- Bienvenida -->
        <div class="card" style="margin-bottom:12px;">
            <div class="card-body">
                <h1 style="margin:0;">Bienvenido a SurveyPro</h1>
                <p class="muted" style="margin-top:6px;">Aquí verás tus estadísticas y tus encuestas recientes.</p>
            </div>
        </div>

        <!-- Resumen -->
        <div class="card" style="margin-bottom:12px;">
            <div class="card-body">
                <h3 style="margin:0 0 8px;">Resumen</h3>
                <div style="display:flex;gap:12px;flex-wrap:wrap;">
                    <SurveySummaryStat title="Total de encuestas" :value="summary.total_surveys" />
                    <SurveySummaryStat title="Total de respuestas" :value="summary.total_responses" />
                </div>
            </div>
        </div>

        <!-- Encabezado de “Recientes” -->
        <div class="list-header">
            <h2 style="margin:0;">Encuestas recientes</h2>

            <!-- Si hay al menos una encuesta, el botón aparece aquí -->
            <button v-if="items.length > 0" class="btn btn-primary" @click="goToList">
                Crear encuesta
            </button>
        </div>

        <!-- Si NO hay encuestas, mostramos un bloque con el botón primero -->
        <div v-if="items.length === 0" class="card">
            <div class="card-body">
                <p class="muted">Aún no tienes encuestas.</p>
                <button class="btn btn-primary" @click="goToList">Crear encuesta</button>
            </div>
        </div>

        <!-- Grid de cards -->
        <div v-else class="grid">
            <SurveyCard v-for="s in items" :key="s.survey_id" :survey="s" />
        </div>

        <p v-if="error" class="error" style="margin-top:8px;">{{ error }}</p>
    </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { fetchRecentSurveys, fetchHomeSummary } from '@/store/surveysView.js';
import SurveySummaryStat from '@/components/SurveySummaryStat.vue';
import SurveyCard from '@/components/SurveyCard.vue';
import '@/assets/css/surveys.css';

const router = useRouter();

const items = ref([]);
const summary = ref({ total_surveys: 0, total_responses: 0 });
const error = ref('');
const loading = ref(false);

onMounted(loadData);

async function loadData() {
    try {
        loading.value = true;
        error.value = '';
        const [recent, stats] = await Promise.all([
            fetchRecentSurveys(5),
            fetchHomeSummary(),
        ]);
        items.value = recent;
        summary.value = stats;
    } catch (e) {
        error.value = 'No se pudo cargar la información';
        console.error(e);
    } finally {
        loading.value = false;
    }
}

function goToList() {
    router.push({ name: 'surveys' });
}

function onProfile() {
    alert('Perfil (pendiente)');
}
</script>