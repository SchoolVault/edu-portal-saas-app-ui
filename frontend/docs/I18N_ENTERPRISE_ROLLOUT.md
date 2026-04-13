# Enterprise i18n rollout (SchoolVault)

## Principles

1. **UI language only** — Translate labels, buttons, validation, system empty states, chart legends, and table headers. **Do not** translate person names, emails, free-text messages, announcement titles, chat previews, or other **PII / user-authored** content from the API or mocks.
2. **Single source per locale** — `src/assets/i18n/{en,hi}.json`. Add a namespace per feature: `dashboard.*`, `fees.*`, `payroll.*`, …
3. **Validators return keys** — Pure functions return ngx-translate keys (and optional params). Templates use `{{ key | translate }}` or `{{ key | translate: params }}`.
4. **Stable codes from API** — JSON carries enum **names**, not localized labels (`PENDING`, `FULL_DAY`, `ANNUAL`, `OTHER`, …). The UI maps them with small `core/<feature>/` helpers to nested keys (e.g. `leave.status.PENDING`, `leave.dayUnit.FULL_DAY`, `leave.type.ANNUAL`). If a key is missing, show the raw code. **Leave reference:** `leave-api.contract.ts` / `leave-api.error.ts` ↔ `Enums` (`LeaveStatus`, `LeaveDayUnit`, `LeaveTypeCode`) and `LeaveDTOs` OpenAPI hints.
5. **Charts** — Build dataset labels with `TranslateService.instant(...)` and **rebuild** charts on `translate.onLangChange` (Chart.js does not auto-update labels).
6. **Backend error codes** — `ApiResponse.errorCode` carries stable enums (e.g. `LEAVE_OTHER_REASON_REQUIRED`). UI maps them to translate keys with small resolvers (see `leave-api.error.ts`). Human `message` remains for logs and fallback display.

## Rollout order (aligned with sidebar)

| Phase | Module / route | Roles | Status |
|------|----------------|-------|--------|
| Shell | `nav.*`, `header.*` | All | Done |
| Auth | `login.*`, `signup.*` | Public | Done |
| 1 | `dashboard.*` | admin, teacher, parent | Done |
| 2 | `academic.*` | admin, teacher | Done |
| 3 | `students.*`, `teachers.*`, `directory.*` | admin (+ teacher) | Done |
| 4 | `attendance.*`, `timetable.*`, `exams.*` | mixed | Done (`timetable` class labels via `schoolClassName` pipe + `school-class-display`; `exams.*` wired) |
| 5 | `fees.*`, `payroll.*` | admin | Done |
| 6 | `inbox.*` (announcements UI), `chat.*`, `leave.*` | mixed | Done |
| 7 | `reports.*` | admin | Done |
| 8 | `operations.*`, `importExport.*`, `transport.*`, `library.*`, `hostel.*` | admin | Done |
| 9 | `documents.*`, `audit.*` | admin | Done |
| 10 | `settings.*`, `prefs.*` | mixed | Done |
| 11 | Platform suite | `platform.*` | super_admin | Pending |
| 12 | `parent.*` deep screens | parent | Done |

## Per-module checklist

**Dashboard (phase 1):** namespace, `TranslateModule`, KPI/admission insight keys, Chart.js labels via `instant` + `onLangChange` rebuild, API-sourced activity/event text left untranslated — complete.

**Academic, students, teachers, directory (phases 2–3):** `academic.*`, `students.*`, `teachers.*`, `directory.*` in `en.json` / `hi.json`; confirm dialogs use `TranslateService.instant`; enum/status/fee labels mapped via keys; names, class names, API notes (`promotionPreview.sectionPlacementNote`, directory subtitles, etc.) left as-is; teacher homeroom lines rebuild on `onLangChange`.

**Attendance & timetable (phase 4, first slice):** `attendance.*` and `timetable.*` namespaces; `TranslateModule` + `onLangChange` + `markForCheck` for dynamic labels (`save` button states, weekday labels from API English values); confirm dialogs use `TranslateService.instant`; student/teacher names, subjects, rooms, cover `reason`, and API error messages (when present) stay untranslated. **Class dropdowns** use the shared `schoolClassName` pipe (`formatSchoolClassDisplayName`) so “Class N” / pre-primary patterns localize when the app language is Hindi.

**Exams (phase 4):** `exams.*` in locale files; component uses `TranslateService` + `SchoolClassNamePipe` for class pickers and summaries; user-authored exam titles and API text unchanged.

**Fees & payroll (phase 5):** `fees.*` and `payroll.*` namespaces; tabs, modals, bulk flows, and status mappers use keys; fee structure class lines use `schoolClassName`; staff names and amounts stay data-driven where appropriate.

**Inbox (announcements), chat, leave (phase 6):** Route `/app/inbox` uses `CommunicationComponent` with `inbox.*` keys; announcement **titles/bodies** and author names from API stay as-is. **`chat.*`** covers shell chrome, directory hints, empty states, and system fallbacks; **message bodies, display names, previews, and directory subtitles** from API stay untranslated. **`leave.*`** — form chrome + nested `leave.status|dayUnit|type`; persisted **leave type** includes `OTHER` with **minimum reason length** enforced in Spring (`MIN_REASON_LENGTH_FOR_OTHER`) and the UI (`LEAVE_OTHER_REASON_MIN_LEN`); API returns `LEAVE_OTHER_REASON_REQUIRED` when invalid. **Approver remarks** stay free text. `LeaveService` applies `normalizeLeaveRequestRow` for mocks and live API. Hindi: shortened `fees.bulkWhatTitle` for natural tone.

- [ ] Namespace added to `en.json` / `hi.json`
- [ ] `TranslateModule` imported in standalone component(s)
- [ ] No translation of name / email / message / title fields from API
- [ ] Validation keys + Hindi strings
- [ ] Charts / dynamic labels hooked to `onLangChange` if applicable
- [ ] `ng build` clean

## Mock → real API

Keep DTO shapes identical; only the `if (useMocks)` branch swaps data source. UI should not depend on mock-only fields without a shared interface.
