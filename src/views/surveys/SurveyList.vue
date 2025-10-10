<template>
  <section>
    <header class="list-header">
      <h1>Encuestas</h1>
      <button class="btn btn-primary" @click="goCreate">Crear encuesta</button>
    </header>

    <div v-if="items.length === 0" class="empty">
      <p>No hay encuestas todavia.</p>
      <button class="btn btn-primary" @click="goCreate">Crear la primera</button>
    </div>

    <div v-else class="grid">
      <article v-for="s in items" :key="s.id" class="card">
        <div class="card-accent" :style="{ background: s.color || 'var(--primary)' }"></div>
        <div class="card-body">
          <div class="card-title">
            <img v-if="s.logoDataUrl" :src="s.logoDataUrl" alt="logo" class="logo" />
            <h3>{{ s.title }}</h3>
          </div>
          <p class="muted">{{ s.description }}</p>
          <p class="subtle">{{ formatDate(s.createdAt) }}</p>
        </div>
        <footer class="card-actions">
          <button class="btn btn-ghost" @click="preview(s)">Vista previa</button>
          <button class="btn btn-ghost" @click="openResponses(s)">Ver respuestas</button>
          <button class="btn btn-ghost" @click="goAnswer(s)" :disabled="!s.active">Responder</button>
          <button class="btn" :class="s.active ? 'btn-danger' : 'btn-primary'" @click="toggleStatus(s)">{{ s.active ? 'Cerrar' : 'Abrir' }}</button>
          <button class="btn btn-danger" @click="confirmDelete(s)">Eliminar</button>
        </footer>
      </article>
    </div>

    <dialog ref="dlg" class="dlg">
      <p>Eliminar esta encuesta? Esta accion no se puede deshacer.</p>
      <div class="dlg-actions">
        <button class="btn btn-ghost" @click="closeDialog">Cancelar</button>
        <button class="btn btn-danger" @click="doDelete">Eliminar</button>
      </div>
    </dialog>
  </section>
 </template>

<script setup>
// styles are loaded globally in main.js
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSurveys } from '@/store/surveys';

const router = useRouter();
const { list, removeSurvey, setActive } = useSurveys();
const items = computed(() => list().value);

const toDelete = ref(null);
const dlg = ref(null);

function goCreate() {
  router.push('/encuestas/nueva');
}

function preview(s) {
  router.push({ name: 'survey-editor', query: { preview: '1' }, state: { draft: s } });
}

function openResponses(s) {
  router.push({ name: 'survey-responses', params: { id: s.id } });
}
function goAnswer(s) {
  router.push({ name: 'survey-answer', params: { id: s.id } });
}
function toggleStatus(s) {
  setActive(s.id, !s.active);
}

function confirmDelete(s) {
  toDelete.value = s;
  if (dlg.value?.showModal) dlg.value.showModal();
}
function closeDialog() { dlg.value?.close?.(); }
function doDelete() {
  if (toDelete.value) removeSurvey(toDelete.value.id);
  toDelete.value = null;
  closeDialog();
}

function formatDate(iso) {
  try { return new Date(iso).toLocaleString(); } catch { return '' }
}
</script>
