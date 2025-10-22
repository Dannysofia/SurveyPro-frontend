<template>
  <section>
    <header class="list-header">
      <h1>Respuestas</h1>
    </header>

    <div v-if="items.length === 0" class="empty">
      <p>Todavía no hay encuestas respondidas.</p>
      <router-link class="btn btn-primary" to="/encuestas">Ir a encuestas</router-link>
    </div>

    <div v-else class="grid">
      <article v-for="it in items" :key="it.survey.id" class="card">
        <div class="card-accent" :style="{ background: it.survey.color || 'var(--primary)' }"></div>
        <div class="card-body">
          <div class="card-title">
            <img v-if="it.survey.logoDataUrl" :src="it.survey.logoDataUrl" alt="logo" class="logo" />
            <h3>{{ it.survey.title }}</h3>
          </div>
          <p class="muted">{{ it.survey.description }}</p>
          <p class="subtle">Última respuesta: {{ formatDate(it.latest) }}</p>
          <p><strong>{{ it.count }}</strong> respuesta(s)</p>
        </div>
        <footer class="card-actions">
          <button class="btn btn-primary" @click="open(it.survey.id)">Ver respuestas</button>
        </footer>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSurveys } from '@/store/surveysStore';

const router = useRouter();
const { list, listResponses } = useSurveys();

const items = computed(() => {
  const surveys = list().value || [];
  return surveys
    .map(s => {
      const rs = listResponses(s.id);
      if (!rs || rs.length === 0) return null;
      return { survey: s, count: rs.length, latest: rs[0]?.submittedAt };
    })
    .filter(Boolean);
});

function open(id){ router.push({ name: 'survey-responses', params: { id } }); }
function formatDate(iso){ try { return new Date(iso).toLocaleString(); } catch { return '' } }
</script>

