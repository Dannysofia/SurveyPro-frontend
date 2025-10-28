<template>
  <section>
    <header class="editor-header">
      <div class="row">
        <h1 class="title">Editar encuesta</h1>
      </div>
    </header>

    <nav class="steps">
      <span :class="['step', { active: step === 0 }]">General</span>
      <span :class="['step', { active: step === 1 }]">Preguntas</span>
      <span :class="['step', { active: step === 2 }]">Vista previa</span>
    </nav>

    <div v-if="loading" class="card">
      <div class="empty-tip">Cargando encuesta...</div>
    </div>

    <div v-else>
      <div v-if="hasResponses" class="alert" style="margin-bottom: 12px">
        Esta encuesta ya tiene respuestas y no puede editarse.
      </div>

      <div v-if="step === 0" class="card">
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
              <input
                class="color"
                v-model="form.color"
                type="color"
                :disabled="hasResponses"
              />
            </div>
          </div>
        </div>

        <footer class="actions">
          <button class="btn btn-ghost" @click="cancel">Cancelar</button>
          <button
            class="btn btn-primary"
            :disabled="!canNextGeneral || hasResponses"
            @click="next"
          >
            Siguiente
          </button>
        </footer>
      </div>

      <div v-else-if="step === 1" class="card">
        <header class="between" style="margin-bottom: 8px">
          <h3 class="title">Preguntas</h3>
          <button
            class="btn btn-ghost"
            @click="addQuestion"
            :disabled="hasResponses"
          >
            Agregar pregunta
          </button>
        </header>

        <div v-if="form.questions.length === 0" class="empty-tip">
          Agrega al menos una pregunta para continuar.
        </div>

        <div v-else class="stack">
          <div
            v-for="(q, idx) in form.questions"
            :key="q.id"
            class="question-card"
          >
            <div class="between">
              <strong>#{{ idx + 1 }}</strong>
              <div class="question-toolbar">
                <button
                  class="btn btn-ghost btn-sm"
                  @click="move(idx, -1)"
                  :disabled="idx === 0 || hasResponses"
                >
                  Subir
                </button>
                <button
                  class="btn btn-ghost btn-sm"
                  @click="move(idx, 1)"
                  :disabled="idx === form.questions.length - 1 || hasResponses"
                >
                  Bajar
                </button>
                <button
                  class="btn btn-danger btn-sm"
                  @click="removeQuestion(idx)"
                  :disabled="hasResponses"
                >
                  Eliminar
                </button>
              </div>
            </div>

            <label class="label">Texto de la pregunta</label>
            <input
              class="input"
              v-model="q.text"
              type="text"
              :disabled="hasResponses"
            />

            <div class="row-wrap">
              <label class="label">Tipo</label>
              <select class="input" v-model="q.type" :disabled="hasResponses">
                <option
                  v-for="t in questionTypeOptions"
                  :key="t.key"
                  :value="t.key"
                >
                  {{ t.label }}
                </option>
              </select>

              <label class="row" style="gap: 6px">
                <input
                  type="checkbox"
                  v-model="q.required"
                  :disabled="hasResponses"
                />
                Obligatoria
              </label>
            </div>

            <div
              v-if="q.type === 'single' || q.type === 'multiple'"
              class="mt-8"
            >
              <div class="between">
                <strong>Opciones</strong>
                <button
                  class="btn btn-ghost"
                  @click="addOption(q)"
                  :disabled="hasResponses"
                >
                  Agregar opción
                </button>
              </div>
              <div
                v-if="!q.options || q.options.length === 0"
                class="empty-tip"
              >
                Agrega 2 o más opciones
              </div>
              <div v-else class="stack-sm">
                <div
                  v-for="(opt, k) in q.options"
                  :key="opt.id"
                  class="option-row"
                >
                  <input
                    class="input flex1"
                    v-model="opt.text"
                    type="text"
                    placeholder="Opción"
                    :disabled="hasResponses"
                  />
                  <button
                    class="btn btn-danger btn-sm"
                    @click="removeOption(q, k)"
                    :disabled="hasResponses"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer class="actions">
          <button class="btn btn-ghost" @click="prev">Atrás</button>
          <button
            class="btn btn-primary"
            :disabled="!canNextQuestions || hasResponses"
            @click="next"
          >
            Siguiente
          </button>
        </footer>
      </div>

      <div v-else-if="step === 2" class="card">
        <header class="between"><h3 class="title">Vista previa</h3></header>
        <div class="preview">
          <div
            class="preview-accent"
            :style="{ background: form.color || 'var(--primary)' }"
          ></div>
          <div class="pad-12">
            <div class="row-10">
              <h2 class="title">{{ form.title }}</h2>
            </div>
            <p class="muted">{{ form.description }}</p>

            <div class="stack mt-8">
              <div
                v-for="(q, idx) in form.questions"
                :key="q.id"
                class="preview-q"
              >
                <strong>{{ idx + 1 }}. {{ q.text }}</strong>
                <span v-if="q.required" class="error ml-6">*</span>
                <div v-if="q.type === 'open'" class="mt-6">
                  <input
                    type="text"
                    disabled
                    placeholder="Respuesta abierta"
                    class="input"
                  />
                </div>
                <div v-else-if="q.type === 'single'" class="stack-sm mt-6">
                  <label
                    v-for="o in q.options"
                    :key="o.id"
                    class="row"
                    style="gap: 6px"
                  >
                    <input type="radio" disabled /> {{ o.text }}
                  </label>
                </div>
                <div v-else-if="q.type === 'multiple'" class="stack-sm mt-6">
                  <label
                    v-for="o in q.options"
                    :key="o.id"
                    class="row"
                    style="gap: 6px"
                  >
                    <input type="checkbox" disabled /> {{ o.text }}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <footer class="actions">
          <button class="btn btn-ghost" @click="prev">Atrás</button>
          <button
            class="btn btn-primary"
            @click="save"
            :disabled="hasResponses"
          >
            Guardar
          </button>
        </footer>
      </div>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useSurveys } from "@/store/surveysStore";
import { useResponses } from "@/store/responsesStore";

const route = useRoute();
const router = useRouter();
const surveys = useSurveys();
const { getByIdAsync, validateGeneral, validateQuestions } = surveys;
const { listResponses } = useResponses();

// estado local del formulario y meta
const loading = ref(true);
const surveyId = computed(() => {
  const raw = route.params.id;
  const n = Number(raw);
  return Number.isNaN(n) ? String(raw) : n;
});

const form = reactive({
  title: "",
  description: "",
  color: "#4f46e5",
  questions: [],
});
const original = ref(null);

const step = ref(0);
const touched = reactive({ title: false });
const titleError = computed(() => validateGeneral(form).errors.title || "");
const showTitleError = computed(
  () => Boolean(titleError.value) && touched.title
);
const canNextGeneral = computed(() => validateGeneral(form).ok);
const canNextQuestions = computed(() => validateQuestions(form.questions).ok);

const hasResponses = ref(false);
const questionTypeOptions = computed(() => surveys.questionTypeOptions.value);

// Cargar encuesta al montar el componente
onMounted(async () => {
  try {
    loading.value = true;
    const s = await getByIdAsync(surveyId.value);
    original.value = s;
    form.title = s?.title || "";
    form.description = s?.description || "";
    form.color = s?.color || "#4f46e5";
    form.questions = Array.isArray(s?.questions)
      ? s.questions.map((q) => ({
          id: q.id,
          text: q.text,
          required: q.required,
          type: q.type,
          options: Array.isArray(q.options)
            ? q.options.map((o) => ({ id: o.id, text: o.text }))
            : [],
        }))
      : [];
    hasResponses.value = (listResponses(surveyId.value) || []).length > 0;

    // cargar tipos de pregunta
    await surveys.loadQuestionTypes();
  } catch (e) {
    alert(String(e?.response?.data?.error || e.message || e));
  } finally {
    loading.value = false;
  }
});

// Navegación simple entre pasos
function next() {
  if (step.value < 2) step.value++;
}
function prev() {
  if (step.value > 0) step.value--;
}

function addQuestion() {
  surveys.addQuestion(form);
}
function removeQuestion(index) {
  surveys.removeQuestion(form, index);
}
function move(index, delta) {
  surveys.moveQuestion(form, index, delta);
}
function addOption(q) {
  surveys.addOption(q);
}
function removeOption(q, k) {
  surveys.removeOption(q, k);
}

// Guardar cambios
async function save() {
  if (hasResponses.value) {
    alert("Esta encuesta tiene respuestas y no puede editarse.");
    return;
  }
  try {
    await surveys.saveSurveyEdit(surveyId.value, form, original.value);
    alert("Encuesta actualizada");
    router.push("/encuestas");
  } catch (e) {
    if (e.message === "Completa el título") {
      touched.title = true;
    }
    alert(String(e?.response?.data?.error || e.message || e));
  }
}

function cancel() {
  router.back();
}
</script>
