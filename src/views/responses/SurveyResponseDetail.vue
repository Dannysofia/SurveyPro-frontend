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
      <div class="preview-accent" :style="{ background: survey.color || 'var(--primary)' }"></div>
      <div class="pad-12">
        <div class="row-wrap" style="gap: 10px; align-items: center">
          <img v-if="survey.logoDataUrl" :src="survey.logoDataUrl" alt="logo" class="preview-logo" />
          <h2 class="title">{{ survey.title }}</h2>
          <span class="step" :class="{ active: survey.active }">{{ survey.active ? 'Activa' : 'Cerrada' }}</span>
        </div>
        <p class="subtle">Respuesta {{ response.id }} • {{ formatDate(response.submittedAt) }}</p>

        <div class="stack mt-8">
        <div v-for="(q, idx) in survey.questions" :key="q.id" class="preview-q">
          <label class="label">{{ idx + 1 }}. {{ q.text }}</label>
          <div class="mt-6">
            <template v-if="q.type==='open'">
              <div class="input" style="white-space: pre-wrap;">{{ getOpen(q.id) || '—' }}</div>
            </template>
            <template v-else-if="q.type==='single'">
              <div class="stack-sm">
                <label v-for="o in q.options" :key="o.id" class="row" style="gap: 6px">
                  <input type="radio" :name="'q_'+q.id" :value="o.id" :checked="isSingleChecked(q.id, o.id)" disabled />
                  {{ o.text }}
                </label>
              </div>
            </template>
            <template v-else-if="q.type==='multiple'">
              <div class="stack-sm">
                <label v-for="o in q.options" :key="o.id" class="row" style="gap: 6px">
                  <input type="checkbox" :value="o.id" :checked="isMultiChecked(q.id, o.id)" disabled />
                  {{ o.text }}
                </label>
              </div>
            </template>
          </div>
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
import { useResponses } from '@/store/responsesStore';
import { onMounted } from 'vue';

const route = useRoute();
const router = useRouter();
const { getById, getByIdAsync } = useSurveys();
const { getResponse, loadResponseDetail } = useResponses();

const surveyId = computed(() => String(route.params.id || ''));
const responseId = computed(() => String(route.params.responseId || ''));
const survey = computed(() => getById(surveyId.value));
const response = computed(() => getResponse(surveyId.value, responseId.value));

onMounted(async () => {
  if (surveyId.value) await getByIdAsync(surveyId.value);
  if (surveyId.value && responseId.value) await loadResponseDetail(surveyId.value, responseId.value);
});

function goBack(){ router.push({ name: 'survey-responses', params: { id: surveyId.value } }); }

function getOpen(qid){ return response.value?.answers?.[qid] || ''; }
function isSingleChecked(qid, oid){
  const val = response.value?.answers?.[qid];
  return String(val) === String(oid);
}
function isMultiChecked(qid, oid){
  const arr = response.value?.answers?.[qid] || [];
  if (!Array.isArray(arr)) return false;
  const arrStr = arr.map((x) => String(x));
  if (arrStr.includes(String(oid))) return true;
  // fallback: si guardaron etiquetas en lugar de IDs
  const q = survey.value?.questions?.find((qq) => String(qq.id) === String(qid));
  const opt = (q?.options || []).find((o) => String(o.id) === String(oid));
  if (!opt) return false;
  const label = String(opt.text).trim().toLowerCase();
  return arrStr.map((x) => String(x).trim().toLowerCase()).includes(label);
}

function formatDate(iso){ try { return new Date(iso).toLocaleString(); } catch { return '' } }
</script>

