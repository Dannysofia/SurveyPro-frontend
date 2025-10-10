import { ref } from 'vue';

const STORAGE_KEY = 'surveys';

const surveys = ref(loadFromStorage());

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to parse surveys from storage', e);
    return [];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(surveys.value));
}

function createSurveyId() {
  return 's_' + Math.random().toString(36).slice(2, 9);
}

function createOptionId() {
  return 'o_' + Math.random().toString(36).slice(2, 9);
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
      return true;
    }
    return false;
  }

  function getById(id) {
    return surveys.value.find(s => s.id === id) || null;
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

  return {
    list,
    createSurvey,
    removeSurvey,
    getById,
    validateGeneral,
    validateQuestions,
    newQuestion,
    newOption,
  };
}

