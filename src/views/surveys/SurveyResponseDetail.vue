<template>
  <section>
    <header class="list-header">
      <h1>Detalle de respuesta</h1>
      <button class="btn btn-ghost" @click="goBack">Volver</button>
    </header>

    <div v-if="!survey || !response" class="empty">
      <p>No se encontró la encuesta o respuesta.</p>
      <button class="btn btn-ghost" @click="goBack">Regresar</button>
    </div>

    <div v-else class="card">
      <div class="between">
        <div>
          <h3 class="title">{{ survey.title }}</h3>
          <p class="subtle">Respuesta {{ response.id }} • {{ formatDate(response.submittedAt) }}</p>
        </div>
        <span class="step" :class="{ active: survey.active }">{{ survey.active ? 'Activa' : 'Cerrada' }}</span>
      </div>

      <div class="stack mt-8">
        <div v-for="(q, idx) in survey.questions" :key="q.id" class="preview-q">
          <strong>{{ idx + 1 }}. {{ q.text }}</strong>
          <div class="mt-6">
            <template v-if="q.type==='open'">
              <div class="input" style="white-space: pre-wrap;">{{ getOpen(q.id) || '—' }}</div>
            </template>
            <template v-else-if="q.type==='single'">
              <div class="input">{{ getSingleText(q) || '—' }}</div>
            </template>
            <template v-else-if="q.type==='multiple'">
              <div class="input">{{ getMultipleText(q) || '—' }}</div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSurveys } from '@/store/surveysStore';
import { onMounted } from 'vue';

const route = useRoute();
const router = useRouter();
const { getById, getByIdAsync, getResponse } = useSurveys();

const surveyId = computed(() => String(route.params.id || ''));
const responseId = computed(() => String(route.params.responseId || ''));
const survey = computed(() => getById(surveyId.value));
const response = computed(() => getResponse(surveyId.value, responseId.value));

onMounted(async () => {
  if (surveyId.value) await getByIdAsync(surveyId.value);
});

function goBack(){ router.push({ name: 'survey-responses', params: { id: surveyId.value } }); }

function getOpen(qid){ return response.value?.answers?.[qid] || ''; }
function getSingleText(q){
  const val = response.value?.answers?.[q.id];
  const opt = (q.options || []).find(o => o.id === val);
  return opt?.text || '';
}
function getMultipleText(q){
  const arr = response.value?.answers?.[q.id] || [];
  if (!Array.isArray(arr) || arr.length === 0) return '';
  const texts = (q.options || []).filter(o => arr.includes(o.id)).map(o => o.text);
  return texts.join(', ');
}

function formatDate(iso){ try { return new Date(iso).toLocaleString(); } catch { return '' } }
</script>

