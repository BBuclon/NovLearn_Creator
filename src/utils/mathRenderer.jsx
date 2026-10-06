import { BlockMath, InlineMath } from "react-katex";

/**
 * Formate une valeur numérique (4 décimales max, sans zéros inutiles)
 */
const formatValue = (value) => {
  if (value === null || value === undefined) return "";
  const numValue = typeof value === "number" ? value : parseFloat(value);
  if (isNaN(numValue)) return String(value);
  return Number.isInteger(numValue)
    ? numValue.toString()
    : parseFloat(numValue.toFixed(4)).toString();
};

/** Nettoyage léger : uniquement les enchaînements de signes (+ -, - -, ...). */
const cleanSigns = (s) =>
  s
    .replace(/\+\s*-/g, "-")
    .replace(/-\s*-/g, "+")
    .replace(/\+\s*\+/g, "+")
    .replace(/[ \t]+([+-])[ \t]+/g, " $1 "); // espaces en double autour d'un signe

/**
 * Nettoie et simplifie une expression MATHÉMATIQUE (à n'appliquer
 * qu'au contenu entre $...$, jamais à de la prose).
 */
const cleanMathExpression = (expression) => {
  let cleaned = expression;

  // 1. Coefficient 0 : "0x", "0x^2", "0\pi" -> "0"
  cleaned = cleaned.replace(/(?<![\d.])0\s*[a-zA-Z\\][a-zA-Z0-9^_{}\\]*/g, "0");

  // 2. Coefficient 1 : "1x" -> "x", "1\pi" -> "\pi"
  cleaned = cleaned.replace(/(?<![\d.])1\s*([a-zA-Z\\])/g, "$1");

  // 3. Termes nuls : "+ 0", "- 0" (hors décimaux)
  cleaned = cleaned.replace(/[+-]\s*0(?![0-9.])/g, "");
  cleaned = cleaned.replace(/^\s*0\s*([+-])/, "$1");

  // 4. Signes
  cleaned = cleanSigns(cleaned);

  // 5. "+" en tête
  cleaned = cleaned.replace(/^\s*\+/, "");

  // 6. Parenthèses inutiles autour d'un nombre positif
  cleaned = cleaned.replace(/\((\d+\.?\d*)\)/g, "$1");

  if (expression.trim() !== "" && cleaned.trim() === "") return "0";
  return cleaned.replace(/\s+/g, " ").trim();
};

/**
 * Remplace @variable par sa valeur, avec gestion des signes.
 * @param {object} options.math  true = contexte mathématique (nettoyage complet),
 *                               false = prose (nettoyage des signes uniquement)
 */
export const replaceVariables = (text, variables = {}, { math = true } = {}) => {
  if (typeof text !== "string") return String(text ?? "");
  if (!variables || Object.keys(variables).length === 0) {
    return text.replace(/@@/g, "@");
  }

  let result = text.replace(/@@/g, "##ESCAPED_AT##");
  const sortedKeys = Object.keys(variables).sort((a, b) => b.length - a.length);

  sortedKeys.forEach((key) => {
    const value = variables[key];
    const numValue = typeof value === "number" ? value : parseFloat(value);
    const regex = new RegExp(`([+\\-]?)(\\s*)@${key}(?![a-zA-Z0-9_])`, "g");

    result = result.replace(regex, (match, sign, space) => {
      if (isNaN(numValue)) return (sign || "") + (space || "") + formatValue(value);

      const formattedAbs = formatValue(Math.abs(numValue));
      if (sign === "+") return numValue < 0 ? `${space}- ${formattedAbs}` : `${space}+ ${formattedAbs}`;
      if (sign === "-") return numValue < 0 ? `${space}+ ${formattedAbs}` : `${space}- ${formattedAbs}`;
      if (numValue < 0) return `${space}-${formattedAbs}`;
      return (space || "") + formatValue(value);
    });
  });

  result = result.replace(/##ESCAPED_AT##/g, "@");
  return math ? cleanMathExpression(result) : cleanSigns(result);
};

// Découpe "texte $inline$ texte $$bloc$$" en segments
const SEGMENT_REGEX = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g;

/**
 * Composant MathText : texte + LaTeX ($...$ inline, $$...$$ bloc) + @variables.
 */
export const MathText = ({ content, variables = {}, className = "", displayMode = false }) => {
  const textContent = String(content ?? "");
  if (!textContent) return null;

  const parts = [];
  let lastIndex = 0;
  let key = 0;
  let match;

  const pushText = (raw) => {
    if (!raw) return;
    parts.push(
      <span key={`text-${key++}`}>{replaceVariables(raw, variables, { math: false })}</span>,
    );
  };

  const regex = new RegExp(SEGMENT_REGEX.source, "g");
  while ((match = regex.exec(textContent)) !== null) {
    pushText(textContent.slice(lastIndex, match.index));

    const raw = match[0];
    const isBlock = raw.startsWith("$$");
    const formula = replaceVariables(
      isBlock ? raw.slice(2, -2) : raw.slice(1, -1),
      variables,
      { math: true },
    );

    if (formula.trim()) {
      parts.push(
        isBlock || displayMode ? (
          <BlockMath key={`math-${key++}`} math={formula} />
        ) : (
          <InlineMath key={`math-${key++}`} math={formula} />
        ),
      );
    }
    lastIndex = match.index + raw.length;
  }
  pushText(textContent.slice(lastIndex));

  if (parts.length === 1 && parts[0].type === "span") {
    return <span className={className}>{parts[0].props.children}</span>;
  }
  return <div className={className}>{parts}</div>;
};

export default MathText;
