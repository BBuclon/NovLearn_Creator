# NovLearn Creator — Architecture Audit

Date : **6 octobre 2026**. Rapport en français. Mission : sauvegarder et auditer ; aucune migration, refonte fonctionnelle ou modification de base.

## 1. Executive summary

NovLearn Creator est une SPA interne **React 19 / JSX, Vite 7 et Tailwind 4**, dédiée à la composition d'exercices mathématiques. La séparation éditeurs/renderers/hooks/utilitaires est une base réutilisable. La principale difficulté de refonte concerne les contrats de données et la sécurité, plus que la syntaxe TSX.

Les exercices passent par une API HTTP NovLearn ; chapitres et compétences sont directement lus et administrés dans Supabase. Creator n'a ni connexion utilisateur, ni brouillon persistant, ni validation complète avant publication.

Constats prioritaires :

1. **Critique : secrets privilégiés dans le navigateur.** `VITE_SUPABASE_SERVICE_KEY` et `VITE_ADMIN_SECRET` sont intégrés au bundle. Réserver l'outil à l'équipe ne limite pas les droits de ces clés au besoin métier.
2. **Haute : contrats Creator/élève divergents.** La comparaison du dépôt voisin confirme des écarts de types d'éléments, tableaux, exclusions, flags et fonctions calculées.
3. **Haute : intégrité de la taxonomie.** Creator associe les exercices à des noms ; les domaines externes utilisent des IDs. Renommer/supprimer peut affecter exercices et progression. Les opérations actuelles ne sont pas transactionnelles.
4. **Haute : validation et moteur mathématique fragiles.** Des sondes reproduisent une formule modifiée, une valeur interdite, un computed manquant et des exceptions.
5. **Haute : aucune suite automatisée dans Creator.** Lint et build passent ; ils ne vérifient pas la conservation du JSON ou la compatibilité élève.

**Orientation proposée : reconstruction frontend TSX contrôlée par domaines**, livrée progressivement, avec Supabase, IDs et contrats conservés par des adaptateurs explicites. Mutualiser les schémas/comportements mathématiques après caractérisation ; déplacer les opérations privilégiées derrière l'identité et l'autorisation serveur NovLearn. Ne pas combiner ces changements avec une transformation des données de production.

### Périmètre et preuves

- Creator : inventaire du dépôt, lecture des 48 modules JS/JSX, documentation et configuration ; graphe d'imports locaux ; Git, lint, build, audit des packages et sondes en mémoire.
- Référence : sauvegarde **`b24a4a3`** sur `main`.
- Principal disponible : `../Novlearn`, HEAD **`5160aaa`**. Comparaison ciblée en lecture seule des types, route exercices, loader, renderers, générateur, service/store taxonomie, migrations et configurations. `AGENTS.md` et `suite.md` y sont déjà non suivis ; aucun changement effectué dans ce dépôt.
- **Aucun appel métier à Supabase ou à l'API NovLearn** pendant l'audit. Seuls le registre npm et des documents officiels publics ont été interrogés.
- Le SQL du principal décrit un schéma déclaré, **pas le schéma réellement appliqué**. Policies/grants, migrations appliquées, buckets, vues, triggers et données live non inspectés.
- UX : examen statique ; pas de validation visuelle ni de parcours réel navigateur. Ceci n'est pas un audit complet d'accessibilité.

### Sauvegarde Git préalable

`git status`, `git diff`, `git diff --staged` ont été examinés avant analyse approfondie. Initialement : **43 fichiers modifiés non indexés, 3 suppressions indexées, 3 suppressions non indexées, 4 non suivis**, soit 53 chemins ; `main` alignée sur `origin/main`, HEAD `725c850`.

- Changements préexistants sauvegardés sans correction : composants, hooks, calcul/rendu, taxonomie, styles, documentation, manifeste/lock et config.
- Nouveaux fichiers versionnés : `.env.example`, `AGENTS.md`, `eslint.config.js`, `src/utils/mathExpr.js` ; le template d'environnement contient des placeholders.
- Suppressions préexistantes conservées : `README`, `src/hooks/useCorrection.js`, `src/utils/exportUtils.js`, `src/styles/base.css`, `src/styles/components.css`, `src/styles/utilities.css`.
- Seul ajout de l'auditeur avant sauvegarde : `.gitignore` protège `.env.*`, sauf `.env.example`, caches Vite, couverture, logs et fichiers temporaires courants.
- `.env`, `node_modules/`, `dist/`, `repomix-output.xml` ignorés et non suivis. Les valeurs réelles de `.env` ne sont ni affichées ni documentées.
- Scan ciblé des candidats et de l'index : zéro motif de JWT complet, clé privée ou token courant recherché. Ce n'est pas une garantie d'absence de tout secret ni un scan exhaustif de l'historique.
- Checks whitespace de l'index et du diff : aucun défaut ; avertissements de normalisation LF/CRLF seulement.
- **`b24a4a3 chore: save current NovLearn Creator state before architecture audit`** : 54 fichiers, 3 924 insertions / 4 247 suppressions, ajustement `.gitignore` inclus.
- Working tree propre après sauvegarde, avance d'un commit. Aucun push ni réécriture d'historique.

## 2. Current architecture

| Domaine | État résolu localement |
|---|---|
| React / DOM | 19.2.3 ; manifeste ^19.2.0 |
| Build | Vite 7.3.1, plugin React 5.1.2 |
| Langage | JS ES modules/JSX ; aucun TS/TSX/tsconfig |
| Style | Tailwind 4.3.3, plugin Vite, CSS global |
| Math | KaTeX 0.16.27, react-katex 3.1.0, moteurs maison |
| Icônes | lucide-react 0.552.0 |
| Données | Supabase JS 2.90.1 pour taxonomie ; fetch pour exercices |
| Navigation / état | booleans, useState, hooks, cache module ; aucun routeur/store/context |
| Qualité | ESLint 9 ; aucun runner de tests |

```text
index.html -> main.jsx (StrictMode) -> App
  |-- useExercises : document en RAM
  |-- useVariables : valeurs générées en RAM
  |-- édition : ExerciseInfo + VariableManager + ElementList -> ElementEditor
  |-- aperçu : ExercisePreview -> ElementRenderer -> MathText / Canvas / SVG
  |-- Header -> ImportModal / publication -> API NovLearn HTTP
  |-- TaxonomyManager -> Supabase service_role
  `-- ExerciseInfo / ImportModal -> constants/cache -> Supabase anon

API exercices attendue -> route Next.js principale -> Supabase exercises
Élève -> loader Supabase -> content JSON -> renderers TSX
FastAPI principal -> autres services métier ; route /api/exercises identifiée
ici dans Next.js, et non dans FastAPI.
```

Import statique de la page taxonomie et du client admin : code/clé dans le bundle initial, même sans ouverture de la page. Clients créés à l'import ; configuration manquante susceptible de casser le bootstrap. **65 fichiers suivis après sauvegarde**, 48 modules JS/JSX, environ **6 913 lignes** incluant commentaires et blancs. Aucun cycle d'import local statique détecté.

## 3. Repository structure

```text
Novlearn_Exercice-Builder/
|-- .gitattributes, .gitignore, .env.example
|-- AGENTS.md, CLAUDE.md, README.md, GUIDE_LATEX.md
|-- package.json, package-lock.json
|-- vite.config.js, eslint.config.js, index.html
|-- public/logo.jpg
|-- src/
|   |-- main.jsx, App.jsx, supabaseClient.js, supabaseAdmin.js
|   |-- components/
|   |   |-- Header.jsx, ImportModal.jsx, ExerciseInfo.jsx
|   |   |-- VariableManager.jsx, ElementList.jsx
|   |   `-- ExercisePreview.jsx, Sidebar.jsx
|   |-- pages/TaxonomyManager.jsx
|   |-- hooks/useExercises.js, useVariables.js
|   |-- constants/index.js
|   |-- editors/ElementEditor.jsx + 12 éditeurs + README
|   |-- renderers/ElementRenderer.jsx + 12 renderers + README
|   |-- utils/
|   |   |-- defaultContent.js, publishUtils.js, evaluateExpression.js
|   |   |-- generateRandomValues.js, mathmodules.js
|   |   `-- mathExpr.js, mathRenderer.jsx, README.md
|   `-- styles/index.css
`-- docs/audits/creator-architecture-audit.md
Locaux ignorés : .env, node_modules/, dist/, repomix-output.xml
```

- Bootstrap : `index.html` charge `main.jsx`, import des styles app/KaTeX et `createRoot` ; `App` compose l'outil.
- Components : formulaires, catalogue, actions et aperçu ; pas une bibliothèque UI générique.
- Pages : un écran taxonomie mêlant styles, state, CRUD et rendu.
- Hooks : document/éléments et variables ; aucun réseau dans ces deux hooks.
- Editors/renderers : un fichier par type, contrats content/onUpdate et content/variables.
- Utils : logique pure math, templates et client HTTP mélangés dans un dossier généraliste.
- Constants : constantes et service réseau/cache mutable réunis.
- Config : seulement dev/build/preview/lint ; aucun test, CI/déploiement, SQL ou génération de types DB dans Creator.
- Assets : logo source unique ; polices KaTeX issues des dépendances au build. Aucun pipeline de médias d'exercices.

Les douze paires editor/renderer sont : **Text, Equation, Graph, Question, MCQ, SignTable, VariationTable, StatsTable, ProbaTree, Vector, ComplexPlane, DiscreteGraph**. Chacune a un template dans `defaultContent.js` ; ajout d'un type exige quatre registres locaux, puis prise en charge dans l'application élève.

## 4. Exercise creation workflow

```text
Création en RAM -> métadonnées -> variables et tirages -> éléments/templates
 -> édition/réorganisation -> aperçu/régénération
 -> confirmation -> validation minimale -> POST/upsert API
 -> succès et reset -> consommation dans NovLearn
```

1. `createEmptyExercise` (`hooks/useExercises.js:4`) : titres/chapitre vides, difficulté Facile, tableaux vides, flags false ; aucun ID DB créé côté client.
2. `ExerciseInfo` charge taxonomie et choisit le premier chapitre si vide. Compétences de plusieurs chapitres possibles ; changer de chapitre ne les efface pas.
3. `useVariables:89` régénère selon signature JSON des définitions. Définition persistée et valeurs générées sont séparées ; variantes = tirages, pas lignes enfants.
4. `addElement` crée template + ID numérique interne ; `ElementList` modifie/réordonne le JSON et délègue à `ElementEditor`.
5. Aperçu : valeurs et solutions enseignant visibles ; question libre désactivée ; QCM essayable. Aucun score global ou essai sauvegardé par Creator.
6. `Header:26` confirme puis appelle publication. `publishUtils:88` contrôle seulement titre truthy, chapitre truthy, au moins un élément : pas de validation détaillée, trim, réponse ou dépendance.
7. Colonnes extraites ; reste dans content. ID présent = update attendu, absent = insert attendu. Après succès, `App:50` reset et retour en édition.
8. `ImportModal` : GET liste/détail, filtres en RAM. Modifier conserve ID ; dupliquer l'enlève et ajoute « (Copie) » au titre ; DELETE confirmé avec retrait optimiste et rollback visuel si erreur.

**Sauvegarde = publication = même upsert.** Aucun statut draft/published, archivage, version ou approbation éditoriale. Brouillon uniquement en RAM ; pas d'autosave, dirty tracking, undo ou garde de fermeture/remplacement. La route Next `../Novlearn/frontend/app/api/exercises/route.ts:134` upsert le body sans schéma visible ; élève lit directement exercises. Un futur champ draft dans content ne suffira pas à isoler les brouillons.

| Concept | Représentation et persistance |
|---|---|
| Exercice | objet RAM ; colonnes et content JSONB via API |
| Question | élément question/mcq ; pas de table Question Creator |
| Énoncé | text, question, mcq.question dans JSON |
| Réponse/solution | correctAnswer string ou options[].correct ; JSON |
| Réponse utilisateur | state QCM ; aucun historique Creator |
| Correction | correctAnswer, explanation, hint, points ; correction élève ailleurs |
| Chapitre | exercise.chapter = nom ; table chapters pour catalogue |
| Compétence | exercise.competences = noms ; IDs externes pour progression |
| Difficulté | Facile/Moyen/Difficile envoyé en colonne |
| Type | discriminant de l'élément, pas type global d'exercice |
| Formule/LaTeX | strings @nom/@@/$...$/$$...$$ ; définition brute persistée |
| Variantes | definitions variables persistées ; valeurs non persistées |
| Flags | Is_Flash / Need_Calculator |
| Thème/tags/média/image | aucun concept éditable dédié ; logo seul ; champs historiques externes inconnus |
| Statut/auteur/permissions | non représentés dans workflow Creator |
| Métadonnées autres | spreads conservant champs inconnus, sans classement précis |

## 5. Data model

### Formes à séparer

```text
ExerciseDraft (RAM, id optionnel)
  title, appTitle, chapter, difficulty, competences
  Is_Flash, Need_Calculator, variables, elements, champs historiques
ExerciseWriteRow (HTTP)
  id?, title, app_title, chapter, difficulty, competences, flags
  content: {variables, elements, champs hors META_KEYS}
ExerciseReadPayload (HTTP attendu)
  objet aplati -> normalizeExercise -> édition
```

`normalizeExercise` (`useExercises.js:24`) adapte appTitle/app_title/apptitle, variables/variableDefinitions, tableaux racine et conservation optionnelle ID. **Pas de validation profonde ni désimbrication content d'une ligne DB brute.** Payload imbriqué : tableaux racine vides ; `publishUtils` exclut content à la republication. Risque de perte avec un nouvel import mal adapté. Null explicite peut écraser defaults ; flags, difficulté et types d'IDs ne sont pas normalisés.

### SQL déclaré dans le principal, à confirmer live

Sources : migrations `001`, `006`, `010`, `011`, `021`, `022`, `043` de `../Novlearn/supabase/migrations/`.

| Champ | Type/contrainte déclarée | Précaution |
|---|---|---|
| exercises.id | BIGSERIAL PK | pas UUID ; number élève, string liste API ; limite JS safe integer à surveiller |
| chapter | TEXT NOT NULL | nom, aucune FK chapter retrouvée |
| difficulty | TEXT nullable CHECK easy/medium/hard (001) | Creator français ; aucune modification du CHECK retrouvée dans recherche ciblée |
| content | JSONB NOT NULL | aucun schéma de contenu déclaré ici |
| created_at | TIMESTAMPTZ DEFAULT NOW() | updated_at exclu par Creator mais existence DB non établie |
| title/app_title | TEXT nullable (021) | deux titres |
| competences | TEXT[] nullable (021) | noms Creator ; noms/IDs chez consommateurs |
| Is_Flash/Need_Calculator | BOOLEAN nullable, noms quotés (021) | route GET lit d'autres noms |
| competence_id | TEXT nullable sans FK (006) | pas envoyé en colonne par Creator |
| chapters.id | SERIAL initial puis UUID/default uuid_generate_v4 (022) | ne pas recopier types numériques historiques |
| chapters.name/order_index | TEXT UNIQUE NOT NULL / INT NOT NULL | nom clé métier, ordre éditable |
| chapters.aliases/emoji | TEXT[] default {} / TEXT NOT NULL avec default | db_aliases renommé aliases ; à préserver |
| competences.id/name | TEXT PK / TEXT NOT NULL | ID slug ; nom pas UNIQUE dans 010 |
| competences.chapter_id | INT FK initial -> UUID (022), cascade déclaré | commentaire nullable mais pas DROP NOT NULL dans conversion |
| competences.max_points | INT NOT NULL CHECK >0 (010) | insert Creator l'omet ; aucun default de cette table retrouvé |

**Le CHECK actif, defaults, nullabilité et migrations appliquées ne sont pas vérifiés.** 022 contient un DROP TABLE CASCADE conditionnel et conversion USING NULL : ne jamais la réappliquer comme méthode d'audit/migration du Creator.

```text
chapters.id -> competences.chapter_id (CASCADE déclaré)
competences.id -> user_competence_scores.competence_id (CASCADE dans 010)
exercises.id -> exercise_attempts.exercise_id (SET NULL prévu par 043)
exercises.id -> duels / feedbacks.exercise_id (SET NULL déclaré)
auth.users.id (UUID) -> relations utilisateurs principales
```

Supprimer une compétence peut affecter la progression si FK live conforme ; les CREATE IF NOT EXISTS successifs ne garantissent pas le schéma final. Un commit Git ne sauvegarde pas ces données.

### JSON des douze éléments

| Type | Content principal | Unions/legacy |
|---|---|---|
| text | {text} | string aussi accepté |
| equation | type simple, latex | renderer lit system, éditeur simple ne le pilote pas |
| graph | functions[{expression,color,showExpression?}], x/yMin/Max, showGrid | bornes number/string/auto/null/vide |
| question | question, answerFormat, correctAnswer, points, hint?, explanation? | number/set/interval/expression/text |
| mcq | question, options[{id?,text,correct}], multipleChoice, points, hint?, explanation? | primitives, isCorrect, label/content/value, indices correctAnswers/correctAnswer lus |
| signTable | variable, function, points[{x,type}], signs[] | boundary/zero/forbidden ; signAfter/signNext legacy |
| variationTable | variable, function, points[{x,y,pos}] | top/bottom/center/forbidden ; headers legacy |
| statsTable | headers[], rows[][] | alignement cellules/colonnes |
| probaTree | nodes[{id,label,isRoot?,parent?,proba?}], showPathProbabilities | racines, parents, cycles, probabilité string |
| vector | dimension 2D/3D, vectors[{name,x,y,z?}], showNorm/Coordinates | coordonnées expressions, noms SVG bruts |
| complexPlane | points[{name,re,im}], showGrid/Labels/Modulus/Argument | expressions, argument degrés |
| discreteGraph | type explicit/recursive/manual, formula ou recursiveFormula/firstTerm ou manualTerms | numberOfTerms, min/maxX/Y, limit et flags |

IDs éléments/variables internes au JSON, pas PK DB. Éléments : timestamp protégé par max existant ; variables : Date.now sans protection identique. Options QCM ajoutées sans ID, defaults avec ID ; nœuds arbre IDs propres, racine 0.

Variables : integer/decimal/choice/computed avec name ; doublet/triplet avec names. choices tableau de strings pour scalaire, string de tuples pour groupe. Triplet perfect_square : A=p², B=2pq, C=q². Exclusions string dans Creator ; min/max/decimals/points peuvent être des strings transitoires. generatedValues = map number|string, parfois entrée absente ou non-fini.

Candidats TS : ExerciseDraft, ReadDto, WriteDto, ExerciseElement discriminé type/content, VariableDefinition discriminée, VariableValues, GraphBound, AnswerFormat, ChapterRow, CompetenceRow, ApiResult<T>, ValidationIssue. Entrées réseau = unknown + schéma runtime. Séparer state formulaire et document valide ; conserver champs historiques contrôlés. Les interfaces seules ne protègent pas un JSON existant.

## 6. Supabase integration

| Fichier/ligne | Client | Opération |
|---|---|---|
| supabaseClient.js:7 | anon | createClient URL/clé, options SDK par défaut |
| supabaseAdmin.js:8 | service key | createClient, persistSession:false |
| constants/index.js:24 | anon | chapters select * order order_index |
| constants/index.js:25 | anon | competences select id,name,chapter_id,chapters(name) |
| pages/TaxonomyManager.jsx:310/311 | admin | chapters/competences select *, ordre index/name |
| même fichier :340 | admin | insert chapter {name,order_index} |
| :359 | admin | update nom chapter par id |
| :374 | admin | delete competences par chapter_id puis chapter par id |
| :389 | admin | 2 updates order_index en parallèle |
| :409 | admin | insert competence {id slug,name,chapter_id} |
| :425/:440 | admin | update nom/delete competence par id |

```text
Frontend -> Supabase Database anon : lecture taxonomie
Frontend -> Supabase Database service_role : administration taxonomie
Frontend -> API NovLearn -> Supabase Database : exercices
Frontend -> Auth / Storage : aucun appel métier explicite Creator
```

Aucun accès direct Creator à exercises, vue nommée, RPC, Edge Function, realtime/subscription, bucket, upload, URL signée ou Auth explicite retrouvé. Cela ne prouve pas l'absence de ces services dans Supabase distant.

Cache `getTaxonomy` : deux lectures parallèles, conversion IDs en noms, TTL 1h RAM ; pas de promesse partagée en vol. ExerciseInfo appelle deux helpers simultanés, pouvant doubler les reads ; StrictMode accentue en dev. Invalidation après CRUD, pas synchronisation multi-onglet. Jointure chapters(name) dépend FK/PostgREST ; compétences homonymes deviennent indistinguables dans le tableau de noms d'exercice.

RLS déclaré : 010/022 lecture publique taxonomie, 025 lecture exercises anon/authenticated ; pas vérifié serveur. Service_role contourne RLS ; persistSession:false ne réduit pas ses droits. [Documentation officielle Supabase](https://supabase.com/docs/guides/getting-started/api-keys).

Réécriture sans changement des données : layout, navigation, formulaires, hooks, cache/services, preview et outillage TS, en conservant JSON. Couplages sensibles : sérialisation/normalisation, discriminants, flags, noms/IDs/aliases, competence_id, jointures, cascades, RLS et identité commune.

Avant bascule : schéma live/contraintes, policies/grants, historique migrations appliquées, corpus anonymisé, buckets/URLs éventuels, backup/restauration. Aucun relevé n'a été effectué à distance ici.

## 7. Authentication

Aucun login/logout/session/context Auth/permission UI/JWT dans Creator. Confirm navigateur ≠ autorisation serveur. Écritures exercices via secret partagé x-admin-secret ; guardConfig ne teste que l'URL. Taxonomie via service_role direct sans identité ou attribution auteur. Clé anon = clé publique d'application, pas identité utilisateur. Pas de stockage local métier de session ou brouillon ; capacités SDK distinctes.

Principal : AuthContext Supabase, profil/role et backend/auth.py:44 vérifiant supabase.auth.get_user(token). Ils ne protègent pas Creator. Route Next contrôle secret POST/DELETE ; GET n'a pas de garde effective malgré commentaire Authentifié. Cible à décider : identité commune, enseignants/admin, autorisation côté serveur et journalisation. Conversion TS n'exige aucune recréation d'utilisateur Supabase.

## 8. Frontend architecture

State local et formulaires contrôlés ; props drilling de quelques niveaux mais contrats larges, objet complet et nombreux callbacks. App transmet directement setCurrentExercise ; ElementList peut remplacer tout le document. Hooks majoritairement fonctionnels, mais réorganisation ElementList:55 depuis closure. moveElement dans useExercises:75 non utilisé : responsabilité dupliquée.

Navigation via previewMode/showTaxonomyManager, sans URLs/liens directs/historique. Taxonomie conserve le document dans les hooks d'App mais démonte la vue d'édition ; retour recharge métadonnées/cache. Aucun dirty tracking.

Réseau : enveloppes success/data ou success/error ; JSON invalide géré et IDs encodés. Pas de schéma de réponse, timeout, annulation, pagination, concurrence/version ou ErrorBoundary. ImportModal gère loading/importingId, mais div de chargement reste cliquable ; rollback de suppressions concurrentes peut restaurer une vieille liste. CRUD taxonomie : alert, erreurs parfois ignorées. Formulaires sans bibliothèque/validation centralisée.

| Référence relative à src/ | Problème | Impact | Priorité |
|---|---|---|---|
| supabaseAdmin.js:6, publishUtils.js:5, App.jsx:10 | clés privilégiées, imports statiques | droits DB/API exposés | Critique |
| generateRandomValues.js:148, mathmodules.js:33/49 | new Function de contenus persistés, pas sandbox | JS exécuté au chargement/génération | Critique si contenus non fiables |
| TaxonomyManager.jsx:374/389 | delete non transactionnel ; première erreur ignorée ; errors des updates non lues | opération partielle/cascade/ordre incohérent | Haute |
| TaxonomyManager.jsx:409 | insert sans max_points, slug sans collision contrôlée | contraintes déclarées violées | Haute |
| ExerciseInfo.jsx:43, TaxonomyManager:359/425 | noms comme identité, renommage sans propagation | références obsolètes | Haute |
| useExercises.js:24, publishUtils.js:96 | validation superficielle, objet aplati supposé | perte de JSON avec nouvel import | Haute |
| GraphEditor.jsx:43/100 | fallback falsy seulement, pas fusion content partiel | TypeError map | Haute |
| VariableManager.jsx:300, generateRandomValues.js:68 | decimals non borné | RangeError | Haute |
| Header.jsx:37, App.jsx:50 | reset succès, autres modifications possibles pendant POST | édition concurrente perdue | Haute |
| MCQRenderer.jsx:6/7 | pas de reset lors régénération | réponses/résultats attachés à mauvaise variante | Moyenne |
| constants/index.js:15, ExerciseInfo.jsx:18 | cache sans déduplication en vol | reads doublés/valeurs anciennes | Moyenne |
| ElementList.jsx:39, useExercises.js:75 | double réorganisation | maintenance/typage divergents | Moyenne |
| ImportModal.jsx:46, publishUtils.js:49 | liste non validée, filtrage entier RAM | crash ou coût catalogue croissant | Moyenne |
| VectorRenderer.jsx:3, ComplexPlaneRenderer.jsx:3 | invalides transformés en zéro | dessin plausible mais faux | Haute métier |
| VectorRenderer.jsx:87, ComplexPlaneRenderer.jsx:25 | nombre de graduations proportionnel à coordonnée | gel/mémoire sans plafond | Haute |

Absence de routeur/store global n'est pas un défaut intrinsèque à cette taille ; frontières et contrats sont prioritaires.

### Comparaison réelle avec principal

Sources : `../Novlearn/frontend/app/types/exercise.ts`, `components/Exercise/ExerciseRenderer.tsx`, `ExerciseLoader.tsx`, `utils/variableGenerator.ts`, `utils/math/evaluation.ts`, `services/taxonomyService.ts`, `store/useTaxonomyStore.ts`, `app/api/exercises/route.ts`, migrations, configurations Apache/Next.

| Sujet | Creator | Principal local | Conséquence |
|---|---|---|---|
| Stack | React 19/Vite 7/Tailwind 4 | manifeste React 18.3/Next 15.5/Tailwind 3.3/TS strict/Vitest/Zustand | partager contrat sans imposer framework |
| API exercices | fetch URL configurée | route Next.js, proxy Apache HTTPS vers Next | ne pas supposer API FastAPI |
| CORS | origine Vite 5173 par défaut | whitelist route 3000, domaines NovLearn, ancienne URL Creator Vercel | 5173 absent ; vérifier usage avec route correspondante |
| Flags | Is_Flash/Need_Calculator | GET lit is_flash/need_calculator, retourne isFlash/needCalculator | normalize ne les adapte pas ; chargement/republication peut perdre flags et déplacer alias dans content |
| Tables | variationTable/signTable | variation_table/sign_table dans dispatcher | absence mapping trouvé route/loader : non supportés |
| Variations | points{x,y,pos} | points{x,value,variation} | changement de nom seul insuffisant |
| Signes | points{x,type}, signs[] | points{x,sign} | transformation sémantique nécessaire |
| Autres types | discreteGraph/probaTree/vector/complexPlane/statsTable | cinq types sans case dans dispatcher principal lu | aperçu ne garantit pas rendu élève |
| Types déclarés seulement | suites Creator | discrete_graph et sequence déclarés mais sans case dans ce dispatcher | type TS ne prouve pas fonctionnement |
| Exclusions | string '12; -1' | tableau string/number ; for-of | string parcourue par caractère : '12' peut exclure 1/2, pas 12 |
| Computed | root1/pgcd/solve et helpers JS | mathjs ; helpers non enregistrés dans evaluation.ts inspecté | définition valide Creator potentiellement invalide élève |
| Compétence | noms | résolution ID ou nom par store | renommage peut casser résolution |
| Chapter ID | pas coercition Creator | service typé number, migration 022 UUID | type principal à vérifier avant copie |
| Difficulté | français brut | CHECK anglais déclaré, helper DB/UI existant, route upsert brut | besoin contrat DB/API/UI vérifié |

Constats de code local, pas preuve de panne sur déploiement actuel. GET route:85 spread content après metadata, permettant à des champs historiques d'écraser metadata ; loader élève:238 applique plusieurs metadata après content. Lectures divergentes possibles d'une même ligne.

Workflow admin principal exercises_claude distinct ; non utilisé par Creator. Ne pas l'assimiler à ses brouillons. La compatibilité doit être validée avec la version réellement déployée, pas seulement avec cette copie locale.

## 9. JavaScript → TypeScript assessment

**Difficulté globale intermédiaire à élevée.** Taille raisonnable ; travail majeur : unions/formulaires/legacy et contrat élève. Renommer des extensions n'apporte ni validation JSON ni sécurisation des credentials.

### Classement exhaustif des 48 modules

Chemins relatifs à src/. Classement = typage et maintien des comportements, pas simple renommage.

| Catégorie | Fichiers | Nombre/raison |
|---|---|---|
| Simple | main.jsx ; components/Sidebar.jsx, ExercisePreview.jsx ; editors/TextEditor.jsx, EquationEditor.jsx ; renderers/TextRenderer.jsx, EquationRenderer.jsx, StatsTableRenderer.jsx ; supabaseClient.js, supabaseAdmin.js | **10** ; petits contrats. Clients simples à typer mais critiques à sécuriser. |
| Intermédiaire : orchestration | App.jsx ; components/ElementList.jsx, ExerciseInfo.jsx, Header.jsx, ImportModal.jsx ; hooks/useExercises.js, useVariables.js ; constants/index.js ; editors/ElementEditor.jsx ; renderers/ElementRenderer.jsx | **10** ; state/IDs/DTO/events/dispatch discriminé |
| Intermédiaire : éditeurs | editors/MCQEditor.jsx, QuestionEditor.jsx, StatsTableEditor.jsx, VectorEditor.jsx, ComplexPlaneEditor.jsx, VariationTableEditor.jsx, SignTableEditor.jsx | **7** ; tableaux/sous-objets/safeContent |
| Intermédiaire : renderers | renderers/MCQRenderer.jsx, QuestionRenderer.jsx, SignTableRenderer.jsx, VariationTableRenderer.jsx, VectorRenderer.jsx, ComplexPlaneRenderer.jsx | **6** ; legacy et géométrie/valeurs |
| Intermédiaire : utilitaires | utils/defaultContent.js, evaluateExpression.js, publishUtils.js, mathmodules.js | **4** ; templates/DTO/substitution/retours non-finis |
| Complexe | components/VariableManager.jsx ; pages/TaxonomyManager.jsx ; editors/GraphEditor.jsx, DiscreteGraphEditor.jsx, ProbaTreeEditor.jsx ; renderers/GraphRenderer.jsx, DiscreteGraphRenderer.jsx, ProbaTreeRenderer.jsx ; utils/generateRandomValues.js, mathExpr.js, mathRenderer.jsx | **11** ; formes multiples/parser/Canvas/arbre/CRUD+UI |

Total **10 simples, 27 intermédiaires, 11 complexes**. Configs effort mineur additionnel ; Markdown/CSS/assets hors conversion TSX.

Points difficiles :

- useState([]/{}/null) types explicites ; IDs string/number ; refs DOM/events drag ; callbacks de state et fonctions asynchrones.
- Correlation element.type/content : union discriminée + registre exhaustif, pas interface géante optionnelle.
- string/object texte ; options QCM primitives/objets ; variables scalar/tuple ; suites par mode ; bornes number/string/auto ; états temporaires de saisie distincts du document valide.
- Maps dynamiques, new Function, fonctions mathModules signatures hétérogènes : types ne rendent pas l'exécution sûre.
- compileExpression retourne fonction ou null ; évaluation number parfois NaN ; generatedValues map partielle ; API union succès/échec.
- Supabase non générique/types DB absents ; select * et jointure nécessitent schéma live.
- onUpdate remplace tout content ; ne pas perdre champs historiques inconnus.
- TypeScript/@types React/DOM non configurés ; types React 18 du principal ne conviennent pas automatiquement à React 19 Creator.

Objets assez explicites pour devenir types après séparation persisté/API/canonique/formulaire et validation runtime. Types du principal à comparer, pas recopier : assertions as unknown as Exercise et incohérence UUID attestent qu'ils ne sont pas un contrat vérifié.

## 10. Dependencies

### Production

| Package | Manifeste | Lock/install | Usage/TS |
|---|---|---|---|
| @supabase/supabase-js | ^2.89.0 | 2.90.1 | clients taxonomie, types fournis |
| react | ^19.2.0 | 19.2.3 | UI/hooks, @types à configurer |
| react-dom | ^19.2.0 | 19.2.3 | createRoot, @types à configurer |
| katex | ^0.16.25 | 0.16.27 | CSS/moteur, types via exports |
| react-katex | ^3.1.0 | 3.1.0 | Inline/BlockMath ; pas de déclarations TS installées |
| lucide-react | ^0.552.0 | 0.552.0 | icônes, types, peer React 19 accepté |

### Développement

| Package | Manifeste | Lock/install | Rôle |
|---|---|---|---|
| @eslint/js | ^9.39.5 | 9.39.5 | règles recommandées |
| eslint | ^9.39.5 | 9.39.5 | lint ; unsupported/deprecated dans lock |
| eslint-plugin-react-hooks | ^5.2.0 | 5.2.0 | rules-of-hooks/exhaustive-deps |
| globals | ^17.12.0 | 17.12.0 | globals browser |
| @tailwindcss/vite | ^4.3.3 | 4.3.3 | CSS Vite |
| tailwindcss | ^4.3.3 | 4.3.3 | styles utilitaires |
| @vitejs/plugin-react | ^5.1.1 | 5.1.2 | transformation/HMR |
| vite | ^7.2.1 | 7.3.1 | dev/build/preview |

Tous les packages directs ont un usage identifié. KaTeX/wrapper et Tailwind/plugin sont complémentaires, pas doublons inutiles. Aucune suppression immédiate justifiée ; remplacement wrapper seulement après comparaison comportement/maintenance/typage. Registre react-katex : 3.1.0, pas marque de dépréciation, metadata modified mai 2025 ; pas preuve d'abandon. [Dépôt officiel react-katex](https://github.com/talyssonoc/react-katex).

Outdated consulté au 6/10/2026 : versions plus récentes React/DOM 19.3.0, Supabase 2.117.2, Vite 8.3.3 (wanted 7.3.7), plugin React 6.1.2, ESLint 10.12.0, hooks 7.1.1, KaTeX 0.19.0, lucide 1.52.0, globals 17.13.0. **Observation du registre, pas cible prescrite** ; aucune mise à jour.

Node local v24.19.0 ; Vite/plugin demandent ^20.19.0 ou >=22.12.0. Pas engines/version runtime épinglée Creator. Lockfile npm v3, 14 packages directs installés concordant avec lock ; pas de réinstallation propre effectuée.

### Sécurité packages

npm audit --json --package-lock-only --ignore-scripts et variante --omit=dev ont abouti après accès au registre (premier essai sandbox sans accès réseau). Aucun audit fix.

- Total : **13 packages affectés : 9 high, 1 moderate, 3 low ; 0 critical**.
- Production : **3 : ws high, katex low, react-katex low**. Wrapper hérite alerte KaTeX, pas une faille indépendante confirmée.

| Packages/version | Sévérité npm | Exposition et traitement futur |
|---|---|---|
| Vite 7.3.1 | high | serveur dev, lecture fichiers/deny bypass ; Windows/exposition réseau à vérifier |
| Rollup 4.55.1 | high | build via Vite, path traversal/file write |
| PostCSS 8.5.6, nanoid 3.3.11 | high | CSS/build, source maps/générateurs |
| picomatch 4.0.3 | high | Vite/tinyglobby, glob/ReDoS |
| brace-expansion 1.1.18 | high | ESLint/minimatch, DoS patterns |
| browserslist 4.28.1 | high | plugin React/Babel, mémoire/custom stats |
| source-map-js 1.2.1 | high | source maps, DoS ; dépendance transitive de build |
| baseline-browser-mapping 2.9.14 | moderate | browserslist, terminaison sur input invalide |
| @babel/core 7.28.6 | low | plugin React, sourceMappingURL/file read |
| katex 0.16.27, react-katex 3.1.0 | low | restriction trust contournable en présence pollution prototype préalable selon avis |
| ws 8.19.0 | high | Supabase -> realtime-js -> ws, module Node ; aucun canal métier realtime Creator |

Distinguer présence dans dependencies de chemin exploitable navigateur. Outillage vulnérable n'est pas automatiquement une faille de la SPA statique ; ws est transitif Node et conditions doivent être analysées. Pas d'injection active démontrée ici.

Sources primaires : [Vite Windows](https://github.com/vitejs/vite/security/advisories/GHSA-fx2h-pf6j-xcff), [KaTeX](https://github.com/KaTeX/KaTeX/security/advisories/GHSA-238p-pmpm-9mq7), [ws](https://github.com/websockets/ws/security/advisories/GHSA-96hv-2xvq-fx4p). Vite Windows décrit notamment dev server exposé réseau ; script actuel ne passe pas --host. Risque credentials client indépendant des advisories.

## 11. Configuration & environments

| Variable | Usage | Nature |
|---|---|---|
| VITE_SUPABASE_URL | deux clients | publique |
| VITE_SUPABASE_ANON_KEY | taxonomie | clé publique, droits RLS/grants à vérifier |
| VITE_SUPABASE_SERVICE_KEY | CRUD taxonomie | secret serveur actuellement côté navigateur |
| VITE_NOVLEARN_API_URL | catalogue/détail/POST/DELETE | endpoint au build |
| VITE_ADMIN_SECRET | header écriture | secret privilégié côté navigateur |

VITE_* remplacé au build ; .env ignoré protège Git, pas navigateur. Build de vérification avec placeholders d'environnement ; marqueurs service/admin retrouvés dans bundle. Aucun secret réel utilisé dans ces artefacts. [Vite — variables et modes](https://vite.dev/guide/env-and-mode).

Seul .env local et modèle .env.example ; pas de staging/production distinct configuré dans Creator, CI ou déploiement. Template HTTPS NovLearn et variante localhost:3000, pas séparation effective.

Vite supporte .env.development/staging/production et build --mode staging ; environnement process prioritaire. .env commun toujours chargé : éviter qu'un mode incomplet hérite de credentials/services production. Capacité existante, gouvernance à définir. [Documentation modes Vite](https://vite.dev/guide/env-and-mode).

À décider : services/projets séparés, CORS, URL par environnement, secrets serveur, validation bootstrap et Node. Principal contient Apache production/staging ; routes Next spécialisées pas uniformes entre virtual hosts inspectés. Confirmer configuration déployée. Si bundles historiques distribués, inventorier et décider rotation lors retrait des clés client ; aucune rotation ici.

## 12. Code quality

Points positifs : pipeline editor/renderer/template, root petit, hooks métier, state majoritairement immuable, HTTP centralisé, parser dédié sans eval pour graphes, documentation, lint propre et pas cycle local statique.

Points faibles :

- TaxonomyManager **808 lignes**, environ 250 de styles puis composant ~520 lignes state/CRUD/rendu. VariableManager **336**, ExerciseInfo **294**, DiscreteGraphEditor **289**, ImportModal **263**, mathExpr **247**, GraphRenderer **232**.
- generateRandomValues combine parsing, tirages, exclusions, dépendances et JS (~160 lignes fonction).
- Defaults/legacy répartis : question template set, éditeur fallback number, renderer text ; signAfter/signNext adaptés seulement dans éditeur ; headers variations seulement dans éditeur. Aperçu et sauvegarde sans édition peuvent donc garder forme ancienne mal lue.
- Quatre registres de types parallèles sans exhaustivité vérifiée ; constantes/couleurs/dimensions dispersées, styles inline taxonomie vs Tailwind.
- PGCD répété dans ppcm ; helper num vecteur/complexe dupliqué ; renderers signes/variations analogues.
- moveElement, getAllCompetences/getCompetencesByChapter/searchCompetences sans consommateur local trouvé ; ne supprimer qu'après vérification usages externes.
- ESLint ignore unused noms majuscules, pas règles JSX React spécifiques/TS, script limité src ; succès ne certifie pas code mort ou comportement.
- Docs présentent normalize comme réparation unique, mais legacy dispersé. Texte SVG des noms de vecteurs/complexes bypass MathText malgré convention doc.

### Sondes locales en mémoire

| Fichier | Entrée/condition | Résultat observé | Problème |
|---|---|---|---|
| mathRenderer.jsx:47 | replaceVariables('x(2)',{a:1}) | x2 | suppression de parenthèses nécessaires, même variable non utilisée |
| mathRenderer.jsx:8/69 | c='2x', @c | 2 | parseFloat détruit choix textuel |
| generateRandomValues.js:87 | integer min=max=1, exclusions='1' | a=1 | fallback interdit après 50 essais |
| generateRandomValues.js:148, mathmodules.js:33 | a=4 ; solve('2*x - @a',0) | seulement {a:4} | @ supprimé en string ; scope a absent Function solve, computed silencieux |
| generateRandomValues.js:122 | a=@b+1 ; b=@a+1 | {} | cycle sans diagnostic |
| generateRandomValues.js:68 | decimals=-1 | RangeError | toFixed sans validation/catch |
| generateRandomValues.js:32 | tuple '(,2)' | {a:0,b:2} | Number('') devient 0 |
| useExercises.js:24 | payload DB content imbriqué | tableaux racine [] | normalisation ne déplie pas DB |
| GraphEditor.jsx:100 | content={} | TypeError functions.map | contenu partiel non réparé |

Cas positifs : -x^2 à x=3 -> -9 ; 2^3^2 -> 512 ; @a^2 avec a=-2 ->4 ; fraction LaTeX, 2(x+1), racine imbriquée simple ; gestion signes/@@ et prose sur cas sondés. xy = identifiant unique (NaN sans xy), pas produit x*y. Décrire précisément la syntaxe prise en charge. Aucun fichier de test créé ni bug corrigé.

| Dimension | Note /10 | Justification |
|---|---:|---|
| Architecture | 6 | modules clairs, frontières données/sécurité lacunaires |
| Maintenabilité | 5 | taille raisonnable, gros composants et legacy dispersé |
| Lisibilité | 7 | direct/documenté, styles lourds et commentaires inexacts |
| Modularité | 6 | renderers/moteur séparés, registres répétés |
| Testabilité | 4 | fonctions isolables, random non injecté, UI/réseau mélangés, zéro suite |
| Type-safety | 2 | JS sans validation runtime, quelques guards |
| Sécurité | 2 | clés privilégiées/JS computed ; live non vérifié |
| Évolutivité | 5 | extension locale simple, compatibilité/versionnement limitants |

Notes qualitatives, pas mesure instrumentée.

## 13. Tests

Aucun test/spec suivi, test script, framework ou couverture Creator. **Aucune suite connue ; pas de pourcentage instrumenté disponible.** Principal a Vitest (exerciceUtils.test.ts notamment) et tests Python, sans couvrir ce dépôt.

| Vérification réalisée | Résultat/portée |
|---|---|
| npm run lint via npm.cmd | succès, zéro diagnostic |
| build Vite production avec placeholders | succès, 1 769 modules ; code/config inchangés |
| bundle | JS 773,67 ko/gzip223,00 ; CSS63,78/gzip15,32 ; warning chunk >500 ko |
| imports | 48 modules, zéro cycle local statique |
| packages | 14 directs concordants lock/install ; audit/outdated consultés |
| sondes locales | cas section 12 reproduits en mémoire |
| Git | index/scans/checks, propre après sauvegarde |

Build régénère dist local ignoré avec valeurs factices : artefact d'audit, pas déploiement, pas commité. Aucun POST/DELETE réel, CRUD DB, auth distante ou test bout en bout navigateur.

Tests indispensables en phase suivante :

1. Aller-retour JSON : DB/API aplati, titres/flags/IDs/difficultés, inconnus, duplication sans ID, conservation des champs.
2. Corpus douze types et legacy, defaults/partiels/malformés, equivalence enseignant/élève, mappings tableaux.
3. Variables : noms/collisions, exclusions impossibles, tuples/carrés, bornes/decimals, cycles/helpers. Random injecté/contrôlé pour reproductibilité.
4. Maths : priorités, négatifs, fractions/LaTeX, @/@@, texte numérique, simplification sémantique, NaN/asymptotes.
5. HTTP mocké : enveloppes, non-JSON, config manquante, body exact, id encodé ; futur client sans secrets.
6. Chargement/édition/duplication/reorder/publication ; erreur conservant brouillon ; modification pendant POST ; fermeture/reload.
7. Taxonomie en environnement isolé : contraintes/cascades/permissions/transactions et noms ; jamais tests d'écriture production.

Commencer par caractérisation et intégrations ciblées sur corpus ; pas objectif arbitraire de couverture ni snapshots décoratifs.

## 14. UI / UX

Bon socle : titres interne/élève distincts, indicateur édition, catalogue filtrable, preview/régénération, aide LaTeX, chapitre hors liste conservé, warning QCM sans réponse correcte.

Opportunités statiques :

- Pas brouillon/undo/garde, reset après publication ; prévoir état enregistré et possibilité continuer édition.
- Bascule globale édition/aperçu ; preview côte à côte pourrait réduire aller-retour sur formules.
- Header nombreux boutons sans wrapping dédié ; SVG/Canvas fixes et tableaux larges : vérifier petits écrans/overflow.
- Messages « Supabase » dans actions d'exercices : employer vocabulaire NovLearn utile à l'utilisateur.
- alert/confirm bloquants, erreurs non localisées ; feedback et validation avant publication.
- Champs/expressions/listes/toggles répétés : composants accessibles réutilisables, design tokens communs.
- Labels sans htmlFor, boutons icône sans aria-label fréquent ; modal sans role/aria-modal/focus trap/Escape explicite ; interactions div non clavier.
- DnD souris sans monter/descendre clavier ; suppression d'élément sans restauration.
- IDs statiques showGrid/showLimit et markers SVG répétés : risque collisions entre instances.
- Textareas resize:none global ; explications longues difficiles. animate-in/fade-in utilisés sans plugin identifié : vérifier effet visuel.
- Taxonomie en styles inline séparés, absence design system. Sidebar parle variables « à droite » malgré manager colonne principale.

Aucune refonte UI ni vérification visuelle effectuée. Prévoir une session locale avec fixtures, keyboard/focus et plusieurs tailles en phase suivante.

## 15. RISQUES DE MIGRATION

Probabilités qualitatives, estimées à partir du code et non d'incidents mesurés. Une sauvegarde Git protège le code ; elle ne sauvegarde ni la base ni les exercices distants.

| Risque | Impact | Probabilité | Mesure avant migration |
|---|---|---|---|
| Import DB `content` non aplati ou reconstruction destructive | Perte de variables/éléments/champs inconnus à la republication | Élevée | Fixtures des trois formes, aller-retour sans perte et sauvegarde/export des données autorisé |
| Changement de casse des flags ou de difficulté | Options élève incorrectes, rejet SQL | Élevée | Contrat réel API/SQL, mapping explicite, tests des anciennes valeurs |
| Renommage camelCase/snake_case des éléments | Exercices publiés non rendus côté élève | Élevée | Matrice des douze types, version de contenu, migration compatible des deux lecteurs |
| Réécriture maths/variables sans corpus | Réponses, graphiques et tirages différents | Élevée | Corpus déterministe, comparaison enseignant/élève, revue des changements sémantiques |
| Remplacement de `new Function` par mathjs/parser | Helpers ou expressions historiques incompatibles | Élevée | Inventaire des expressions réelles et langage cible documenté ; traiter explicitement les expressions non migrables |
| Renommage chapitre/compétence ou modification ID | Association, progression et scores incohérents | Élevée | Identités stables, alias, mapping vérifié sur données réelles |
| Réapplication aveugle des migrations SQL historiques | Destruction/cascade de taxonomie, références perdues | Moyenne | Schéma actif inspecté, migration dédiée sur environnement isolé, sauvegarde/restauration vérifiée |
| Suppression d'un exercice ou d'une compétence | Perte ou détachement des tentatives/scores/duels | Moyenne | Vérifier FK effectives, stratégie archivage et conservation des historiques |
| Retrait des clés navigateur sans remplacement des endpoints | Administration indisponible | Élevée | Backend autorisé, identité/rôles et routes prêts avant bascule ; rotation coordonnée |
| Modification des règles RLS/grants | Accès élève/admin bloqué ou exposition élargie | Moyenne | Matrice des droits, tests anon/auth/admin, politique de déploiement cohérente |
| Changement d'origine/host/proxy | CORS, auth et routes `/api` cassés | Élevée | Tester origine Creator réelle, staging et HTTPS, route Next versus FastAPI |
| Refonte frontend simultanée aux contrats de données | Diagnostic et retour arrière difficiles | Élevée | Lots séparés, feature flags si utiles, lecteur compatible et rollback défini |
| Conservation implicite des états de preview | QCM/réponses issus du tirage précédent | Moyenne | Définir identité de session/tirage et réinitialisation attendue |
| Modification d'assets/médias supposés | Références historiques cassées | Inconnue | Inventorier les contenus distants ; aucun pipeline média métier trouvé ici |
| Édition concurrente pendant publication | Brouillon récent effacé après réponse | Élevée | Snapshot publié, statut dirty/version et retour qui ne détruit pas les modifications suivantes |
| Intégration admin dans le principal sans séparation des privilèges | Clés ou opérations admin accessibles au navigateur/utilisateur | Moyenne | Autorisation serveur par rôle ; séparer client public et services privilégiés |

La correction d'un bug de calcul peut elle-même modifier des exercices existants. Documenter le comportement avant/après et choisir où la compatibilité historique doit primer.

## 16. DO NOT BREAK

Ces invariants doivent être caractérisés avant les changements. Ils ne justifient pas de maintenir un défaut de sécurité ou une erreur mathématique sans décision explicite.

- Identité des exercices existants : mise à jour du même ID ; duplication créant un nouvel ID ; aucun ID réattribué pour une simple refonte.
- Contenu mathématique et relations : ordre des éléments, options correctes, réponses, hints, explications, points, variables et liens de l'arbre. Préserver les champs inconnus jusqu'à une décision de migration.
- Syntaxe `@nom`, échappement `@@`, LaTeX inline/bloc, substitutions de signes et langage des expressions ; couvrir les données anciennes et les valeurs négatives.
- Distinguer le titre interne et `appTitle`/`app_title`, les flags flash/calculatrice, la difficulté et les compétences. Fixer les conventions au contrat plutôt qu'au hasard des spreads.
- Respecter les douze types Creator et les types réellement consommés par le principal ; ne déclarer un format compatible qu'après tests des deux applications.
- Conserver les valeurs/expressions stockées, pas seulement une capture du rendu ; ne pas publier accidentellement un tirage aléatoire comme définition.
- Conserver les identités/alias de taxonomie et les associations aux exercices, tentatives, scores et autres historiques. Renommer un libellé ne doit pas réattribuer les apprentissages.
- Préserver les URL, méthodes et enveloppes API pendant la transition ou déployer les deux clients de façon coordonnée. Conserver l'encodage des IDs et rendre les erreurs exploitables.
- Maintenir la lecture élève autorisée et limiter les écritures à l'administration. Le retrait du secret embarqué doit avoir un remplacement serveur opérationnel.
- Vérifier les contraintes SQL et les cascades effectives avant toute opération sur les données ; les fichiers de migration ne prouvent pas l'état de production.
- Garantir un échec de publication qui conserve le travail ; préciser sauvegarde/brouillon et comportement pendant une requête en cours.
- Si des médias distants existent, préserver leurs références et droits jusqu'à inventaire. Le seul asset local identifié est `public/logo.jpg`.
- Préserver la capacité de retour arrière du déploiement et des données ; ne pas utiliser ce build d'audit à valeurs factices comme livrable de production.

## 17. DETTE TECHNIQUE PRIORISÉE

Priorités proposées pour un plan ultérieur ; aucune correction métier n'a été appliquée pendant cet audit.

| Priorité | Problème et fichiers | Conséquence | Recommandation |
|---|---|---|---|
| Critique | `src/supabaseAdmin.js`, `src/utils/publishUtils.js`, variables VITE | Service-role et secret admin distribués au navigateur | Mettre les opérations privilégiées derrière une autorisation serveur ; rotation coordonnée et revue du périmètre interne |
| Critique | `src/hooks/useExercises.js`, `publishUtils.js`, route principale, lecteurs élève | JSON, flags et types incompatibles ; risque de données perdues | Définir contrat canonique/versionné et adaptateurs des données existantes, avec corpus d'aller-retour |
| Critique | `TaxonomyManager.jsx`, migrations principales 010/022/043 | Inserts possiblement invalides, cascades et historiques | Lire schéma actif/contraintes, stabiliser identités, rendre opérations multiligne atomiques au serveur |
| Haute | `generateRandomValues.js`, `mathmodules.js`, import distant | Code JS exécuté à partir des définitions | Définir confiance et langage des computed ; remplacer progressivement l'exécution arbitraire par un moteur borné et compatible |
| Haute | `mathRenderer.jsx`, `generateRandomValues.js`, renderers | Simplification incorrecte, exclusions non respectées, NaN cachés | Tests de caractérisation puis correctifs ciblés validés sur corpus partagé |
| Haute | `GraphEditor.jsx`, defaults et autres editors/renderers | Champs partiels susceptibles de faire tomber la page | Validation aux frontières, defaults profonds par type, erreurs contextualisées |
| Haute | `Header.jsx`, `App.jsx`, hooks | Perte de travail, absence brouillon et gestion concurrence | Modèle dirty/snapshot/version, sauvegarde explicite, éviter reset destructif |
| Haute | `package-lock.json` | Vulnérabilités connues dont `ws`, outils de build | Mise à jour ciblée après analyse des chemins et validation ; pas `audit fix --force` aveugle |
| Moyenne | `VariableManager.jsx`, `TaxonomyManager.jsx`, `ImportModal.jsx` | Gros composants et états couplés | Extraire composants de formulaire et services ; garder des limites métier claires |
| Moyenne | `constants/index.js`, ExerciseInfo | Requêtes/cache redondants et références par nom | Coalescer demandes, invalider explicitement, résoudre identités stables avec compatibilité |
| Moyenne | `ElementList.jsx`, `useExercises.js`, styles | Logique reorder doublée, mises à jour incohérentes | Centraliser actions et mises à jour fonctionnelles ; alternative clavier |
| Moyenne | Tous les modules JS, chaîne CI absente | Faible protection contre les régressions | TypeScript progressif avec unions de contenu, validation runtime et checks de build/lint ciblés |
| Moyenne | Modal/formulaires/canvas/SVG | Accessibilité et responsive insuffisamment garantis | Parcours clavier/focus, labels, états d'erreur, tailles et bornes de rendu |
| Faible | Messages, aide, conventions et exports publics | Confusion et coût d'entretien | Documentation du contrat, libellés homogènes, suppression prudente des duplications |
| Faible | Chunk principal, imports eager | Chargement lourd et panne si config admin absente | Mesurer puis découper pages lourdes ; initialiser les clients au bon périmètre |

Ordre proposé : sécuriser les frontières et caractériser les formats avant une refonte visuelle ou des déplacements massifs de fichiers.

## 18. SCÉNARIOS DE MIGRATION

Les pourcentages ci-dessous sont des ordres de grandeur du code logique réutilisable après adaptation, pas des mesures de lignes ni des engagements de charge. Les données existantes doivent être conservées dans les trois scénarios.

| Dimension | A — Stabilisation progressive dans Vite | B — Refonte contrôlée du Creator | C — Administration intégrée au principal |
|---|---|---|---|
| Objectif | Consolider l'existant sans changement de plateforme | Refaire les frontières et le frontend autour d'un contrat fiable | Unifier auth, services et administration dans l'écosystème principal |
| Réutilisation probable | 80–90 % | 50–70 % | 30–50 % directement ; plus de logique adaptable |
| À garder | Écrans, éléments, pipeline et endpoints compatibles | Modèle métier, corpus, évaluateur sûr et logique utile des éléments | Domaine/corpus, rendu partagé et règles métier utiles |
| À reprendre | Validation, types, états, tests, clients privilégiés | Services/API, composants, état, schémas et UX | Routes/pages Next, auth/rôles, API/proxy et partage frontend/backend |
| Complexité | Moyenne | Élevée | Très élevée |
| Risque majeur | Dette structurelle maintenue sous nouvelles couches | Refonte trop large ou rupture de formats | Couplage au principal et frontière Next/FastAPI/permissions |
| Conditions | Contrat et sécurisation restent indispensables | Lots incrémentaux, adaptateurs legacy, double validation enseignant/élève | Accès et conventions du principal, décisions d'équipe, matrice de droits et déploiement partagé |
| Bénéfice | Résultats rapides et risque limité par petits lots | Socle durable avec transition maîtrisée | Gouvernance et identité communes, moins de divergence à long terme |
| Qualité finale attendue | Fiabilité accrue, structure actuelle partiellement conservée | Frontières testables et typées, UX cohérente, dette réduite | Cohérence produit et permissions communes, qualité dépendant de la séparation des domaines |
| Limite | Gros composants et duplications peuvent persister | Investissement plus important que de simples corrections | Délai, coordination et régression possibles sur le produit élève |

A reste une bonne première étape si la priorité immédiate est la fiabilité. B permet de traiter les causes tout en gardant un périmètre Creator distinct. C est un choix produit/organisation, pas une conséquence nécessaire de l'usage de TypeScript. Rien ne justifie une remise à zéro des exercices ou de la taxonomie.

## 19. RECOMMANDATION ET ARCHITECTURE CIBLE

Recommandation : **B, réalisée par étapes en commençant par la stabilisation A**. Le principal est déjà en Next/TypeScript mais cela ne rend ni une migration de framework ni une intégration immédiate obligatoire. Choisir Vite ou Next après arbitrage des rôles, de l'hébergement et des services ; partager d'abord les contrats et le comportement des exercices.

Domaines cibles :

| Domaine | Responsabilité et limites |
|---|---|
| Auth/admin | Identité, rôles, autorisation serveur, journalisation des écritures ; aucun secret privilégié dans le bundle |
| Exercises/questions | Agrégat éditable, métadonnées, éléments, schéma/version, import/duplication et validation |
| Variables/math | Définitions typées, tirage reproductible, dépendances, langage calculé borné, erreurs explicites |
| Chapters/competences | Identités stables, labels/alias, ordre et contraintes ; écritures atomiques et cache de lecture |
| Preview | Rendu consommant un contrat partagé et des valeurs générées ; séparation état pédagogique/définition |
| Publication | Adapter domaine ↔ API/DB, permissions, snapshot/version et suivi succès/échec sans perte du brouillon |
| Media | À introduire uniquement si besoin confirmé : stockage, références, droits et cycle de vie |

Organisation indicative, non créée :

```text
src/
  app/                    composition, navigation et providers utiles
  features/
    exercises/            édition, éléments, brouillon
    variables/            formulaires et génération
    taxonomy/             administration des référentiels
    preview/              rendu et état de session
    publication/          workflow de publication
  components/             primitives UI accessibles
  hooks/                  orchestration transversale limitée
  services/api/           clients HTTP et adaptateurs, sans clé admin
  types/                  contrats discriminés et versions
  schemas/                validation runtime aux frontières
  utils/math/             moteur pur et helpers autorisés
```

Les services serveur privilégiés vivent dans un périmètre serveur explicite, éventuellement dans le principal selon décision ; ce dossier frontend ne suffit pas à les sécuriser. Un paquet partagé de schémas/moteur/rendu peut réduire la divergence entre Creator et élève. Éviter un dossier utils qui absorbe toutes les règles métier ou un store global par défaut.

Phases proposées, chacune avec critères de sortie :

1. Confirmer contrat réel, schéma actif, rôles et corpus ; sauvegardes données et procédure de restauration avant changement distant.
2. Installer la caractérisation utile : aller-retour API, math/variables, douze éléments et parcours publication ; documenter explicitement les écarts acceptés.
3. Sécuriser les écritures et remplacer les clés embarquées de manière coordonnée ; vérifier accès anon/auth/admin et CORS de chaque environnement.
4. Introduire types et schémas en périphérie, adaptateurs legacy puis domaine canonique. Convertir modules simples avant calculs et gros formulaires.
5. Décomposer frontend et état, gérer brouillons/concurrence, corriger erreurs et accessibilité par parcours.
6. Mutualiser ou adapter les renderers et variables dans le principal ; tester un corpus commun côté enseignant et élève.
7. Déployer par petits lots avec observabilité utile, retour arrière et validation des données ; supprimer compatibilité legacy uniquement sur preuve d'absence d'usage.

Aucune de ces phases n'a été exécutée dans cet audit.

## 20. QUESTIONS OUVERTES ET LIVRAISON

Décisions et informations à obtenir avant de commencer la refonte :

- Quelle URL API et quelle origine Creator sont effectivement utilisées dans chaque environnement ? Quelle route reçoit réellement `/api/exercises`, et quelle version est déployée ?
- Quel est le schéma Supabase actif : UUID/serial, NOT NULL, valeurs de difficulty, flags, `max_points`, FK/cascades, grants et RLS ? Les migrations visibles sont des indices, pas une introspection de production.
- Quels rôles doivent créer, publier, supprimer et gérer la taxonomie ? Quelle identité/session et quel audit des modifications sont requis ?
- Quel corpus d'exercices représente les contenus réellement utilisés, y compris legacy, computed/helpers, tableaux, tuples et types absents du lecteur principal ?
- Quel format/version canonique, quelles stratégies de compatibilité et quelles règles de migration sont approuvés ? Quels IDs/alias doivent rester stables ?
- Les computed doivent-ils conserver du JavaScript d'auteur ou utiliser un langage limité ? Comment traiter les expressions qui ne peuvent pas être adaptées ?
- Quel besoin de brouillon local/serveur, autosave, collaboration, historique et gestion des conflits ?
- Creator doit-il rester séparé ou devenir une zone admin du principal ? Qui possède le contrat et les renderers partagés ?
- Existe-t-il des médias externes ou des contraintes de performance/accessibilité non visibles dans ce dépôt ?
- Quel processus coordonne secrets/rotation, staging, sauvegardes, restauration, CI et retour arrière ?

Le dépôt principal local a pu être consulté pour des vérifications ciblées : routes d'exercices, types/loader/renderers/génération, configuration, proxy et migrations. Il ne s'agit pas d'un audit complet de ce dépôt. Aucune base distante n'a été interrogée ou modifiée et aucune valeur de secret n'a été affichée.

Livrables et limites :

- Sauvegarde préalable : `b24a4a3` — `chore: save current NovLearn Creator state before architecture audit`.
- Rapport : `docs/audits/creator-architecture-audit.md`, seul fichier ajouté après la sauvegarde ; commit séparé `docs: add NovLearn Creator architecture audit`.
- Lint réussi ; build réussi avec valeurs d'environnement factices, jamais destiné à être déployé ; diagnostic npm et expériences de caractérisation en mémoire. Aucun test runner ajouté.
- Aucun fichier source de l'application, contrat API, auth ou schéma SQL modifié par l'audit. La sauvegarde a inclus les modifications antérieures de l'utilisateur et les règles d'ignore nécessaires.
- Aucun push, changement de branche, migration, installation/mise à jour de dépendance ou refonte réalisé. État Git et cinq derniers commits vérifiés après le commit documentaire.

Sources primaires externes consultées pour les points dépendant des outils et avis de sécurité : [Vite — environnement](https://vite.dev/guide/env-and-mode), [Supabase — clés API](https://supabase.com/docs/guides/getting-started/api-keys), [react-katex](https://github.com/talyssonoc/react-katex), [Vite — avis Windows](https://github.com/vitejs/vite/security/advisories/GHSA-fx2h-pf6j-xcff), [KaTeX — avis de sécurité](https://github.com/KaTeX/KaTeX/security/advisories/GHSA-238p-pmpm-9mq7), [ws — avis de sécurité](https://github.com/websockets/ws/security/advisories/GHSA-96hv-2xvq-fx4p). Les assertions sur le projet reposent sur les fichiers locaux cités ; les limitations sont précisées dans les sections correspondantes.