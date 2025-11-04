// Store de encuestas (responsable solo de datos de encuesta)
// - Provee creación, listado, detalle, edición general, activación/cierre y eliminación
import { ref } from "vue";
import { fetchQuestionTypes, mapTypeKeyToUi } from "@/services/questionTypes";
import {
  listSurveys,
  getSurveyDetail,
  createSurveyApi,
  updateSurvey,
  deleteSurvey,
  createQuestion,
  createOption,
  updateQuestion,
  deleteQuestion,
  updateOption,
  deleteOption,
} from "@/services/surveysServices";

// Cache de tipos de preguntas
const questionTypeOptions = ref([]);

// Cache reactivo de encuestas
const surveys = ref([]);
let surveysLoaded = false;

// Mapeo DTO -> UI
function mapSurveyDtoToUi(dto) {
  return {
    id: dto.survey_id,
    title: dto.title,
    description: dto.description || "",
    color: dto.color || "#4f46e5",
    active: String(dto.status || "").toLowerCase() === "activo",
    createdAt: dto.created_at,
    questions: [],
  };
}

function mapQuestionDtoToUi(q) {
  return {
    id: q.question_id,
    text: q.question_text,
    required: q.is_required === true,
    // mapear type_key del backend a los tipos usados en la UI
    type: mapTypeKeyToUi(q.type_key),
    options: Array.isArray(q.options)
      ? q.options.map((o) => ({ id: o.option_id, text: o.option_label }))
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
    const title = payload.title?.trim() || "";
    if (!title) throw new Error("Titulo requerido");

    // 1) Crear encuesta
    const created = await createSurveyApi({
      owner_id: ownerId || null,
      title,
      description: payload.description?.trim() || null,
      status: "Activo",
      color: payload.color || "#4f46e5",
    });
    const surveyUi = mapSurveyDtoToUi(created);

    // 2) Tipos para resolver type_id: construimos un mapa UI-key -> type_id
    const types = await fetchQuestionTypes();
    const typeMap = new Map(
      (Array.isArray(types) ? types : []).map((t) => [
        mapTypeKeyToUi(t.type_key),
        t.type_id,
      ])
    );

    // 3) Crear preguntas y opciones
    const questions = Array.isArray(payload.questions) ? payload.questions : [];
    const createdQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const typeId = typeMap.get(String(q.type || "").toLowerCase());
      if (!typeId) throw new Error(`Tipo de pregunta no reconocido: ${q.type}`);

      const qCreated = await createQuestion(created.survey_id, {
        type_id: typeId,
        question_text: q.text?.trim() || "",
        is_required: !!q.required,
        help_text: null,
        position: i,
      });

      if (
        (q.type === "single" || q.type === "multiple") &&
        Array.isArray(q.options)
      ) {
        for (let k = 0; k < q.options.length; k++) {
          const opt = q.options[k];
          if (!opt?.text || !opt.text.trim()) continue;
          await createOption(qCreated.question_id, {
            option_label: opt.text.trim(),
            position: k,
          });
        }
      }
      createdQuestions.push(qCreated);
    }

    surveyUi.questions = createdQuestions.map((q) =>
      mapQuestionDtoToUi({ ...q, options: [] })
    );
    surveys.value.unshift(surveyUi);
    return surveyUi;
  }

  async function removeSurvey(id) {
    // Elimina la encuesta en el servidor y actualiza la cache local.
    await deleteSurvey(id);
    const idx = surveys.value.findIndex((s) => s.id === id);
    if (idx !== -1) surveys.value.splice(idx, 1);
    return true;
  }

  // carga detalle de encuesta; opcionalmente forzar recarga desde backend
  async function getByIdAsync(id, { force = false } = {}) {
    //await ensureLoaded();
    const found = surveys.value.find((s) => s.id === id);
    // Si ya tenemos preguntas y no pedimos forzar, devolvemos el caché
    if (
      !force &&
      found &&
      Array.isArray(found.questions) &&
      found.questions.length > 0
    )
      return found;
    const data = await getSurveyDetail(id);
    const mapped = mapSurveyDtoToUi(data);
    mapped.questions = Array.isArray(data.questions)
      ? data.questions.map(mapQuestionDtoToUi)
      : [];
    const idx = surveys.value.findIndex((s) => s.id === id);
    if (idx === -1) surveys.value.push(mapped);
    else surveys.value[idx] = mapped;
    return mapped;
  }

  function getById(id) {
    return surveys.value.find((s) => s.id === id) || null;
  }

  async function setActive(id, active) {
    const status = active ? "Activo" : "Cerrado";
    const updated = await updateSurvey(id, { status });
    const idx = surveys.value.findIndex((s) => s.id === id);
    if (idx !== -1) {
      surveys.value[idx] = {
        ...surveys.value[idx],
        active,
        title: updated.title,
        description: updated.description,
      };
    }
    return true;
  }

  // Preguntas / Opciones - actualizaciones y eliminaciones (mantener caché)
  async function updateQuestionAsync(questionId, payload) {
    const updated = await updateQuestion(questionId, payload);
    const qUi = mapQuestionDtoToUi({
      ...updated,
      options: updated.options || [],
    });
    // actualizar en la cache
    for (const s of surveys.value) {
      if (!Array.isArray(s.questions)) continue;
      const idx = s.questions.findIndex(
        (q) => String(q.id) === String(questionId)
      );
      if (idx !== -1) {
        s.questions.splice(idx, 1, qUi);
        break;
      }
    }
    return qUi;
  }

  async function deleteQuestionAsync(questionId) {
    await deleteQuestion(questionId);
    for (const s of surveys.value) {
      if (!Array.isArray(s.questions)) continue;
      const idx = s.questions.findIndex(
        (q) => String(q.id) === String(questionId)
      );
      if (idx !== -1) {
        s.questions.splice(idx, 1);
        break;
      }
    }
    return true;
  }

  async function updateOptionAsync(optionId, payload) {
    const updated = await updateOption(optionId, payload);
    // updated should contain option_id and option_label
    for (const s of surveys.value) {
      if (!Array.isArray(s.questions)) continue;
      for (const q of s.questions) {
        if (!Array.isArray(q.options)) continue;
        const idx = q.options.findIndex(
          (o) => String(o.id) === String(optionId)
        );
        if (idx !== -1) {
          q.options.splice(idx, 1, {
            id: updated.option_id,
            text: updated.option_label,
          });
          return { id: updated.option_id, text: updated.option_label };
        }
      }
    }
    return null;
  }

  async function deleteOptionAsync(optionId) {
    await deleteOption(optionId);
    for (const s of surveys.value) {
      if (!Array.isArray(s.questions)) continue;
      for (const q of s.questions) {
        if (!Array.isArray(q.options)) continue;
        const idx = q.options.findIndex(
          (o) => String(o.id) === String(optionId)
        );
        if (idx !== -1) {
          q.options.splice(idx, 1);
          return true;
        }
      }
    }
    return true;
  }

  // Actualiza datos generales de la encuesta (título, descripción, color, status opcional)
  async function updateGeneral(id, payload) {
    const body = {
      title: payload.title ?? undefined,
      description: payload.description ?? undefined,
      color: payload.color ?? undefined,
      status: payload.status ?? undefined,
    };
    const updated = await updateSurvey(id, body);
    const idx = surveys.value.findIndex((s) => s.id === id);
    if (idx !== -1) {
      surveys.value[idx] = {
        ...surveys.value[idx],
        title: updated.title ?? surveys.value[idx].title,
        description: updated.description ?? surveys.value[idx].description,
        color: updated.color ?? surveys.value[idx].color,
        active:
          typeof updated.status === "string"
            ? String(updated.status).toLowerCase() === "activo"
            : surveys.value[idx].active,
      };
    }
    return surveys.value[idx] || null;
  }

  // Validaciones UI
  function validateGeneral({ title }) {
    const hasTitle = Boolean(title && title.trim().length > 0);
    return {
      ok: hasTitle,
      errors: { title: !hasTitle ? "Titulo requerido" : "" },
    };
  }

  function validateQuestions(questions) {
    if (!Array.isArray(questions) || questions.length === 0)
      return { ok: false, reason: "Debe existir al menos una pregunta" };
    for (const q of questions) {
      if (!q.text || !q.text.trim())
        return { ok: false, reason: "Texto de pregunta vacio" };
      if (q.type === "single" || q.type === "multiple") {
        if (!Array.isArray(q.options) || q.options.length < 2)
          return {
            ok: false,
            reason: "Preguntas cerradas requieren minimo 2 opciones",
          };
        if (q.options.some((o) => !o.text || !o.text.trim()))
          return { ok: false, reason: "Opciones no pueden estar vacias" };
      }
    }
    return { ok: true };
  }

  // Builders UI
  function newQuestion() {
    return {
      id: createQuestionId(),
      text: "",
      required: false,
      type: "open",
      options: [],
    };
  }
  function newOption() {
    return { id: createOptionId(), text: "" };
  }

  // Funciones de manejo de preguntas y opciones en el formulario
  function addQuestion(form) {
    form.questions.push(newQuestion());
  }

  function removeQuestion(form, index) {
    form.questions.splice(index, 1);
  }

  function moveQuestion(form, index, delta) {
    const to = index + delta;
    if (to < 0 || to >= form.questions.length) return;
    const [q] = form.questions.splice(index, 1);
    form.questions.splice(to, 0, q);
  }

  function addOption(question) {
    if (!question.options) question.options = [];
    question.options.push(newOption());
  }

  function removeOption(question, optionIndex) {
    question.options.splice(optionIndex, 1);
  }

  // Cargar tipos de preguntas (usado por create/edit)
  async function loadQuestionTypes() {
    try {
      const types = await fetchQuestionTypes();
      const mapped = Array.isArray(types)
        ? types.map((t) => ({
          key: mapTypeKeyToUi(t.type_key),
          label: t.label,
        }))
        : [];
      const seen = new Set();
      questionTypeOptions.value = mapped.filter((t) => {
        if (seen.has(t.key)) return false;
        seen.add(t.key);
        return true;
      });
    } catch (e) {
      questionTypeOptions.value = [
        { key: "open", label: "Abierta" },
        { key: "single", label: "Opción única" },
        { key: "multiple", label: "Opción múltiple" },
      ];
    }
    return questionTypeOptions;
  }

  // Guardar cambios de edición
  async function saveSurveyEdit(surveyId, form, original) {
    const gen = validateGeneral(form);
    const qs = validateQuestions(form.questions);
    if (!gen.ok) throw new Error("Completa el título");
    if (!qs.ok) throw new Error(qs.reason || "Revisa las preguntas");

    // 1) actualizar datos generales
    await updateGeneral(surveyId, {
      title: form.title,
      description: form.description,
      color: form.color,
    });

    // 2) resolver tipos
    const types = await fetchQuestionTypes();
    const typeMap = new Map(
      (Array.isArray(types) ? types : []).map((t) => [
        mapTypeKeyToUi(t.type_key),
        t.type_id,
      ])
    );

    // 3) comparar original vs nuevo
    const orig = Array.isArray(original?.questions) ? original.questions : [];
    const origById = new Map(orig.map((x) => [String(x.id), x]));
    const newById = new Map(form.questions.map((x) => [String(x.id), x]));

    // a) eliminar preguntas que ya no existen
    for (const o of orig) {
      if (!newById.has(String(o.id))) {
        await deleteQuestion(o.id);
      }
    }

    // b) recorrer preguntas nuevas/actuales
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      const typeId = typeMap.get(String(q.type || "").toLowerCase());
      if (!typeId) throw new Error(`Tipo de pregunta no reconocido: ${q.type}`);

      if (String(q.id).startsWith("q_")) {
        // crear pregunta nueva
        const createdQ = await createQuestion(surveyId, {
          type_id: typeId,
          question_text: q.text?.trim() || "",
          is_required: !!q.required,
          help_text: null,
          position: i,
        });

        // crear opciones si aplica
        if (
          (q.type === "single" || q.type === "multiple") &&
          Array.isArray(q.options)
        ) {
          for (let k = 0; k < q.options.length; k++) {
            const opt = q.options[k];
            if (!opt?.text || !opt.text.trim()) continue;
            await createOption(createdQ.question_id, {
              option_label: opt.text.trim(),
              position: k,
            });
          }
        }
      } else {
        // actualizar pregunta existente
        await updateQuestion(q.id, {
          type_id: typeId,
          question_text: q.text?.trim() || "",
          is_required: !!q.required,
          help_text: null,
          position: i,
        });

        // opciones: comparar y sincronizar
        const origQ = origById.get(String(q.id));
        const origOpts = Array.isArray(origQ?.options) ? origQ.options : [];
        const newOptById = new Map(
          (q.options || []).map((o) => [String(o.id), o])
        );

        // eliminar opciones borradas
        for (const oo of origOpts) {
          if (!newOptById.has(String(oo.id))) {
            await deleteOption(oo.id);
          }
        }

        // crear/actualizar opciones
        if (Array.isArray(q.options)) {
          for (let k = 0; k < q.options.length; k++) {
            const opt = q.options[k];
            if (String(opt.id).startsWith("o_")) {
              if (!opt?.text || !opt.text.trim()) continue;
              await createOption(q.id, {
                option_label: opt.text.trim(),
                position: k,
              });
            } else {
              await updateOption(opt.id, {
                option_label: opt.text?.trim() || "",
                position: k,
              });
            }
          }
        }
      }
    }

    // 4) refrescar detalle en el store
    await getByIdAsync(surveyId, { force: true });

    // 5) notificar otras vistas
    if (typeof window !== "undefined" && window.dispatchEvent) {
      try {
        window.dispatchEvent(
          new CustomEvent("survey-updated", { detail: { id: surveyId } })
        );
      } catch (e) {
        /* ignore in environments without DOM */
      }
    }
  }

  return {
    list,
    createSurvey,
    getById,
    getByIdAsync,
    setActive,
    updateGeneral,
    updateQuestionAsync,
    deleteQuestionAsync,
    updateOptionAsync,
    deleteOptionAsync,
    validateGeneral,
    validateQuestions,
    newQuestion,
    newOption,
    removeSurvey,
    addQuestion,
    removeQuestion,
    moveQuestion,
    addOption,
    removeOption,
    loadQuestionTypes,
    saveSurveyEdit,
    questionTypeOptions,
    reset,
  };
}
function reset() {
  surveys.value = [];
  surveysLoaded = false;
}
function createOptionId() {
  return "o_" + Math.random().toString(36).slice(2, 9);
}
function createQuestionId() {
  return "q_" + Math.random().toString(36).slice(2, 9);
}
