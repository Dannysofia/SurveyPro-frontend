Backend integration notes

- Base URL: set `VUE_APP_API_URL` in a `.env` file at project root (Vue CLI). Example:
  - `VUE_APP_API_URL=http://localhost:4000`
- Auth: login via `/auth/login` to get a `token`; it’s auto-applied by `src/api.js` and persisted in `localStorage`.
- Owner: creating surveys requires `owner_id`. The editor now uses the logged-in user (`authStore.user.id`).

Endpoints used

- `GET /encuestas` → list surveys (optionally `?owner_id=ID` if you later want to filter).
- `POST /encuestas` → create survey `{ owner_id, title, description, status }`.
- `PUT /encuestas/:id` → update status `{ status: 'Activo'|'Cerrado' }`.
- `DELETE /encuestas/:id` → delete survey.
- `GET /encuestas/:id/detalle` → survey with questions and options.
- `POST /encuestas/:id/preguntas` → create question `{ type_id, question_text, is_required, help_text, position }`.
- `POST /encuestas/preguntas/:question_id/opciones` → create option `{ option_label, position }`.
- `GET /tipos-pregunta` → load question types and map `type_key` to UI types.

UI mapping

- `status: 'Activo'|'Cerrado'` maps to `active: boolean` in UI.
- `question.type_key` maps to UI `'open'|'single'|'multiple'`.
- Color/logo are UI-only and are not persisted in backend.

Responses

- Responses are still stored locally (localStorage) because the backend doesn’t expose endpoints for responses yet. The store keeps the same API for listing and viewing them.

