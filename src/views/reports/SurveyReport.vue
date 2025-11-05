<template>
  <section>
    <div class="breadcrumbs">
      <span class="breadcrumb-item" @click="$router.push('/inicio')">Inicio</span>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-item" @click="$router.push('/encuestas')">Encuestas</span>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-item">Estadísticas</span>
    </div>

    <div class="list-header">
      <h1 class="title">Estadísticas: {{ survey?.title || '' }}</h1>
      <div class="row-wrap">
        <div class="export">
          <button class="btn btn-primary" @click="toggleExport">Exportar</button>
          <div v-if="showExport" class="export-menu">
            <button class="menu-item" @click="onExportPdf">PDF</button>
          </div>
        </div>
        <button class="btn btn-ghost" @click="goBack">Volver</button>
      </div>
    </div>

    <!-- Resumen -->
    <div ref="reportEl">
    <div class="card" style="margin-bottom:12px;">
      <div class="card-body" style="display:flex;gap:12px;flex-wrap:wrap;">
        <SurveySummaryStat title="Total de respuestas" :value="summary.totalResponses" />
        <SurveySummaryStat title="Total de preguntas" :value="summary.questionCount" />
      </div>
    </div>

    <div v-for="q in survey?.questions || []" :key="q.id" class="card" style="margin-bottom:12px;">
      <div class="card-body">
        <h3 style="margin:0 0 8px;">{{ q.text }}</h3>
        <div v-if="stats[q.id]?.type === 'open'">
          <table class="table">
            <thead><tr><th>Respuesta</th><th style="width:220px;">Fecha</th></tr></thead>
            <tbody>
              <tr v-for="row in stats[q.id].rows" :key="row.responseId + '_' + row.submittedAt">
                <td>{{ row.value }}</td>
                <td>{{ formatDate(row.submittedAt) }}</td>
              </tr>
              <tr v-if="stats[q.id].rows.length === 0"><td colspan="2" class="muted">Sin respuestas</td></tr>
            </tbody>
          </table>
        </div>

        <div v-else-if="stats[q.id]?.type === 'single'">
          <div class="grid" style="grid-template-columns: 380px 1fr; gap: 16px;">
            <div style="min-height:260px;">
              <PieChart :labels="stats[q.id].chart.labels" :values="stats[q.id].chart.values" />
            </div>
            <div>
              <table class="table">
                <thead><tr><th>Opción</th><th>%</th><th>Cantidad</th></tr></thead>
                <tbody>
                  <tr v-for="row in stats[q.id].table" :key="q.id + '_' + row.optionId">
                    <td>{{ row.value }}</td>
                    <td>{{ row.percentage.toFixed(1) }}%</td>
                    <td>{{ row.count }}</td>
                  </tr>
                  <tr v-if="stats[q.id].table.every(r => r.count === 0)"><td colspan="3" class="muted">Sin respuestas</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div v-else-if="stats[q.id]?.type === 'multiple'">
          <div class="grid" style="grid-template-columns: 1fr; gap: 16px;">
            <div style="min-height:260px;">
              <BarChart :labels="stats[q.id].chart.labels" :values="stats[q.id].chart.values" />
            </div>
            <div>
              <table class="table">
                <thead><tr><th>Opción</th><th>%</th><th>Cantidad</th></tr></thead>
                <tbody>
                  <tr v-for="row in stats[q.id].table" :key="q.id + '_' + row.optionId">
                    <td>{{ row.value }}</td>
                    <td>{{ row.percentage.toFixed(1) }}%</td>
                    <td>{{ row.count }}</td>
                  </tr>
                  <tr v-if="stats[q.id].table.every(r => r.count === 0)"><td colspan="3" class="muted">Sin respuestas</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSurveys } from '@/store/surveysStore';
import { useResponses } from '@/store/responsesStore';
import SurveySummaryStat from '@/components/SurveySummaryStat.vue';
import PieChart from '@/components/charts/PieChart.vue';
import BarChart from '@/components/charts/BarChart.vue';
import { computeGlobalSummary, buildQuestionStats } from '@/services/reportUtils';
import { exportElementToPdf } from '@/utils/exportPdf';
import '@/assets/css/surveys.css';
import '@/assets/css/breadcrumbs.css';

const route = useRoute();
const router = useRouter();
const { getByIdAsync, getById } = useSurveys();
const { loadList, listResponses } = useResponses();

const surveyId = computed(() => route.params.id);
const survey = ref(null);
const summary = ref({ totalResponses: 0, expected: null, responseRate: null });
const stats = ref({});
const reportEl = ref(null);
const showExport = ref(false);

onMounted(async () => {
  await ensureLoaded();
});

watch(surveyId, async () => { await ensureLoaded(); });

async function ensureLoaded() {
  if (!surveyId.value) return;
  survey.value = await getByIdAsync(surveyId.value).catch(() => getById(surveyId.value));
  await loadList(surveyId.value).catch(() => {});
  const responses = listResponses(surveyId.value) || [];
  summary.value = computeGlobalSummary(survey.value, responses);
  stats.value = buildQuestionStats(survey.value, responses);
}

function goBack() { router.push({ name: 'surveys' }); }
function formatDate(iso) { try { return new Date(iso).toLocaleString(); } catch { return '' } }
function toggleExport(){ showExport.value = !showExport.value; }
function sanitize(str){ return String(str || 'reporte').replace(/[^\w\-\u00C0-\u024F ]+/g,'').replace(/\s+/g,'_'); }
async function onExportPdf(){
  try {
    showExport.value = false;
    const name = `estadisticas_${sanitize(survey.value?.title)}.pdf`;
    await exportElementToPdf(reportEl.value, { filename: name });
  } catch (e) {
    alert(String(e.message || e));
  }
}
</script>

<style scoped>
.table {
  width: 100%;
  border-collapse: collapse;
}
.table th, .table td {
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
  padding: 8px 6px;
}
.table th { background: #f8fafc; }

.export { position: relative; }
.export-menu {
  position: absolute;
  right: 0;
  top: 40px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  min-width: 140px;
  box-shadow: 0 12px 24px rgba(2,6,23,0.12);
  z-index: 20;
}
.menu-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  background: #fff;
  border: none;
  cursor: pointer;
}
.menu-item:hover { background: #f8fafc; }
</style>
