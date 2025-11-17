<template>
  <article class="card survey-card">
    <div class="card-accent" :style="{ background: accentColor }"></div>

    <div class="card-body">
      <div class="between" style="margin-bottom: 6px">
        <span :class="['badge', isClosed ? 'badge-closed' : 'badge-active']">
          {{ isClosed ? "Cerrada" : "Activa" }}
        </span>

        <div class="card-icons">
          <button
            class="icon-btn"
            @click="$emit('edit', survey)"
            :disabled="isClosed"
            aria-label="Editar"
            title="Editar"
          >
            <i class="fas fa-edit"></i>
          </button>

          <button
            class="icon-btn"
            @click="$emit('open-stats', survey)"
            aria-label="Estadísticas"
            title="Estadísticas"
          >
            <i class="fas fa-chart-pie"></i>
          </button>

          <button
            class="icon-btn"
            @click="$emit('answer', survey)"
            :disabled="isClosed"
            aria-label="Responder"
            title="Responder"
          >
            <i class="fas fa-reply"></i>
          </button>

          <button
            class="icon-btn"
            @click="$emit('toggle', survey)"
            :title="isClosed ? 'Abrir' : 'Cerrar'"
            aria-label="Cambiar estado"
          >
            <i v-if="!isClosed" class="fas fa-unlock-keyhole"></i>
            <i v-else class="fas fa-lock"></i>
          </button>

          <button
            class="icon-btn"
            @click="shareSurvey"
            :disabled="isClosed"
            aria-label="Compartir enlace"
            title="Compartir"
          >
            <i class="fas fa-share-nodes"></i>
          </button>

          <button
            class="icon-btn danger"
            @click="$emit('delete', survey)"
            aria-label="Eliminar"
            title="Eliminar"
          >
            <i class="fas fa-trash-can"></i>
          </button>
        </div>
      </div>

      <div class="card-title">
        <h3>{{ survey.title }}</h3>
      </div>

      <p class="muted">{{ survey.description }}</p>
      <p class="subtle">
        {{ formatDate(survey.created_at || survey.createdAt) }}
      </p>
    </div>

    <footer class="card-actions">
      <button class="btn btn-primary" @click="$emit('open-responses', survey)">
        Ver respuestas
      </button>
    </footer>
  </article>
</template>

<script setup>
import { computed, defineProps, defineEmits } from "vue";

const props = defineProps({
  survey: { type: Object, required: true },
});

defineEmits([
  "edit",
  "answer",
  "toggle",
  "delete",
  "open-responses",
  "open-stats",
]);

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "";
  }
}

const isClosed = computed(
  () => props.survey?.status === "Cerrado" || props.survey?.active === false
);

const accentColor = computed(() => props.survey?.color || "var(--primary)");

async function shareSurvey() {
  try {
    const id = props.survey?.id;
    if (!id) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = origin + `/encuestas/${encodeURIComponent(id)}/responder`;

    if (navigator?.share) {
      try {
        await navigator.share({
          title: "Responder encuesta",
          text: props.survey?.title || "Encuesta",
          url,
        });
        return;
      } catch {
        // No hacer nada si el usuario cancela
      }
    }

    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      alert("Enlace copiado al portapapeles");
    } else {
      prompt("Copia este enlace para compartir:", url);
    }
  } catch (e) {
    alert("No se pudo generar el enlace");
  }
}
</script>
