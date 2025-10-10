<template>
  <section>
    <header class="editor-header">
      <div class="row">
        <button class="btn btn-ghost" @click="goBack">Volver</button>
        <h1 class="title">Nueva encuesta</h1>
      </div>
      <button class="btn btn-danger" @click="discard">Eliminar</button>
    </header>

    <nav class="steps">
      <span :class="['step', { active: step === 0 }]">1. General</span>
      <span :class="['step', { active: step === 1 }]">2. Preguntas</span>
      <span :class="['step', { active: step === 2 }]">3. Vista previa</span>
    </nav>

    <div v-if="step === 0" class="card">
      <div class="form-grid">
        <div class="form-col">
          <label class="label">Título *</label>
          <input class="input" v-model="form.title" type="text" placeholder="Mi encuesta" />
          <p v-if="titleError" class="error">{{ titleError }}</p>

          <label class="label">Descripción</label>
          <textarea class="input" v-model="form.description" rows="3"></textarea>

          
        </div>
      </div>
      <div class="section">
        <h4 class="section-title">Personalización</h4>
        <div class="personal-row">
          <div class="personal-item">
            <label class="label">Color</label>
            <input class="color" v-model="form.color" type="color" />
          </div>
          <div class="personal-item">
            <label class="label">Logo</label>
            <input class="file" type="file" accept="image/png, image/jpeg" @change="onLogo" />
            <small>PNG/JPG, hasta 1MB</small>
            <div v-if="form.logoDataUrl" class="logo-preview">
              <img :src="form.logoDataUrl" alt="logo" />
            </div>
          </div>
        </div>
      </div>

      <footer class="actions">
        <button class="btn btn-primary" :disabled="!canNextGeneral" @click="next">Siguiente</button>
      </footer>
    </div>

    <div v-else-if="step === 1" class="card">
      <header class="between" style="margin-bottom:8px;">
        <h3 class="title">Preguntas</h3>
        <button class="btn btn-ghost" @click="addQuestion">Agregar pregunta</button>
      </header>

      <div v-if="form.questions.length === 0" style="padding:8px;border:1px dashed #ccc;border-radius:8px;">
        Agrega al menos una pregunta para continuar.
      </div>

      <div v-else style="display:flex;flex-direction:column;gap:12px;">
        <div v-for="(q, idx) in form.questions" :key="q.id" class="question-card">
          <div class="between">
            <strong>#{{ idx + 1 }}</strong>
            <div class="question-toolbar">
              <button class="btn btn-ghost btn-sm" @click="move(idx, -1)" :disabled="idx === 0">Subir</button>
              <button class="btn btn-ghost btn-sm" @click="move(idx, 1)" :disabled="idx === form.questions.length - 1">Bajar</button>
              <button class="btn btn-danger btn-sm" @click="removeQuestion(idx)">Eliminar</button>
            </div>
          </div>

          <label class="label">Texto de la pregunta</label>
          <input class="input" v-model="q.text" type="text" />

          <div class="row-wrap">
            <label class="label">Tipo</label>
            <select class="input" v-model="q.type">
              <option value="open">Abierta</option>
              <option value="single">Opción única</option>
              <option value="multiple">Opción múltiple</option>
            </select>

            <label class="row" style="gap:6px;">
              <input type="checkbox" v-model="q.required" /> Obligatoria
            </label>
          </div>

          <div v-if="q.type === 'single' || q.type === 'multiple'" class="mt-8">
            <div class="between">
              <strong>Opciones</strong>
              <button class="btn btn-ghost" @click="addOption(q)">Agregar opción</button>
            </div>
            <div v-if="(!q.options || q.options.length === 0)" class="empty-tip">Agrega 2 o más opciones</div>
            <div v-else class="stack-sm">
              <div v-for="(opt, k) in q.options" :key="opt.id" class="option-row">
                <input class="input flex1" v-model="opt.text" type="text" placeholder="Opción" />
                <button class="btn btn-danger btn-sm" @click="removeOption(q, k)">✕</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer class="actions">
        <button class="btn btn-ghost" @click="prev">Atrás</button>
        <button class="btn btn-primary" :disabled="!canNextQuestions" @click="next">Siguiente</button>
      </footer>
    </div>

    <div v-else-if="step === 2" class="card">
      <header class="between">
        <h3 class="title">Vista previa</h3>
        <div>
          <button class="btn btn-ghost mr-8" @click="prev">Volver a editar</button>
          <button class="btn btn-primary" @click="save">Guardar</button>
        </div>
      </header>

      <div class="preview">
        <div class="preview-accent" :style="{ background: form.color || 'var(--primary)' }"></div>
        <div class="pad-12">
          <div class="row-10">
            <img v-if="form.logoDataUrl" :src="form.logoDataUrl" alt="logo" class="preview-logo"/>
            <h2 class="title">{{ form.title }}</h2>
          </div>
          <p class="muted">{{ form.description }}</p>

          <div class="stack mt-8">
            <div v-for="(q, idx) in form.questions" :key="q.id" class="preview-q">
              <strong>{{ idx + 1 }}. {{ q.text }}</strong>
              <span v-if="q.required" class="error ml-6">*</span>
              <div v-if="q.type === 'open'" class="mt-6">
                <input type="text" disabled placeholder="Respuesta abierta" class="input" />
              </div>
              <div v-else-if="q.type === 'single'" class="stack-sm mt-6">
                <label v-for="o in q.options" :key="o.id" class="row" style="gap:6px;">
                  <input type="radio" disabled /> {{ o.text }}
                </label>
              </div>
              <div v-else-if="q.type === 'multiple'" class="stack-sm mt-6">
                <label v-for="o in q.options" :key="o.id" class="row" style="gap:6px;">
                  <input type="checkbox" disabled /> {{ o.text }}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
// styles are loaded globally in main.js
import { reactive, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSurveys } from '@/store/surveys';

const router = useRouter();
const { createSurvey, validateGeneral, validateQuestions, newQuestion, newOption } = useSurveys();

const form = reactive({
  title: '',
  description: '',
  color: '#4f46e5',
  logoDataUrl: '',
  questions: [],
});

const step = ref(0);
const titleError = computed(() => validateGeneral(form).errors.title || '');

const canNextGeneral = computed(() => validateGeneral(form).ok);
const canNextQuestions = computed(() => validateQuestions(form.questions).ok);

function next() { if (step.value < 2) step.value = step.value + 1; }
function prev() { if (step.value > 0) step.value = step.value - 1; }

function goBack() { router.push('/encuestas'); }

function onLogo(ev) {
  const file = ev.target.files?.[0];
  if (!file) return;
  const valid = ['image/png', 'image/jpeg'].includes(file.type) && file.size <= 1024 * 1024;
  if (!valid) {
    alert('Logo inválido. Use PNG/JPG menor a 1MB');
    ev.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => { form.logoDataUrl = String(reader.result || ''); };
  reader.readAsDataURL(file);
}

function addQuestion() {
  form.questions.push(newQuestion());
}
function removeQuestion(index) {
  form.questions.splice(index, 1);
}
function move(index, delta) {
  const to = index + delta;
  if (to < 0 || to >= form.questions.length) return;
  const [q] = form.questions.splice(index, 1);
  form.questions.splice(to, 0, q);
}
function addOption(q) {
  if (!q.options) q.options = [];
  q.options.push(newOption());
}
function removeOption(q, k) {
  q.options.splice(k, 1);
}

function save() {
  const gen = validateGeneral(form);
  const qs = validateQuestions(form.questions);
  if (!gen.ok) { alert('Completa el título'); return; }
  if (!qs.ok) { alert(qs.reason || 'Revisa las preguntas'); return; }
  createSurvey(form);
  alert('Encuesta guardada');
  router.push('/encuestas');
}

function discard() {
  if (confirm('¿Descartar esta encuesta?')) {
    router.push('/encuestas');
  }
}
</script>
