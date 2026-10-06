# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build (outputs to dist/)
npm run preview   # Preview production build locally
npm run lint      # ESLint (flat config, react-hooks rules)
```

No test runner is configured. `src/utils/mathExpr.js` and `src/utils/mathRenderer.jsx` are pure
modules and are the first candidates for unit tests (Vitest).

## Architecture

React 19 + Vite 7 + Tailwind CSS v4 SPA. Internal admin tool: educators build math exercises
(LaTeX, dynamic `@variables`, live preview) and publish them to the Novlearn platform.

### Data flow

- **Exercises** are read/written through the **Novlearn HTTP API** (`src/utils/publishUtils.js`,
  `VITE_NOVLEARN_API_URL`, write operations need the `x-admin-secret` header). The app does NOT
  talk to the `exercises` table directly.
- **Chapters / competences** are read from Supabase with the anon client (`src/supabaseClient.js`,
  cached 1h in `src/constants/index.js`) and written by `src/pages/TaxonomyManager.jsx` with the
  service-role client (`src/supabaseAdmin.js`). The service key is shipped in the browser bundle:
  this app must stay internal (see README "Sécurité").

### Exercise structure

```js
{
  id, title, appTitle, chapter, difficulty, competences: [], Is_Flash, Need_Calculator,
  variables: [{ id, name, type: 'integer'|'decimal'|'choice'|'computed', min, max, exclusions, decimals, choices, expression }
              | { id, type: 'doublet'|'triplet', mode: 'choice'|'perfect_square', names: [], choices, min, max, exclusions }],
  elements:  [{ id, type, content }]
}
```

On publish, the metadata columns are extracted and everything else (`variables`, `elements`) goes
into the `content` JSON column (`META_KEYS` in `publishUtils.js`). `normalizeExercise()` in
`src/hooks/useExercises.js` is the single place that repairs exercises loaded from the API.

### Element system

Every element type has three parts, all keyed by the same `type` string:

1. An editor in `src/editors/` (props: `content`, `onUpdate(newContent)`)
2. A renderer in `src/renderers/` (props: `content`, `variables` = generated values)
3. A default template in `src/utils/defaultContent.js` (mandatory: editors assume the shape)

Dispatch: `src/editors/ElementEditor.jsx` (switch) and `src/renderers/ElementRenderer.jsx`
(`RENDERERS` map). Types: text, equation, graph, question, mcq, signTable, variationTable,
statsTable, probaTree, vector, complexPlane, discreteGraph.

Editors must update immutably (`onUpdate({ ...content, field })`) and tolerate missing fields
(`safeContent` pattern). State updates in hooks use functional `setState`.

### Variable & math pipeline

- Syntax in content: `@a` (NOT `{a}`), `@@` for a literal `@`. LaTeX inline `$...$`, block `$$...$$`.
- `src/hooks/useVariables.js` → `generateRandomValues()` → `generatedValues` (`{ a: 3, b: -2 }`).
- `src/utils/mathRenderer.jsx` — `MathText` splits text/LaTeX segments, substitutes variables
  (sign-aware: `+ @b` with b=-2 → `- 2`), simplifies math segments only (`1x`→`x`, `0x`→ dropped),
  renders with KaTeX.
- `src/utils/evaluateExpression.js` — plain string substitution (negative values parenthesized).
- `src/utils/mathExpr.js` — safe expression evaluator (no `eval`/`new Function`): tokenizer +
  recursive-descent parser, LaTeX preprocessing (`\frac`, `\sqrt`, `\pi`...), implicit
  multiplication, `^`. Used by graph, discrete graph, vector and complex-plane renderers
  (`compileExpression`, `evalMath`).
- `src/utils/mathmodules.js` — helper functions (`root1`, `pgcd`, `solve`...) available in
  *computed* variables; these are evaluated with `new Function` (author-trusted input).

### Key files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Root layout, edit/preview toggle, taxonomy page toggle |
| `src/hooks/useExercises.js` | Current exercise state, element CRUD, `normalizeExercise` |
| `src/hooks/useVariables.js` | Variable CRUD + regeneration of values |
| `src/components/Header.jsx` | Publish / load / preview buttons |
| `src/components/ImportModal.jsx` | List, load, duplicate, delete exercises (Novlearn API) |
| `src/components/ExerciseInfo.jsx` | Titles, flags, chapter, competences |
| `src/utils/publishUtils.js` | Novlearn API client |
| `src/constants/index.js` | Taxonomy fetch + cache, `difficulties`, `elementTypes` |
| `src/styles/index.css` | Tailwind import + a few global rules |

### Adding a new element type

1. Add the default content in `src/utils/defaultContent.js`
2. Create `src/editors/MyTypeEditor.jsx` and register it in `ElementEditor.jsx`
3. Create `src/renderers/MyTypeRenderer.jsx` (use `MathText` for any text; `evalMath` for numbers)
   and register it in the `RENDERERS` map of `ElementRenderer.jsx`
4. Add the type to `elementTypes` in `src/constants/index.js`
5. The Novlearn student app has its own copy of the renderers: port the renderer there too.

### Environment

`.env` (git-ignored, see `.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
`VITE_SUPABASE_SERVICE_KEY`, `VITE_NOVLEARN_API_URL`, `VITE_ADMIN_SECRET`.
