# 📘 Novlearn — Exercice Builder

Outil interne pour créer et publier des exercices de mathématiques sur la plateforme Novlearn.
React 19 + Vite 7 + Tailwind CSS v4, rendu LaTeX via KaTeX, variables aléatoires `@a`.

## 🚀 Installation

```bash
git clone https://github.com/Luxods/NovLearn_Exercice-Builder.git
cd Novlearn_Exercice-Builder
npm install
cp .env.example .env   # puis renseigner les clés
npm run dev            # http://localhost:5173
```

Autres scripts : `npm run build` (production dans `dist/`), `npm run preview`, `npm run lint`.

## 🔐 Sécurité — à lire avant tout déploiement

Toutes les variables `VITE_*` sont **embarquées dans le bundle JavaScript** livré au navigateur.
Or le fichier `.env` contient :

- `VITE_SUPABASE_SERVICE_KEY` : la *service role key* Supabase (bypass complet du RLS, accès total à la base) ;
- `VITE_ADMIN_SECRET` : le secret qui autorise la publication / suppression d'exercices via l'API Novlearn.

**Conséquence : cette application ne doit pas être déployée sur une URL publique en l'état.**
Elle se lance en local (ou derrière une authentification réseau) par l'équipe pédagogique uniquement.

Pour pouvoir la déployer, il faut sortir ces secrets du client :

1. Gérer les chapitres/compétences via l'API Novlearn (ou une Edge Function Supabase) plutôt qu'avec la service key ;
2. Remplacer `x-admin-secret` par une vraie authentification (Supabase Auth + RLS, ou session Novlearn).

## ✍️ Syntaxe des contenus

| Élément | Exemple |
|---------|---------|
| Variable | `@a`, `@x1` (un `@` littéral s'écrit `@@`) |
| LaTeX inline | `$f(x) = @a x^2 + @b$` |
| LaTeX bloc (centré) | `$$\int_0^1 x^2\,dx$$` |
| Expression de graphe | `@a x^2 + @b`, `\frac{x+1}{x-2}`, `e^x`, `sin(x)`, `\sqrt{x}` |
| Suite | `n^2/(n+1)` (explicite), `0.5*u_n + 2` (récurrente) |

Le moteur nettoie automatiquement les expressions dans les segments `$...$` :
`1x → x`, `0x → supprimé`, `+ -5 → - 5`. La prose n'est pas modifiée.

Voir [GUIDE_LATEX.md](GUIDE_LATEX.md) pour le détail des symboles.

## 🎲 Variables

- **Entier / Décimal** : bornes min/max, valeurs interdites (`0; -1`), nombre de décimales.
- **Choix** : liste `sin,cos,tan`.
- **Calculé** : expression JavaScript avec les fonctions de `src/utils/mathmodules.js`
  (`root1(@a,@b,@c)`, `pgcd(@a,@b)`, `solve('x^2-@a', 0)`...).
- **Doublet / Triplet** : couples ou triplets tirés dans une liste `(1,2); (-1,3)`, ou triplet
  « carré parfait » `(p², 2pq, q²)`.

## 🧩 Types d'éléments

`text`, `equation`, `graph`, `question`, `mcq`, `signTable`, `variationTable`, `statsTable`,
`probaTree`, `vector`, `complexPlane`, `discreteGraph`.
Chaque type = un éditeur (`src/editors/`), un renderer (`src/renderers/`) et un contenu par défaut
(`src/utils/defaultContent.js`). Voir [CLAUDE.md](CLAUDE.md) pour l'architecture détaillée.

## 📦 Format d'un exercice

```json
{
  "id": 42,
  "title": "Second_degre_1",
  "appTitle": "Équation du second degré",
  "chapter": "Second degré",
  "difficulty": "Moyen",
  "competences": ["Résoudre une équation du second degré"],
  "Is_Flash": false,
  "Need_Calculator": false,
  "variables": [
    { "id": 1, "name": "a", "type": "integer", "min": 1, "max": 5, "exclusions": "0" }
  ],
  "elements": [
    { "id": 1, "type": "text", "content": { "text": "Résoudre $@a x^2 - 4 = 0$" } },
    { "id": 2, "type": "question", "content": { "question": "Solutions ?", "answerFormat": "set", "correctAnswer": "@x1; @x2", "points": 1 } }
  ]
}
```

En base, `title`, `app_title`, `chapter`, `difficulty`, `competences`, `Is_Flash`,
`Need_Calculator` sont des colonnes ; `variables` et `elements` sont stockés dans la colonne JSON
`content`.

## 🛠️ Stack

React 19 · Vite 7 · Tailwind CSS 4 · KaTeX / react-katex · lucide-react · @supabase/supabase-js · ESLint 9

## 📝 Licence

ISC
