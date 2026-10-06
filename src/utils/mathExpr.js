/**
 * Évaluateur d'expressions mathématiques (sans eval / new Function).
 *
 * Accepte une syntaxe "calculatrice" et un sous-ensemble de LaTeX :
 *   2x^2 + 3x - 1     \frac{x+1}{x-2}     \sqrt{x}     sin(x)     e^x     2\pi
 *
 * - `^` est la puissance (associative à droite), `-x^2` vaut -(x^2)
 * - multiplication implicite : 2x, 2(x+1), (x+1)(x-1), x(x+1)
 * - fonctions : sin cos tan asin acos atan sqrt abs exp ln log(=log10) log2
 *               floor ceil round min max pow
 * - constantes : pi, e (si le scope ne les redéfinit pas)
 *
 * Les @variables doivent être substituées en amont (voir evaluateExpression).
 */
import { evaluateExpression } from "./evaluateExpression";

const FUNCTIONS = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sqrt: Math.sqrt,
  abs: Math.abs,
  exp: Math.exp,
  ln: Math.log,
  log: Math.log10,
  log10: Math.log10,
  log2: Math.log2,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  min: Math.min,
  max: Math.max,
  pow: Math.pow,
};

const CONSTANTS = { pi: Math.PI, PI: Math.PI, e: Math.E, E: Math.E, infty: Infinity };

/** Traduit le LaTeX courant en syntaxe "calculatrice". */
export const preprocessLatex = (expr) => {
  let s = String(expr ?? "");

  // \frac{A}{B} -> ((A)/(B)), quelques niveaux d'imbrication
  for (let i = 0; i < 5; i++) {
    const next = s.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, "(($1)/($2))");
    if (next === s) break;
    s = next;
  }

  return s
    .replace(/\\sqrt\[([^\]]*)\]\{([^{}]*)\}/g, "pow(($2),1/($1))")
    .replace(/\\sqrt\{([^{}]*)\}/g, "sqrt($1)")
    .replace(/\\(left|right)\b/g, "")
    .replace(/\\(cdot|times)\b/g, "*")
    .replace(/\\([A-Za-z]+)/g, "$1") // \sin -> sin, \pi -> pi, \ln -> ln
    .replace(/Math\./g, "")
    .replace(/\*\*/g, "^")
    .replace(/π/g, "pi")
    .replace(/[×·]/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/[{]/g, "(")
    .replace(/[}]/g, ")");
};

const tokenize = (s) => {
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c) || c === "@") {
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      const m = s.slice(i).match(/^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/);
      if (!m) throw new Error(`Nombre invalide en position ${i}`);
      tokens.push({ t: "num", v: parseFloat(m[0]) });
      i += m[0].length;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      const m = s.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
      tokens.push({ t: "id", v: m[0] });
      i += m[0].length;
      continue;
    }
    if ("+-*/^(),".includes(c)) {
      tokens.push({ t: c });
      i++;
      continue;
    }
    throw new Error(`Caractère inattendu "${c}"`);
  }
  return tokens;
};

const parse = (tokens) => {
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  const expect = (t) => {
    const tok = next();
    if (!tok || tok.t !== t) throw new Error(`"${t}" attendu`);
    return tok;
  };
  const startsOperand = (tok) =>
    !!tok && (tok.t === "num" || tok.t === "id" || tok.t === "(");

  const parseExpr = () => {
    let left = parseTerm();
    while (peek() && (peek().t === "+" || peek().t === "-")) {
      const op = next().t;
      const l = left;
      const r = parseTerm();
      left = op === "+" ? (s) => l(s) + r(s) : (s) => l(s) - r(s);
    }
    return left;
  };

  const parseTerm = () => {
    let left = parseUnary();
    for (;;) {
      const tok = peek();
      if (tok && (tok.t === "*" || tok.t === "/")) {
        next();
        const l = left;
        const r = parseUnary();
        left = tok.t === "*" ? (s) => l(s) * r(s) : (s) => l(s) / r(s);
      } else if (startsOperand(tok)) {
        // multiplication implicite : 2x, 2(x+1), (x+1)(x-1)
        const l = left;
        const r = parseUnary();
        left = (s) => l(s) * r(s);
      } else {
        break;
      }
    }
    return left;
  };

  const parseUnary = () => {
    const tok = peek();
    if (tok && tok.t === "-") {
      next();
      const r = parseUnary();
      return (s) => -r(s);
    }
    if (tok && tok.t === "+") {
      next();
      return parseUnary();
    }
    return parsePower();
  };

  const parsePower = () => {
    const base = parseAtom();
    if (peek() && peek().t === "^") {
      next();
      const exp = parseUnary();
      return (s) => Math.pow(base(s), exp(s));
    }
    return base;
  };

  const parseAtom = () => {
    const tok = next();
    if (!tok) throw new Error("Expression incomplète");
    if (tok.t === "num") {
      const v = tok.v;
      return () => v;
    }
    if (tok.t === "(") {
      const e = parseExpr();
      expect(")");
      return e;
    }
    if (tok.t === "id") {
      const name = tok.v;
      const fn = FUNCTIONS[name];
      if (fn && peek() && peek().t === "(") {
        next();
        const args = [];
        if (peek() && peek().t !== ")") {
          args.push(parseExpr());
          while (peek() && peek().t === ",") {
            next();
            args.push(parseExpr());
          }
        }
        expect(")");
        return (s) => fn(...args.map((a) => a(s)));
      }
      if (fn) {
        // "sin x" sans parenthèses : s'applique au facteur suivant
        const arg = parseUnary();
        return (s) => fn(arg(s));
      }
      return (s) => {
        if (s && Object.prototype.hasOwnProperty.call(s, name)) return Number(s[name]);
        if (name in CONSTANTS) return CONSTANTS[name];
        return NaN;
      };
    }
    throw new Error(`Jeton inattendu "${tok.t}"`);
  };

  const fn = parseExpr();
  if (pos < tokens.length) throw new Error(`Jeton inattendu "${tokens[pos].t}"`);
  return fn;
};

/**
 * Compile une expression en fonction (scope) => number.
 * Retourne null si l'expression est vide ou invalide.
 */
export const compileExpression = (expr) => {
  try {
    const tokens = tokenize(preprocessLatex(expr));
    if (tokens.length === 0) return null;
    const fn = parse(tokens);
    return (scope = {}) => {
      try {
        const v = fn(scope);
        return typeof v === "number" && Number.isFinite(v) ? v : NaN;
      } catch {
        return NaN;
      }
    };
  } catch {
    return null;
  }
};

/**
 * Substitue les @variables puis évalue. Retourne NaN si invalide.
 * `scope` permet d'ajouter des inconnues (ex: { x: 2 }).
 */
export const evalMath = (expr, variables = {}, scope = {}) => {
  const fn = compileExpression(evaluateExpression(expr, variables));
  return fn ? fn(scope) : NaN;
};
