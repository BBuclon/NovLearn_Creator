/**
 * Bibliothèque de fonctions mathématiques avancées.
 */

export const mathModules = {
  // --- 1. POLYNÔMES (ax² + bx + c) ---
  delta: (a, b, c) => (b * b) - (4 * a * c),

  root1: (a, b, c) => {
    const d = (b * b) - (4 * a * c);
    if (d < 0) return NaN; 
    return (-b - Math.sqrt(d)) / (2 * a);
  },

  root2: (a, b, c) => {
    const d = (b * b) - (4 * a * c);
    if (d < 0) return NaN;
    if (d === 0) return -b / (2 * a);
    return (-b + Math.sqrt(d)) / (2 * a);
  },

  vertexX: (a, b) => -b / (2 * a),
  
  vertexY: (a, b, c) => {
    const x = -b / (2 * a);
    return a * x * x + b * x + c;
  },

  // --- 2. ANALYSE (SOLVER & DÉRIVÉE) ---
  solve: (exprStr, guess = 0) => {
    try {
      const safeExpr = exprStr.replace(/\^/g, '**');
      const f = new Function('x', `try { const sin=Math.sin, cos=Math.cos, tan=Math.tan, sqrt=Math.sqrt, abs=Math.abs, exp=Math.exp, ln=Math.log; return ${safeExpr}; } catch(e) { return NaN; }`);
      let x0 = guess, x1 = guess + 0.1, maxIter = 50;
      for (let i = 0; i < maxIter; i++) {
        const y0 = f(x0), y1 = f(x1);
        if (Math.abs(y1) < 1e-7) return x1;
        if (Math.abs(y1 - y0) < 1e-9) break;
        const x2 = x1 - y1 * (x1 - x0) / (y1 - y0);
        x0 = x1; x1 = x2;
      }
      return x1;
    } catch { return NaN; }
  },

  derive: (exprStr, a) => {
    try {
      const safeExpr = exprStr.replace(/\^/g, '**');
      const f = new Function('x', `const sin=Math.sin, cos=Math.cos, tan=Math.tan, sqrt=Math.sqrt, abs=Math.abs, exp=Math.exp, ln=Math.log; return ${safeExpr};`);
      const h = 0.00001;
      return (f(a + h) - f(a - h)) / (2 * h);
    } catch { return NaN; }
  },

  // --- 3. ARITHMÉTIQUE ---
  pgcd: (a, b) => {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { [a, b] = [b, a % b]; }
    return a;
  },

  ppcm: (a, b) => {
     if (a===0 || b===0) return 0;
     const gcd = (x, y) => { x=Math.abs(x); y=Math.abs(y); while(y) [x,y]=[y,x%y]; return x; };
     return Math.abs(a*b)/gcd(a,b);
  },

  isPrime: (n) => {
    if (n <= 1) return 0;
    for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return 0;
    return 1;
  },

  round: (v, n=2) => {
    const f = Math.pow(10, n);
    return Math.round(v * f) / f;
  },
  
  max: (...args) => Math.max(...args),
  min: (...args) => Math.min(...args),
  abs: (x) => Math.abs(x)
};

// --- STRUCTURE DE L'AIDE POUR L'INTERFACE ---
export const moduleHelpCategories = [
  {
    title: "Polynômes (ax² + bx + c)",
    color: "text-orange-600 bg-orange-50 border-orange-200",
    funcs: [
      { syntax: "delta(@a, @b, @c)", desc: "Discriminant Δ" },
      { syntax: "root1(@a, @b, @c)", desc: "Racine 1 (la plus petite)" },
      { syntax: "root2(@a, @b, @c)", desc: "Racine 2 (la plus grande)" },
      { syntax: "vertexX(@a, @b)", desc: "Sommet Alpha (-b/2a)" },
      { syntax: "vertexY(@a, @b, @c)", desc: "Sommet Beta f(Alpha)" }
    ]
  },
  {
    title: "Arithmétique",
    color: "text-purple-600 bg-purple-50 border-purple-200",
    funcs: [
      { syntax: "pgcd(@a, @b)", desc: "PGCD de a et b" },
      { syntax: "ppcm(@a, @b)", desc: "PPCM de a et b" },
      { syntax: "isPrime(@n)", desc: "1 si premier, 0 sinon" },
      { syntax: "round(@x, 2)", desc: "Arrondi à 2 décimales" },
      { syntax: "abs(@x)", desc: "Valeur absolue" }
    ]
  },
  {
    title: "Analyse & Fonctions",
    color: "text-blue-600 bg-blue-50 border-blue-200",
    funcs: [
      { syntax: "solve('2*x - @a', 0)", desc: "Trouve x pour f(x)=0" },
      { syntax: "derive('x^2', @a)", desc: "Nombre dérivé en a" },
      { syntax: "max(@a, @b...)", desc: "Maximum" },
      { syntax: "min(@a, @b...)", desc: "Minimum" }
    ]
  }
];