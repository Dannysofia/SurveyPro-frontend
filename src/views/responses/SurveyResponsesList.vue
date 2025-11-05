<template>
  <section>
    <nav class="breadcrumb">
      <router-link :to="{ name: 'survey-home' }">Inicio</router-link>
      <span class="breadcrumb-sep">/</span>
      <router-link to="/encuestas">Encuestas</router-link>
    </nav>
    <header class="list-header">
      <h1>Respuestas: {{ survey?.title || 'Encuesta' }}</h1>
      <div class="row-wrap">
        <span v-if="survey" class="step" :class="{ active: survey.active }">{{ survey.active ? 'Activa' : 'Cerrada' }}</span>
        <button class="btn btn-ghost" @click="goBack">Volver</button>
        <button class="btn btn-primary" @click="goAnswer" :disabled="!survey?.active">Responder</button>
      </div>
    </header>

    <div v-if="!survey" class="empty">
      <p>No se encontró la encuesta.</p>
      <button class="btn btn-ghost" @click="goBack">Regresar</button>
    </div>

    <div v-else>
      <div class="card">
        <div class="between">
          <strong>Total respuestas: {{ all.length }}</strong>
          <div class="row-wrap" style="gap:6px;">
            <button class="btn btn-ghost" @click="prevPage" :disabled="page===1">Anterior</button>
            <span>Página {{ page }} / {{ totalPages }}</span>
            <button class="btn btn-ghost" @click="nextPage" :disabled="page===totalPages">Siguiente</button>
          </div>
        </div>
      </div>

      <div v-if="pageItems.length === 0" class="empty">
        <p>Aún no hay respuestas.</p>
      </div>
      <div v-else class="grid">
        <article v-for="r in pageItems" :key="r.id" class="card">
          <div class="card-body">
            <div class="between">
              <div>
                <div><strong>ID:</strong> {{ r.id }}</div>
                <div class="subtle">{{ formatDate(r.submittedAt) }}</div>
              </div>
              <button class="btn btn-primary" @click="openDetail(r.id)">Abrir</button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSurveys } from '@/store/surveysStore';
import { useResponses } from '@/store/responsesStore';
import { onMounted } from 'vue';

const route = useRoute();
const router = useRouter();
const { getById, getByIdAsync } = useSurveys();
const { listResponses, loadList } = useResponses();

const surveyId = computed(() => String(route.params.id || ''));
const survey = computed(() => getById(surveyId.value));
const all = computed(() => listResponses(surveyId.value));

onMounted(async () => {
  if (surveyId.value) {
    await getByIdAsync(surveyId.value);
    await loadList(surveyId.value);
  }
});

const page = ref(1);
const pageSize = 10;
const totalPages = computed(() => Math.max(1, Math.ceil(all.value.length / pageSize)));
const pageItems = computed(() => {
  const start = (page.value - 1) * pageSize;
  return all.value.slice(start, start + pageSize);
});

function prevPage(){ if (page.value > 1) page.value--; }
function nextPage(){ if (page.value < totalPages.value) page.value++; }

function openDetail(respId){
  router.push({ name: 'survey-response-detail', params: { id: surveyId.value, responseId: respId } });
}
function goBack(){ router.push('/encuestas'); }
function goAnswer(){ router.push({ name: 'survey-answer', params: { id: surveyId.value } }); }

function formatDate(iso){ try { return new Date(iso).toLocaleString(); } catch { return '' } }
</script>

