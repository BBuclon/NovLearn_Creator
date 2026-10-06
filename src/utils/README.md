# 🛠️ Utilitaires

## `mathRenderer.jsx` ⭐ cœur du rendu

```jsx
import MathText, { replaceVariables } from "../utils/mathRenderer";

<MathText content="Calculer $f(@a) = @a x^2 + @b$" variables={{ a: 2, b: -3 }} />
```

- `MathText` découpe le texte en segments prose / `$...$` / `$$...$$`, substitue les `@variables`
  puis rend le LaTeX avec KaTeX. La simplification (`1x → x`, `0x → ∅`, `+ -3 → - 3`) ne
  s'applique qu'aux segments mathématiques ; la prose garde ses `1`, `0` et parenthèses.
- `replaceVariables(text, variables, { math })` : substitution seule (utilisée par `MathText`).
  `@@` produit un `@` littéral.

## `mathExpr.js` — évaluateur d'expressions

```js
import { compileExpression, evalMath } from "../utils/mathExpr";

const f = compileExpression("@a x^2 + 1".replace("@a", "-2")); // ou via evaluateExpression
f({ x: 3 }); // -17
evalMath("\\frac{@a}{2} + sqrt(9)", { a: 4 }); // 5
```

Sans `eval` : tokenizer + parser descendant. Supporte `^`, la multiplication implicite (`2x`,
`(x+1)(x-1)`), `\frac{}{}`, `\sqrt{}`, `\pi`, `e`, `sin cos tan ln log exp abs ...`, `u_n`, `n`.
Retourne `NaN` (ou `null` à la compilation) si l'expression est invalide.

## `evaluateExpression.js`

Substitution textuelle des `@variables` (les valeurs négatives sont parenthésées). Préférer
`evalMath` quand on veut un nombre.

## `generateRandomValues.js`

Tire les valeurs des variables (`integer`, `decimal`, `choice`, `doublet`, `triplet`) puis évalue
les variables `computed` (jusqu'à 10 passes pour résoudre les dépendances) avec les fonctions de
`mathmodules.js`.

## `mathmodules.js`

Bibliothèque exposée aux variables calculées : `delta`, `root1`, `root2`, `vertexX`, `vertexY`,
`pgcd`, `ppcm`, `isPrime`, `round`, `min`, `max`, `abs`, `solve`, `derive`. `moduleHelpCategories`
alimente l'aide affichée dans `VariableManager`.

## `defaultContent.js`

Contenu initial de chaque type d'élément. **Obligatoire** pour tout nouveau type : les éditeurs
supposent la présence des champs.

## `publishUtils.js`

Client de l'API Novlearn : `fetchExercisesList`, `fetchFullExercise`, `publishExerciseToDB`
(upsert), `deleteExerciseFromDB`. Les colonnes de la table sont extraites, le reste part dans
`content`.
