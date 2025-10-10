import { ref } from 'vue';

const STORAGE_KEY = 'surveys';
const RESPONSES_KEY = 'survey_responses';

const surveys = ref(loadFromStorage());
const responses = ref(loadResponsesFromStorage());

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to parse surveys from storage', e);
    return [];
  }
}

function loadResponsesFromStorage() {
  try {
    const raw = localStorage.getItem(RESPONSES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('Failed to parse responses from storage', e);
    return {};
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(surveys.value));
}

function persistResponses() {
  localStorage.setItem(RESPONSES_KEY, JSON.stringify(responses.value));
}

function createSurveyId() {
  return 's_' + Math.random().toString(36).slice(2, 9);
}

function createOptionId() {
  return 'o_' + Math.random().toString(36).slice(2, 9);
}

function createResponseId() {
  return 'r_' + Math.random().toString(36).slice(2, 9);
}

export function useSurveys() {
  function list() {
    return surveys;
  }

  function createSurvey(payload) {
    const survey = {
      id: createSurveyId(),
      title: payload.title?.trim() || '',
      description: payload.description?.trim() || '',
      color: payload.color || '#4f46e5',
      logoDataUrl: payload.logoDataUrl || '',
      questions: Array.isArray(payload.questions) ? payload.questions : [],
      active: true,
      createdAt: new Date().toISOString(),
    };
    surveys.value.unshift(survey);
    persist();
    return survey;
  }

  function removeSurvey(id) {
    const idx = surveys.value.findIndex(s => s.id === id);
    if (idx !== -1) {
      surveys.value.splice(idx, 1);
      persist();
      if (responses.value[id]) {
        delete responses.value[id];
        persistResponses();
      }
      return true;
    }
    return false;
  }

  function getById(id) {
    return surveys.value.find(s => s.id === id) || null;
  }

  function setActive(id, active) {
    const s = getById(id);
    if (!s) return false;
    s.active = Boolean(active);
    persist();
    return true;
  }

  // Validation helpers
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

  // Builders
  function newQuestion() {
    return { id: createSurveyId(), text: '', required: false, type: 'open', options: [] };
  }

  function newOption() {
    return { id: createOptionId(), text: '' };
  }

  // Responses API
  function listResponses(surveyId) {
    const arr = responses.value[surveyId] || [];
    const map = new Map();
    for (const r of arr) { if (!map.has(r.id)) map.set(r.id, r); }
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
    if (missing.length) {
      throw new Error('Faltan respuestas obligatorias: ' + missing.join(', '));
    }
    const record = {
      id: createResponseId(),
      surveyId,
      submittedAt: new Date().toISOString(),
      answers: answersByQuestionId,
    };
    const arr = responses.value[surveyId] || [];
    arr.unshift(record);
    responses.value[surveyId] = arr;
    persistResponses();
    return record;
  }

  return {
    list,
    createSurvey,
    removeSurvey,
    getById,
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

