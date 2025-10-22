<template>
  <section>
    <header class="list-header">
      <h1 class="title">Tus encuestas</h1>
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
      <article v-for="s in filtered" :key="s.id" class="card survey-card">
        <div
          class="card-accent"
          :style="{ background: s.color || 'var(--primary)' }"
        ></div>
        <div class="card-body">
          <div class="between" style="margin-bottom: 6px">
            <span
              :class="['badge', s.active ? 'badge-active' : 'badge-closed']"
              >{{ s.active ? "Activa" : "Cerrada" }}</span
            >
            <div class="card-icons">
              <button
                class="icon-btn"
                @click="edit(s)"
                aria-label="Editar"
                title="Editar"
              >
                <i class="fas fa-edit"></i>
              </button>
              <button
                class="icon-btn"
                @click="goAnswer(s)"
                :disabled="!s.active"
                aria-label="Responder"
                title="Responder"
              >
                <i class="fas fa-reply"></i>
              </button>
              <button
                class="icon-btn"
                @click="toggleStatus(s)"
                :title="s.active ? 'Cerrar' : 'Abrir'"
                aria-label="Cambiar estado"
              >
                <i v-if="s.active" class="fas fa-unlock-keyhole"></i>
                <i v-else class="fas fa-lock"></i>
              </button>
              <button
                class="icon-btn danger"
                @click="confirmDelete(s)"
                aria-label="Eliminar"
                title="Eliminar"
              >
                <i class="fas fa-trash-can"></i>
              </button>
            </div>
          </div>
          <div class="card-title">
            <h3>{{ s.title }}</h3>
          </div>
          <p class="muted">{{ s.description }}</p>
          <p class="subtle">{{ formatDate(s.createdAt) }}</p>
        </div>
        <footer class="card-actions">
          <button class="btn btn-primary" @click="openResponses(s)">
            Ver respuestas
          </button>
        </footer>
      </article>
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
// styles are loaded globally in main.js
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useSurveys } from "@/store/surveysStore";

const router = useRouter();
const { list, removeSurvey, setActive, listResponses } = useSurveys();
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

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "";
  }
}
</script>
