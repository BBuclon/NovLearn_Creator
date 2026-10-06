import { mathModules } from './mathmodules';

// Les bornes peuvent être des chaînes en cours de saisie ("", "-") : on sécurise.
const toNum = (v, fallback) => {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

export const generateRandomValues = (variables = []) => {
  const scope = {};

  // Helper : parse les exclusions (ex: "0; -1")
  const parseExclusions = (excl) => {
    if (!excl) return [];
    return String(excl).split(/[;,]/).map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
  };

  // Helper : entier aléatoire dans [min, max] avec exclusions
  const randomInt = (min, max, excluded = [], maxAttempts = 50) => {
    let val, attempts = 0;
    do {
      val = Math.floor(Math.random() * (max - min + 1)) + min;
      attempts++;
    } while (excluded.some(ex => ex === val) && attempts < maxAttempts);
    return val;
  };

  // Helper : parse "(1,2); (-1,3)" en tableau de tableaux
  const parseMultiChoices = (str, count) => {
    if (!str) return [];
    return str.split(';')
      .map(s => s.trim().replace(/[()]/g, '').split(',').map(Number))
      .filter(arr => arr.length === count && arr.every(n => !isNaN(n)));
  };

  // 1. Variables Aléatoires (scalaires)
  const randomVars = variables.filter(v => !['computed', 'doublet', 'triplet'].includes(v.type));

  randomVars.forEach(v => {
    if (!v.name) return;

    let excludedValues = [];
    if (v.exclusions) {
      excludedValues = String(v.exclusions)
        .split(/[;,]/)
        .map(s => parseFloat(s.trim()))
        .filter(n => !isNaN(n));
    }

    let val;
    let isValid = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 50;

    while (!isValid && attempts < MAX_ATTEMPTS) {
      attempts++;
      switch (v.type) {
        case 'integer': {
          const minI = Math.min(toNum(v.min, 1), toNum(v.max, 10));
          const maxI = Math.max(toNum(v.min, 1), toNum(v.max, 10));
          val = Math.floor(Math.random() * (maxI - minI + 1)) + minI;
          break;
        }
        case 'decimal': {
          const minD = Math.min(toNum(v.min, 0), toNum(v.max, 10));
          const maxD = Math.max(toNum(v.min, 0), toNum(v.max, 10));
          const raw = Math.random() * (maxD - minD) + minD;
          val = parseFloat(raw.toFixed(toNum(v.decimals, 2)));
          break;
        }
        case 'choice': {
          const choices = (v.choices || []).filter((c) => c !== '');
          val = choices.length ? choices[Math.floor(Math.random() * choices.length)] : '';
          break;
        }
        default:
          val = '';
      }

      if (v.type === 'integer' || v.type === 'decimal') {
        const isExcluded = excludedValues.some(ex => Math.abs(ex - val) < 0.0000001);
        if (!isExcluded) isValid = true;
      } else {
        isValid = true;
      }
    }
    scope[String(v.name).trim()] = isValid ? val : toNum(v.min, 0);
  });

  // 1b. Doublets et Triplets
  const multiVars = variables.filter(v => ['doublet', 'triplet'].includes(v.type));

  multiVars.forEach(v => {
    if (!v.names || v.names.length === 0) return;

    if (v.mode === 'choice') {
      const count = v.type === 'doublet' ? 2 : 3;
      const options = parseMultiChoices(v.choices || '', count);
      if (!options.length) return;
      const picked = options[Math.floor(Math.random() * options.length)];
      v.names.forEach((name, i) => { if (name && name.trim()) scope[name.trim()] = picked[i]; });
    }

    if (v.mode === 'perfect_square') {
      const excluded = parseExclusions(v.exclusions);
      const min = toNum(v.min, -4);
      const max = toNum(v.max, 4);
      const p = randomInt(min, max, excluded);
      const q = randomInt(min, max, excluded);
      const [nA, nB, nC] = v.names;
      if (nA && nA.trim()) scope[nA.trim()] = p * p;
      if (nB && nB.trim()) scope[nB.trim()] = 2 * p * q;
      if (nC && nC.trim()) scope[nC.trim()] = q * q;
    }
  });

  // 2. Variables CALCULÉES (AVEC LES MODULES)
  let computedVars = variables.filter(v => v.type === 'computed');
  let hasChanges = true;
  let loops = 0;

  while (computedVars.length > 0 && hasChanges && loops < 10) {
    hasChanges = false;
    const remaining = [];

    computedVars.forEach(v => {
      try {
        // A. Préparation du Scope (Variables + Modules)
        const scopeKeys = Object.keys(scope);
        const scopeValues = Object.values(scope);
        
        // On ajoute nos supers fonctions au scope
        const moduleKeys = Object.keys(mathModules);
        const moduleValues = Object.values(mathModules);

        const allKeys = [...scopeKeys, ...moduleKeys];
        const allValues = [...scopeValues, ...moduleValues];

        // B. Nettoyage de l'expression
        // 1. Remplacer les maths standards
        let safeExpr = replaceMathFunctions(v.expression);
        
        // 2. SUPPRESSION DES @ pour le JS
        // "root1(@a, @b)" devient "root1(a, b)"
        safeExpr = safeExpr.replace(/@/g, ''); 

        // C. Exécution sécurisée
        const func = new Function(...allKeys, 'return ' + safeExpr);
        const result = func(...allValues);
        
        if (result !== undefined && !isNaN(result)) {
          // On évite les erreurs d'arrondi JS (0.300000004)
          scope[v.name] = parseFloat(Number(result).toPrecision(12)); 
          hasChanges = true;
        } else {
          remaining.push(v);
        }
      } catch {
        remaining.push(v);
      }
    });

    computedVars = remaining;
    loops++;
  }

  return scope;
};

// Helper classique
const replaceMathFunctions = (expr) => {
  if (!expr) return '0';
  let res = expr;
  res = res.replace(/\bsqrt\b/g, 'Math.sqrt');
  res = res.replace(/\bsin\b/g, 'Math.sin');
  res = res.replace(/\bcos\b/g, 'Math.cos');
  res = res.replace(/\btan\b/g, 'Math.tan');
  res = res.replace(/\babs\b/g, 'Math.abs');
  res = res.replace(/\bPI\b/g, 'Math.PI');
  res = res.replace(/\^/g, '**'); 
  return res;
};