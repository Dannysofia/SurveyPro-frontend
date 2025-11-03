<template>
  <section>
    <div class="breadcrumbs">
      <span class="breadcrumb-item" @click="$router.push('/inicio')">Inicio</span>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-item">Encuestas</span>
    </div>

    <header class="list-header">
      <h1 class="title">Mis encuestas</h1>
      <button class="btn btn-primary" @click="goCreate">Crear encuesta</button>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
    </header>

    <div class="list-toolbar">
      <div class="search">
        <i class="fas fa-search"></i>
        <input
          class="input search-input"
          v-model="q"
          type="text"
          placeholder="Buscar encuestas..."
        />
      </div>
      <div class="filters">
        <select class="input select-sm" v-model="sortBy">
          <option value="date">Ordenar: Fecha</option>
          <option value="title">Ordenar: Título</option>
        </select>
        <select class="input select-sm" v-model="status">
          <option value="all">Estado: Todas</option>
          <option value="active">Estado: Activas</option>
          <option value="closed">Estado: Cerradas</option>
        </select>
      </div>
    </div>

    <div v-if="items.length === 0" class="empty">
      <p>No hay encuestas todavia.</p>
      <button class="btn btn-primary" @click="goCreate">
        Crear la primera
      </button>
    </div>

    <div v-else class="grid">
      <!-- cambio: usamos el componente <SurveyCard> en lugar del markup inline -->
      <SurveyCard
        v-for="s in filtered"
        :key="s.id"
        :survey="s"
        @edit="edit"
        @open-stats="openStats"
        @answer="goAnswer"
        @toggle="toggleStatus"
        @delete="confirmDelete"
        @open-responses="openResponses"
      />
    </div>

    <dialog ref="dlg" class="dlg">
      <p>¿Desea eliminar esta encuesta?</p>
      <div class="dlg-actions">
        <button class="btn btn-ghost" @click="closeDialog">Cancelar</button>
        <button class="btn btn-danger" @click="doDelete">Eliminar</button>
      </div>
    </dialog>
  </section>
</template>

<script setup>

import { computed, ref, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { useSurveys } from "@/store/surveysStore";
import { useResponses } from "@/store/responsesStore";
import SurveyCard from "@/components/SurveyCard.vue";
import "@/assets/css/surveys.css";
import "@/assets/css/breadcrumbs.css";

const router = useRouter();
const { list, removeSurvey, setActive, getByIdAsync } = useSurveys();
const { listResponses } = useResponses();
const items = computed(() => list().value);
const q = ref("");
const sortBy = ref("date");
const status = ref("all");
const filtered = computed(() => {
  let arr = items.value.slice();
  const query = q.value.trim().toLowerCase();
  if (query)
    arr = arr.filter(
      (s) =>
        (s.title || "").toLowerCase().includes(query) ||
        (s.description || "").toLowerCase().includes(query)
    );
  if (status.value === "active") arr = arr.filter((s) => s.active);
  if (status.value === "closed") arr = arr.filter((s) => !s.active);
  if (sortBy.value === "title")
    arr.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  else arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return arr;
});

const toDelete = ref(null);
const dlg = ref(null);

function goCreate() {
  router.push("/encuestas/nueva");
}

function openResponses(s) {
  router.push({ name: "survey-responses", params: { id: s.id } });
}
function openStats(s) {
  router.push({ name: 'survey-report', params: { id: s.id } });
}
function goAnswer(s) {
  router.push({ name: "survey-answer", params: { id: s.id } });
}
function edit(s) {
  const hasResp = (listResponses(s.id) || []).length > 0;
  if (hasResp) {
    alert("Esta encuesta ya tiene respuestas y no puede editarse.");
    return;
  }
  router.push({ name: "survey-edit", params: { id: s.id } });
}
function toggleStatus(s) {
  setActive(s.id, !s.active);
}

function confirmDelete(s) {
  toDelete.value = s;
  if (dlg.value?.showModal) dlg.value.showModal();
}
function closeDialog() {
  dlg.value?.close?.();
}
function doDelete() {
  if (toDelete.value) removeSurvey(toDelete.value.id);
  toDelete.value = null;
  closeDialog();
}

// Escuchar actualizaciones de encuesta y refrescar caché
function onSurveyUpdated(e) {
  const id = e?.detail?.id;
  if (id) getByIdAsync(id, { force: true }).catch(() => {});
}

if (typeof window !== "undefined" && window.addEventListener) {
  window.addEventListener("survey-updated", onSurveyUpdated);
}

onBeforeUnmount(() => {
  if (typeof window !== "undefined" && window.removeEventListener) {
    window.removeEventListener("survey-updated", onSurveyUpdated);
  }
});
</script>
