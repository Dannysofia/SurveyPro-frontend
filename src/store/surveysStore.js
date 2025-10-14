// Store de encuestas basado en servicios HTTP.
// Responsabilidad: cache/estado, validaciones UI y mapeo DTO -> UI.
// Nota: las respuestas aún viven en localStorage (sección al final) hasta que
// el backend exponga endpoints para persistirlas.

import { ref } from 'vue';
import { fetchQuestionTypes, getTypeIdByKeyMap, mapTypeKeyToUi } from '@/services/questionTypes';
import {
  listSurveys,
  getSurveyDetail,
  createSurveyApi,
  updateSurvey,
  deleteSurvey,
  createQuestion,
  createOption,
} from '@/services/surveysServices';

// Cache de encuestas para UI
const surveys = ref([]);
let surveysLoaded = false;

// Mapeos DTO -> UI
function mapSurveyDtoToUi(dto) {
  return {
    id: dto.survey_id,
    title: dto.title,
    description: dto.description || '',
    color: '#4f46e5',
    logoDataUrl: '',
    active: String(dto.status || '').toLowerCase() === 'activo',
    createdAt: dto.created_at,
    questions: [],
  };
}

function mapQuestionDtoToUi(q) {
  return {
    id: q.question_id,
    text: q.question_text,
    required: q.is_required === true,
    type: mapTypeKeyToUi(q.type_key),
    options: Array.isArray(q.options)
      ? q.options.map(o => ({ id: o.option_id, text: o.option_label }))
      : [],
  };
}

async function ensureLoaded() {
  if (surveysLoaded) return;
  try {
    const data = await listSurveys();
    const arr = Array.isArray(data) ? data : [];
    surveys.value = arr.map(mapSurveyDtoToUi);
  } finally {
    surveysLoaded = true;
  }
}

export function useSurveys() {
  function list() {
    ensureLoaded();
    return surveys;
  }

  async function createSurvey(payload, { ownerId } = {}) {
    const title = payload.title?.trim() || '';
    if (!title) throw new Error('Título requerido');

    // 1) Crear encuesta básica
    const created = await createSurveyApi({
      owner_id: ownerId || null,
      title,
      description: payload.description?.trim() || null,
      status: 'Activo',
    });
    const surveyUi = mapSurveyDtoToUi(created);

    // 2) Tipos para resolver type_id
    await fetchQuestionTypes();
    const typeMap = await getTypeIdByKeyMap();

    // 3) Crear preguntas y opciones en backend
    const questions = Array.isArray(payload.questions) ? payload.questions : [];
    const createdQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const typeId = typeMap.get(String(q.type || '').toLowerCase());
      if (!typeId) throw new Error(`Tipo de pregunta no reconocido: ${q.type}`);

      const qCreated = await createQuestion(created.survey_id, {
        type_id: typeId,
        question_text: q.text?.trim() || '',
        is_required: !!q.required,
        help_text: null,
        position: i,
      });

      if ((q.type === 'single' || q.type === 'multiple') && Array.isArray(q.options)) {
        for (let k = 0; k < q.options.length; k++) {
          const opt = q.options[k];
          if (!opt?.text || !opt.text.trim()) continue;
          await createOption(qCreated.question_id, { option_label: opt.text.trim(), position: k });
        }
      }
      createdQuestions.push(qCreated);
    }

    surveyUi.questions = createdQuestions.map(q => mapQuestionDtoToUi({ ...q, options: [] }));
    surveys.value.unshift(surveyUi);
    return surveyUi;
  }

  async function removeSurvey(id) {
    await deleteSurvey(id);
    const idx = surveys.value.findIndex(s => s.id === id);
    if (idx !== -1) surveys.value.splice(idx, 1);
    if (responses.value[id]) { delete responses.value[id]; persistResponses(); }
    return true;
  }

  async function getByIdAsync(id) {
    await ensureLoaded();
    const found = surveys.value.find(s => s.id === id);
    if (found && Array.isArray(found.questions) && found.questions.length > 0) return found;
    const data = await getSurveyDetail(id);
    const mapped = mapSurveyDtoToUi(data);
    mapped.questions = Array.isArray(data.questions) ? data.questions.map(mapQuestionDtoToUi) : [];
    const idx = surveys.value.findIndex(s => s.id === id);
    if (idx === -1) surveys.value.push(mapped); else surveys.value[idx] = mapped;
    return mapped;
  }

  function getById(id) {
    return surveys.value.find(s => s.id === id) || null;
  }

  async function setActive(id, active) {
    const status = active ? 'Activo' : 'Cerrado';
    const updated = await updateSurvey(id, { status });
    const idx = surveys.value.findIndex(s => s.id === id);
    if (idx !== -1) {
      surveys.value[idx] = { ...surveys.value[idx], active, title: updated.title, description: updated.description };
    }
    return true;
  }

  // Validaciones UI
  function validateGeneral({ title, logoDataUrl }) {
    const hasTitle = Boolean(title && title.trim().length > 0);
    const logoOk = typeof logoDataUrl === 'string' || logoDataUrl === '';
    return { ok: hasTitle && logoOk, errors: { title: !hasTitle ? 'Título requerido' : '' } };
  }

  function validateQuestions(questions) {
    if (!Array.isArray(questions) || questions.length === 0) {
      return { ok: false, reason: 'Debe existir al menos una pregunta' };
    }
    for (const q of questions) {
      if (!q.text || !q.text.trim()) return { ok: false, reason: 'Texto de pregunta vacío' };
      if (q.type === 'single' || q.type === 'multiple') {
        if (!Array.isArray(q.options) || q.options.length < 2) {
          return { ok: false, reason: 'Preguntas cerradas requieren mínimo 2 opciones' };
        }
        if (q.options.some(o => !o.text || !o.text.trim())) {
          return { ok: false, reason: 'Opciones no pueden estar vacías' };
        }
      }
    }
    return { ok: true };
  }

  // Builders UI
  function newQuestion() { return { id: createQuestionId(), text: '', required: false, type: 'open', options: [] }; }
  function newOption() { return { id: createOptionId(), text: '' }; }

  // Responses API (LocalStorage) — se mantiene aquí hasta que el backend tenga endpoints
  function listResponses(surveyId) {
    const arr = responses.value[surveyId] || [];
    const map = new Map(); for (const r of arr) { if (!map.has(r.id)) map.set(r.id, r); }
    const unique = Array.from(map.values());
    return unique.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }

  function getResponse(surveyId, responseId) {
    return (responses.value[surveyId] || []).find(r => r.id === responseId) || null;
  }

  function submitResponse(surveyId, answersByQuestionId) {
    const s = getById(surveyId);
    if (!s) throw new Error('Encuesta no encontrada');
    if (!s.active) throw new Error('La encuesta está cerrada y no acepta respuestas');
    const missing = [];
    for (const q of s.questions || []) {
      if (!q.required) continue;
      const val = answersByQuestionId[q.id];
      if (q.type === 'open' && (!val || String(val).trim() === '')) missing.push(q.text);
      if (q.type === 'single' && (!val || String(val).trim() === '')) missing.push(q.text);
      if (q.type === 'multiple' && (!Array.isArray(val) || val.length === 0)) missing.push(q.text);
    }
    if (missing.length) throw new Error('Faltan respuestas obligatorias: ' + missing.join(', '));
    const record = { id: createResponseId(), surveyId, submittedAt: new Date().toISOString(), answers: answersByQuestionId };
    const arr = responses.value[surveyId] || []; arr.unshift(record);
    responses.value[surveyId] = arr; persistResponses();
    return record;
  }

  return {
    list,
    createSurvey,
    removeSurvey,
    getById,
    getByIdAsync,
    setActive,
    validateGeneral,
    validateQuestions,
    newQuestion,
    newOption,
    // responses
    listResponses,
    getResponse,
    submitResponse,
  };
}

// =========================
// Respuestas (LocalStorage)
// =========================
const RESPONSES_KEY = 'survey_responses';
const responses = ref(loadResponsesFromStorage());

function loadResponsesFromStorage() {
  try { const raw = localStorage.getItem(RESPONSES_KEY); return raw ? JSON.parse(raw) : {}; }
  catch (e) { console.warn('Failed to parse responses from storage', e); return {}; }
}

function persistResponses() { localStorage.setItem(RESPONSES_KEY, JSON.stringify(responses.value)); }

function createResponseId() { return 'r_' + Math.random().toString(36).slice(2, 9); }
function createOptionId() { return 'o_' + Math.random().toString(36).slice(2, 9); }
function createQuestionId() { return 'q_' + Math.random().toString(36).slice(2, 9); }

