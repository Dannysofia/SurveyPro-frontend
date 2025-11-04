<template>
  <section>
    <header class="list-header">
      <h1>Responder encuesta</h1>
      <button v-if="isLoggedIn" class="btn btn-ghost" @click="goBack">Volver</button>
    </header>

    <div v-if="!survey" class="empty">
      <p>No se encontró la encuesta.</p>
      <button v-if="isLoggedIn" class="btn btn-ghost" @click="goBack">Regresar</button>
    </div>

    <div v-else class="card">
      <div class="preview-accent" :style="{ background: survey.color || 'var(--primary)' }"></div>
      <div class="pad-12">
        <div class="row-wrap" style="gap: 10px; align-items: center">
          <img v-if="survey.logoDataUrl" :src="survey.logoDataUrl" alt="logo" class="preview-logo" />
          <h2 class="title">{{ survey.title }}</h2>
          <span class="step" :class="{ active: survey.active }">{{ survey.active ? 'Activa' : 'Cerrada' }}</span>
        </div>
        <p class="muted">{{ survey.description }}</p>

        <div v-if="!survey.active" class="section mt-8">
          <strong>Esta encuesta está cerrada y no recibe respuestas.</strong>
        </div>

        <form v-else class="stack mt-8" @submit.prevent="onSubmit">
          <div v-for="(q, idx) in survey.questions" :key="q.id" class="preview-q">
            <label class="label">{{ idx + 1 }}. {{ q.text }}<span v-if="q.required" class="error">*</span></label>
            <div v-if="q.type === 'open'">
              <input class="input" type="text" v-model="model[q.id]" />
            </div>
            <div v-else-if="q.type === 'single'" class="stack-sm">
              <label v-for="o in q.options" :key="o.id" class="row" style="gap: 6px">
                <input type="radio" :name="q.id" :value="o.id" v-model="model[q.id]" />
                {{ o.text }}
              </label>
            </div>
            <div v-else-if="q.type === 'multiple'" class="stack-sm">
              <label v-for="o in q.options" :key="o.id" class="row" style="gap: 6px">
                <input type="checkbox" :value="o.id" @change="onMultiChange(q.id, $event)" :checked="isChecked(q.id, o.id)" />
                {{ o.text }}
              </label>
            </div>
          </div>
          <div class="actions">
            <button class="btn btn-primary" type="submit">Enviar</button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSurveys } from '@/store/surveysStore';
import { useResponses } from '@/store/responsesStore';
import { useAuthStore } from '@/store/authStore';

const route = useRoute();
const router = useRouter();
const { getById, getByIdAsync } = useSurveys();
const { submitResponse } = useResponses();
const auth = useAuthStore();

const surveyId = computed(() => String(route.params.id || ''));
const survey = computed(() => getById(surveyId.value));
const model = reactive({});
const isLoggedIn = computed(() => Boolean(auth?.token));

onMounted(async () => {
  if (surveyId.value) await getByIdAsync(surveyId.value);
});

function onMultiChange(qid, ev) {
  const checked = ev.target.checked;
  const val = ev.target.value;
  if (!Array.isArray(model[qid])) model[qid] = [];
  if (checked) {
    if (!model[qid].includes(val)) model[qid].push(val);
  } else {
    model[qid] = model[qid].filter((x) => x !== val);
  }
}
function isChecked(qid, oid) {
  return Array.isArray(model[qid]) && model[qid].includes(oid);
}

async function onSubmit() {
  try {
    await submitResponse(surveyId.value, model);
    if (isLoggedIn.value) {
      alert('Respuestas guardadas');
      router.push({ name: 'survey-responses', params: { id: surveyId.value } });
    } else {
      router.push({ name: 'survey-thanks', params: { id: surveyId.value } });
    }
  } catch (e) {
    alert(String(e.message || e));
  }
}

function goBack() {
  router.push('/encuestas');
}
</script>

