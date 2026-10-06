# 📐 Guide LaTeX & variables — Exercice Builder

## Syntaxe de base

| Besoin | Syntaxe | Exemple |
|--------|---------|---------|
| Variable aléatoire | `@nom` | `Soit $a = @a$` |
| `@` littéral | `@@` | `email@@site.fr` |
| LaTeX inline | `$...$` | `Calculer $f(x) = x^2 + 3x + 2$` |
| LaTeX bloc (centré) | `$$...$$` | `$$\int_0^1 x^2\,dx$$` |
| Combiné | | `Résoudre $@a x^2 + @b x + @c = 0$` |

Les variables sont remplacées **avant** le rendu LaTeX, avec gestion des signes :
`@a x^2 + @b x + @c` avec `a=1, b=-3, c=0` donne `x^2 - 3x`.
La simplification (`1x → x`, `0x` supprimé, `+ -3 → - 3`) ne s'applique qu'entre `$...$`.

## Symboles courants

### Opérations
`x^2` · `x_n` · `x^{n+1}` · `\frac{a}{b}` · `\sqrt{x}` · `\sqrt[n]{x}` · `\times` · `\div` · `\pm`

### Fonctions
`\sin(x)` · `\cos(x)` · `\tan(x)` · `\ln(x)` · `\log(x)` · `e^x` · `\exp(x)` · `|x|`

### Comparaisons et ensembles
`\leq` · `\geq` · `\neq` · `\approx` · `\in` · `\notin` · `\subset` · `\cup` · `\cap` · `\emptyset` · `\infty`
`\mathbb{N}` · `\mathbb{Z}` · `\mathbb{Q}` · `\mathbb{R}` · `\mathbb{C}`

### Grec
`\alpha` · `\beta` · `\gamma` · `\delta` · `\Delta` · `\theta` · `\lambda` · `\pi` · `\Sigma`

### Analyse
`\lim_{x \to +\infty}` · `\int_{a}^{b} f(x)\,dx` · `\sum_{i=1}^{n}` · `\prod_{i=1}^{n}` · `f'(x)` · `\frac{df}{dx}`

### Géométrie
`\vec{u}` · `\vec{AB}` · `\lVert \vec{u} \rVert` · `\widehat{ABC}` · `\perp`

### Structures
```latex
\begin{cases} @a x + @b y = @c \\ @d x + @e y = @f \end{cases}
\begin{pmatrix} @a & @b \\ @c & @d \end{pmatrix}
```

## Exemples par type d'élément

**Texte**
```
Soit $f(x) = @a x^2 + @b x + @c$. Calculer $\Delta = b^2 - 4ac$ avec $a = @a$, $b = @b$, $c = @c$.
```

**Équation** (sans `$`, le rendu est déjà en bloc)
```
@a x^2 + @b x + @c = 0
\frac{@a}{@b} x = @c
```

**Graphe** (syntaxe calculatrice ou LaTeX, sans `$`)
```
@a x^2 + @b
\frac{x+1}{x-2}
e^x
2\sin(x)
```

**Question — solution attendue** (sans `$`)
```
Nombre     : @x1
Ensemble   : @x1; @x2          (affiché S = { ... })
Intervalle : ]-\infty; @a]
```

**QCM**
```
Question : Quelle est la dérivée de $f(x) = @a x^3$ ?
Options  : $@b x^2$   $@a x^2$   $3x^2$
```
(avec une variable calculée `b = 3*@a`)

## Pièges

- `@a` dans un exposant : écrire `x^{@a}` (accolades), sinon seul le premier caractère est en exposant.
- Une valeur négative dans une fraction : `\frac{@a}{2}` avec `a=-3` donne `\frac{-3}{2}` (correct).
- Multiplication explicite : `@a * @b` dans les champs numériques (graphe, vecteurs) ; dans le texte
  LaTeX, utiliser `\times` ou la juxtaposition.
- Ne pas mettre de `$` dans les champs déjà mathématiques (équation, réponse attendue, expressions de graphe).

## Ressources

- KaTeX : https://katex.org/docs/supported.html
- Éditeur en ligne : https://www.codecogs.com/latex/eqneditor.php
