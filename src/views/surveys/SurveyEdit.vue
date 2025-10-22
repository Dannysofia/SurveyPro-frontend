<template>
  <section>
    <header class="editor-header">
      <div class="row">
        <h1 class="title">Editar encuesta</h1>
      </div>
    </header>

    <div class="card">
      <div v-if="loading" class="empty-tip">Cargando encuesta...</div>

      <template v-else>
        <div
          v-if="hasResponses"
          class="alert"
          style="margin-bottom: 12px"
        >
          Esta encuesta ya tiene respuestas y no puede editarse.
        </div>

        <div class="form-grid">
          <div class="form-col">
            <label class="label">Título *</label>
            <input
              class="input"
              v-model="form.title"
              type="text"
              placeholder="Mi encuesta"
              :disabled="hasResponses"
              @blur="touched.title = true"
            />
            <p v-if="showTitleError" class="error">{{ titleError }}</p>

            <label class="label">Descripción</label>
            <textarea
              class="input"
              v-model="form.description"
              rows="3"
              :disabled="hasResponses"
            ></textarea>
          </div>
        </div>

        <div class="section">
          <h4 class="section-title">Personalización</h4>
          <div class="personal-row">
            <div class="personal-item">
              <label class="label">Color</label>
              <input class="color" v-model="form.color" type="color" :disabled="hasResponses" />
            </div>
          </div>
        </div>

        <footer class="actions">
          <button class="btn btn-secondary" @click="cancel">Cancelar</button>
          <button
            class="btn btn-primary"
            :disabled="!canSave || hasResponses"
            @click="save"
          >
            Guardar cambios
          </button>
        </footer>
      </template>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSurveys } from '@/store/surveysStore';

const route = useRoute();
const router = useRouter();
const { getByIdAsync, updateGeneral, validateGeneral, listResponses } = useSurveys();

const loading = ref(true);
const surveyId = computed(() => {
  const raw = route.params.id;
  const n = Number(raw);
  return Number.isNaN(n) ? String(raw) : n;
});

const form = reactive({
  title: '',
  description: '',
  color: '#4f46e5',
});

const touched = reactive({ title: false });
const titleError = computed(() => validateGeneral(form).errors.title || '');
const showTitleError = computed(() => Boolean(titleError.value) && touched.title);
const canSave = computed(() => validateGeneral(form).ok);

const hasResponses = ref(false);

onMounted(async () => {
  try {
    const s = await getByIdAsync(surveyId.value);
    form.title = s?.title || '';
    form.description = s?.description || '';
    form.color = s?.color || '#4f46e5';
    hasResponses.value = (listResponses(surveyId.value) || []).length > 0;
  } catch (e) {
    alert(String(e?.response?.data?.error || e.message || e));
  } finally {
    loading.value = false;
  }
});

function save() {
  const v = validateGeneral(form);
  if (!v.ok) {
    alert('Completa el título');
    touched.title = true;
    return;
  }
  updateGeneral(surveyId.value, {
    title: form.title,
    description: form.description,
    color: form.color,
  })
    .then(() => {
      alert('Encuesta actualizada');
      router.push('/encuestas');
    })
    .catch((e) => alert(String(e?.response?.data?.error || e.message || e)));
}

function cancel() {
  router.back();
}
</script>

