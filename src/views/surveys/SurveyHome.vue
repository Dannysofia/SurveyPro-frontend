<template>
  <section>
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
    />

    <div
      style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      "
    >
      <button class="btn btn-ghost" @click="onProfile">Perfil</button>
    </div>

    <!-- Bienvenida -->
    <div class="card" style="margin-bottom: 12px">
      <div class="card-body">
        <h1 style="margin: 0">Bienvenido a SurveyPro</h1>
        <p class="muted" style="margin-top: 6px">
          Aquí verás tus estadísticas y tus encuestas recientes.
        </p>
      </div>
    </div>

    <!-- Resumen -->
    <div class="card" style="margin-bottom: 12px">
      <div class="card-body">
        <h3 style="margin: 0 0 8px">Resumen</h3>
        <div style="display: flex; gap: 12px; flex-wrap: wrap">
          <SurveySummaryStat
            title="Total de encuestas"
            :value="summary.total_surveys"
          />
          <SurveySummaryStat
            title="Total de respuestas"
            :value="summary.total_responses"
          />
        </div>
      </div>
    </div>

    <!-- Encabezado de recientes -->
    <div class="list-header">
      <h2 style="margin: 0">Encuestas recientes</h2>
      <button
        v-if="recentSurveys.length > 0"
        class="btn btn-primary"
        @click="goToList"
      >
        Crear encuesta
      </button>
    </div>

    <!-- Si no hay encuestas -->
    <div v-if="recentSurveys.length === 0" class="card">
      <div class="card-body">
        <p class="muted">Aún no tienes encuestas.</p>
        <button class="btn btn-primary" @click="goToList">
          Crear encuesta
        </button>
      </div>
    </div>

    <!-- Grid de encuestas (mismas acciones que en la lista) -->
    <div v-else class="grid">
      <SurveyCard
        v-for="s in recentSurveys"
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

    <p v-if="error" class="error" style="margin-top: 8px">{{ error }}</p>

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
import { ref, onMounted, computed, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { fetchHomeSummary } from "@/store/surveysView.js";
import SurveySummaryStat from "@/components/SurveySummaryStat.vue";
import SurveyCard from "@/components/SurveyCard.vue";
import { useSurveys } from "@/store/surveysStore";
import "@/assets/css/surveys.css";
import { useResponses } from "@/store/responsesStore";

const router = useRouter();

const { list, setActive, removeSurvey, getByIdAsync } = useSurveys();
const { listResponses } = useResponses();

const summary = ref({ total_surveys: 0, total_responses: 0 });
const error = ref("");
const loading = ref(false);
const toDelete = ref(null);
const dlg = ref(null);

const recentSurveys = computed(() => {
  const items = list().value || [];
  const sorted = [...items].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  return sorted.slice(0, 6);
});

onMounted(async () => {
  try {
    loading.value = true;
    const stats = await fetchHomeSummary();
    summary.value = stats;
  } catch (e) {
    console.error(e);
    error.value = "No se pudo cargar la información";
  } finally {
    loading.value = false;
  }
});

function goToList() {
  router.push({ name: "surveys" });
}

function onProfile() {
  router.push({ name: "profile" });
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

async function edit(s) {
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

// Escuchar evento global de encuesta actualizada
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
