// Store de respuestas (separado de encuestas)
// - Lista y detalle de respuestas por encuesta (RF10, RF11)
// - Registro de respuesta con validación y estado de encuesta (RF12, RF13)

import { ref } from 'vue';
import { useSurveys } from '@/store/surveysStore';
import {
  listSurveyResponses,
  getSurveyResponseDetail,
  submitSurveyResponse,
} from '@/services/responsesServices';

// Estructura en memoria: { [surveyId]: Array<{ id, surveyId, submittedAt, answers? }> }
const responsesBySurvey = ref({});
const listsLoaded = new Set();

export function useResponses() {
  const { getById } = useSurveys();

  function listResponses(surveyId) {
    ensureListLoaded(surveyId);
    return responsesBySurvey.value[surveyId] || [];
  }

  function getResponse(surveyId, responseId) {
    const list = responsesBySurvey.value[surveyId] || [];
    const item = list.find((r) => String(r.id) === String(responseId)) || null;
    if (item && !item.answers) {
      // cargar detalle perezoso
      void loadResponseDetail(surveyId, responseId);
    }
    if (!item) ensureListLoaded(surveyId);
    return item;
  }

  async function loadList(surveyId) {
    if (!surveyId) return;
    try {
      const data = await listSurveyResponses(surveyId);
      // 1) Intentar extraer items directos
      let items = extractItemsArray(data);
      // 2) Si está agrupado por pregunta (nueva vista), reconstruir por respuesta
      if ((!items || items.length === 0) && isGroupedByQuestionPayload(data)) {
        items = rebuildResponsesFromGrouped(data);
      }
      const survey = getById(surveyId);
      const mapped = items.map((d) => {
        const base = mapResponseListItem(d, surveyId);
        const norm = normalizeAnswers(d?.answers || d?.answers_by_question_id, survey);
        if (norm) base.answers = norm;
        return base;
      });
      if (mapped.length > 0) {
        responsesBySurvey.value[surveyId] = uniqueSorted(mapped);
      } else {
        // si backend devuelve vacio, preserva lo existente
        responsesBySurvey.value[surveyId] = responsesBySurvey.value[surveyId] || [];
      }
      listsLoaded.add(String(surveyId));
    } catch (e) {
      listsLoaded.delete(String(surveyId));
      console.warn('No se pudo cargar la lista de respuestas', e);
    }
  }

  async function loadResponseDetail(surveyId, responseId) {
    try {
      const detail = await getSurveyResponseDetail(surveyId, responseId);
      const survey = getById(surveyId);
      const answers = normalizeAnswers(
        detail?.answers || detail?.answers_by_question_id || detail,
        survey
      );
      const list = responsesBySurvey.value[surveyId] || [];
      const idx = list.findIndex((r) => String(r.id) === String(responseId));
      if (idx !== -1) {
        const updated = { ...list[idx], answers };
        list.splice(idx, 1, updated);
        responsesBySurvey.value[surveyId] = [...list];
      } else {
        const base = mapResponseListItem(detail, surveyId);
        base.answers = answers;
        responsesBySurvey.value[surveyId] = [base, ...list];
      }
    } catch (e) {
      // Si no existe endpoint de detalle, recargar la lista para poblar respuestas desde la vista agrupada
      try { await loadList(surveyId); } catch (err) { /* ignore */ }
    }
  }

  async function submitResponse(surveyId, answersByQuestionId) {
    // RF13: bloquear si la encuesta está cerrada y validar requeridos
    const survey = getById(surveyId);
    if (!survey) throw new Error('Encuesta no encontrada');
    if (!survey.active) throw new Error('La encuesta está cerrada y no acepta respuestas');
    const missing = [];
    for (const q of survey.questions || []) {
      if (!q.required) continue;
      const val = answersByQuestionId[q.id];
      if (q.type === 'open' && (!val || String(val).trim() === '')) missing.push(q.text);
      if (q.type === 'single' && (!val || String(val).trim() === '')) missing.push(q.text);
      if (q.type === 'multiple' && (!Array.isArray(val) || val.length === 0)) missing.push(q.text);
    }
    if (missing.length) throw new Error('Faltan respuestas obligatorias: ' + missing.join(', '));

    // Construir payload en el formato que exige el backend: answers (arreglo)
    const answersPayload = [];
    for (const q of survey.questions || []) {
      const val = answersByQuestionId[q.id];
      if (val == null || (Array.isArray(val) && val.length === 0) || (typeof val === 'string' && !val.trim())) {
        // omitir no respondidas (si no son requeridas)
        continue;
      }
      if (q.type === 'open') {
        // Backend espera value_text para preguntas de texto
        answersPayload.push({ question_id: q.id, value_text: String(val) });
      } else if (q.type === 'single') {
        answersPayload.push({ question_id: q.id, option_id: val });
      } else if (q.type === 'multiple') {
        const arr = Array.isArray(val) ? val : [val];
        answersPayload.push({ question_id: q.id, option_ids: arr });
      }
    }

    const created = await submitSurveyResponse(surveyId, { answers: answersPayload });
    const rec = mapResponseListItem(created, surveyId);
    const answers = normalizeAnswers(created?.answers || created?.answers_by_question_id, survey) || answersByQuestionId;
    if (answers) rec.answers = answers;

    const list = responsesBySurvey.value[surveyId] || [];
    const merged = uniqueSorted([rec, ...list]);
    responsesBySurvey.value[surveyId] = merged;
    try { await loadList(surveyId); } catch (err) { /* ignore refresh error */ }
    return rec;
  }

  function ensureListLoaded(surveyId) {
    if (!surveyId) return;
    const key = String(surveyId);
    if (!listsLoaded.has(key)) void loadList(surveyId);
  }

  function mapResponseListItem(dto, surveyId) {
    let id =
      dto?.response_id ??
      dto?.id ??
      dto?.respuesta_id ??
      dto?.id_respuesta ??
      dto?.uuid ??
      dto?.codigo ??
      null;
    const submittedAt =
      dto?.submitted_at ??
      dto?.created_at ??
      dto?.fecha_envio ??
      dto?.fechaCreacion ??
      dto?.submittedAt ??
      dto?.createdAt ??
      new Date().toISOString();
    if (id == null || id === '') {
      id = 'tmp_' + Math.random().toString(36).slice(2) + '_' + Date.now();
    }
    return { id, surveyId, submittedAt };
  }

  function normalizeAnswers(raw, survey) {
    if (!raw) return null;
    if (raw && !Array.isArray(raw) && typeof raw === 'object') return raw;
    const out = {};
    const questions = Array.isArray(survey?.questions) ? survey.questions : [];
    const byId = new Map(questions.map((q) => [String(q.id), q]));
    const arr = Array.isArray(raw) ? raw : [];
    for (const item of arr) {
      const qid = String(item?.question_id ?? item?.qid ?? '');
      if (!qid) continue;
      const q = byId.get(qid);
      if (!q) continue;
      if (q.type === 'open') {
        out[q.id] = item?.value_text ?? item?.answer_text ?? item?.value ?? item?.text ?? '';
      } else if (q.type === 'single') {
        const val = item?.option_id ?? item?.selected_option_id ?? item?.value ?? item?.answer_value;
        if (val != null) out[q.id] = val;
      } else if (q.type === 'multiple') {
        const vals = item?.option_ids ?? item?.values ?? item?.answer_values;
        if (Array.isArray(vals)) {
          out[q.id] = Array.isArray(out[q.id]) ? out[q.id] : [];
          out[q.id] = Array.from(new Set([...(out[q.id] || []), ...vals]));
        } else if (item?.selected_option_id != null) {
          out[q.id] = Array.isArray(out[q.id]) ? out[q.id] : [];
          if (!out[q.id].includes(item.selected_option_id)) out[q.id].push(item.selected_option_id);
        }
      }
    }
    return out;
  }

  function uniqueSorted(arr) {
    const m = new Map();
    for (const r of arr) {
      const key = String(r.id);
      if (!m.has(key)) m.set(key, r);
    }
    return Array.from(m.values()).sort(
      (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
    );
  }

  function extractItemsArray(payload) {
    // Acepta múltiples formatos comunes de backend
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== 'object') return [];
    const candidates = [
      'items',
      'data',
      'rows',
      'list',
      'results',
      'respuestas',
      'records',
    ];
    for (const key of candidates) {
      const val = payload[key];
      if (Array.isArray(val)) return val;
      if (val && typeof val === 'object' && Array.isArray(val.items)) return val.items;
    }
    return [];
  }

  // Detecta formato agrupado por pregunta
  function isGroupedByQuestionPayload(payload) {
    return (
      payload && typeof payload === 'object' && Array.isArray(payload.questions)
    );
  }

  // Reconstruye una lista de respuestas a partir de un payload agrupado por pregunta
  // Estructura esperada:
  // { questions: [ { question_id, answers: [ { response_id, value_text | selected_option_id | option_ids, submitted_at? } ] } ] }
  function rebuildResponsesFromGrouped(payload) {
    const byResp = new Map();
    const submittedKeyCandidates = ['submitted_at', 'created_at', 'fecha_envio'];
    const questions = Array.isArray(payload?.questions) ? payload.questions : [];
    for (const q of questions) {
      const qid = String(q?.question_id || '');
      const arr = Array.isArray(q?.answers) ? q.answers : [];
      for (const a of arr) {
        const rid = a?.response_id || a?.id || a?.respuesta_id;
        if (!rid) continue;
        const existing = byResp.get(String(rid)) || {
          id: rid,
          submittedAt: null,
          answers: {},
        };
        // submittedAt si existe
        if (!existing.submittedAt) {
          for (const k of submittedKeyCandidates) {
            if (a?.[k]) { existing.submittedAt = a[k]; break; }
          }
        }
        // mapear valor segun tipo de campo presente
        if (Array.isArray(a?.option_ids)) {
          existing.answers[qid] = a.option_ids;
        } else if (a?.selected_option_id != null) {
          existing.answers[qid] = a.selected_option_id;
        } else if (a?.value_text != null) {
          existing.answers[qid] = a.value_text;
        } else if (a?.answer_text != null) {
          existing.answers[qid] = a.answer_text;
        }
        byResp.set(String(rid), existing);
      }
    }
    // map -> array de DTOs compatibles con el mapeo existente
    return Array.from(byResp.values()).map((r) => ({
      id: r.id,
      submitted_at: r.submittedAt || new Date().toISOString(),
      answers_by_question_id: r.answers,
    }));
  }

  return {
    listResponses,
    getResponse,
    submitResponse,
    loadList,
    loadResponseDetail,
  };
}
