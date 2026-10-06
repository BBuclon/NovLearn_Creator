/**
 * Contenu par défaut lors de la création d'un nouvel élément.
 * Syntaxe : @variable pour les variables, $...$ pour le LaTeX.
 */
export const defaultContent = {
  text: {
    text: "Soit une fonction $f$ définie sur $\\mathbb{R}$ par $f(x) = @a x^2 + @b$.",
  },

  graph: {
    functions: [{ expression: "x^2", color: "#2563eb", showExpression: true }],
    xMin: -5,
    xMax: 5,
    yMin: "auto",
    yMax: "auto",
    showGrid: true,
  },

  equation: {
    type: "simple",
    latex: "@a x + @b = 0",
  },

  variationTable: {
    variable: "x",
    function: "f(x)",
    points: [
      { x: "-\\infty", y: "+\\infty", pos: "top" },
      { x: "@a", y: "0", pos: "bottom" },
      { x: "+\\infty", y: "+\\infty", pos: "top" },
    ],
  },

  signTable: {
    variable: "x",
    function: "f(x)",
    points: [
      { x: "-\\infty", type: "boundary" },
      { x: "@a", type: "zero" },
      { x: "+\\infty", type: "boundary" },
    ],
    signs: ["+", "-"],
  },

  probaTree: {
    nodes: [
      { id: 0, label: "Départ", isRoot: true },
      { id: 1, label: "A", parent: 0, proba: "0.3" },
      { id: 2, label: "non A", parent: 0, proba: "0.7" },
    ],
    showPathProbabilities: false,
  },

  discreteGraph: {
    type: "explicit",
    formula: "n^2 / (n + 1)",
    numberOfTerms: 20,
    showGrid: true,
    showValues: false,
    connectPoints: false,
    showLimit: false,
  },

  complexPlane: {
    points: [{ name: "z1", re: "2", im: "1" }],
    showGrid: true,
    showLabels: true,
    showModulus: false,
    showArgument: false,
  },

  vector: {
    dimension: "2D",
    vectors: [
      { name: "u", x: "1", y: "2" },
      { name: "v", x: "-3", y: "5" },
    ],
    showNorm: false,
    showCoordinates: true,
  },

  statsTable: {
    headers: ["Valeur", "Effectif"],
    rows: [
      ["1", "@a"],
      ["2", "@b"],
    ],
  },

  mcq: {
    question: "Quelle est la bonne réponse ?",
    options: [
      { id: 1, text: "Réponse A", correct: true },
      { id: 2, text: "Réponse B", correct: false },
    ],
    multipleChoice: false,
    points: 1,
  },

  question: {
    question: "Résoudre l'équation :",
    answerFormat: "set", // 'number' | 'set' | 'interval' | 'expression' | 'text'
    correctAnswer: "@x1; @x2",
    points: 1,
  },
};

export const getDefaultContent = (type) =>
  defaultContent[type] ? JSON.parse(JSON.stringify(defaultContent[type])) : {};
