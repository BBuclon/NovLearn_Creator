import { useEffect, useMemo, useRef } from "react";
import { evaluateExpression } from "../utils/evaluateExpression";
import { compileExpression, evalMath } from "../utils/mathExpr";
import MathText from "../utils/mathRenderer";

const WIDTH = 400;
const HEIGHT = 300;

const AUTO_X_DEFAULT = [-10, 10];
const AUTO_X_SPAN = 20; // si une seule borne x est auto, on étend de 20
const Y_MARGIN = 0.15; // marge 15% en haut/bas pour l'auto-fit y
const Y_SAMPLES = 200; // échantillonnage pour l'auto-fit y

// Compile une expression f(x) (syntaxe calculatrice ou LaTeX) en (x) => number
const compileFunction = (expression, variables) => {
  const fn = compileExpression(evaluateExpression(expression, variables));
  return fn ? (x) => fn({ x }) : () => NaN;
};

const isAutoBound = (bound) =>
  bound === null ||
  bound === undefined ||
  (typeof bound === "string" && (bound.trim() === "" || bound.trim().toLowerCase() === "auto"));

// Résout une borne fixe (number ou expression avec @variables). null si auto / invalide.
const resolveFixedBound = (bound, variables) => {
  if (isAutoBound(bound)) return null;
  if (typeof bound === "number") return Number.isFinite(bound) ? bound : null;
  const val = evalMath(bound, variables);
  return Number.isFinite(val) ? val : null;
};

// Auto-fit X : [-10,10] par défaut ; si une seule borne fixe, étend de 20
const computeXRange = (content, variables) => {
  const xMinAuto = isAutoBound(content.xMin);
  const xMaxAuto = isAutoBound(content.xMax);

  if (xMinAuto && xMaxAuto) return AUTO_X_DEFAULT;

  if (!xMinAuto && !xMaxAuto) {
    const a = resolveFixedBound(content.xMin, variables);
    const b = resolveFixedBound(content.xMax, variables);
    if (a !== null && b !== null && a < b) return [a, b];
    return AUTO_X_DEFAULT;
  }

  if (xMinAuto) {
    const max = resolveFixedBound(content.xMax, variables);
    return max === null ? AUTO_X_DEFAULT : [max - AUTO_X_SPAN, max];
  }
  const min = resolveFixedBound(content.xMin, variables);
  return min === null ? AUTO_X_DEFAULT : [min, min + AUTO_X_SPAN];
};

// Auto-fit Y : échantillonne les fonctions, percentiles 1% / 99%, marge 15%
const computeYRangeAuto = (xRange, compiledFns) => {
  const [xMin, xMax] = xRange;
  const samples = [];
  for (const fn of compiledFns) {
    for (let i = 0; i < Y_SAMPLES; i++) {
      const x = xMin + ((xMax - xMin) * i) / (Y_SAMPLES - 1);
      const y = fn(x);
      if (Number.isFinite(y)) samples.push(y);
    }
  }
  if (samples.length === 0) return [-5, 5];
  samples.sort((a, b) => a - b);
  const lo = samples[Math.floor(0.01 * (samples.length - 1))];
  const hi = samples[Math.ceil(0.99 * (samples.length - 1))];
  let span = hi - lo;
  if (span === 0 || !Number.isFinite(span)) span = Math.max(1, Math.abs(lo) || 1);
  const margin = span * Y_MARGIN;
  return [lo - margin, hi + margin];
};

const computeYRange = (content, variables, xRange, compiledFns) => {
  const yMinAuto = isAutoBound(content.yMin);
  const yMaxAuto = isAutoBound(content.yMax);

  if (!yMinAuto && !yMaxAuto) {
    const a = resolveFixedBound(content.yMin, variables);
    const b = resolveFixedBound(content.yMax, variables);
    if (a !== null && b !== null && a < b) return [a, b];
  }

  const [autoLo, autoHi] = computeYRangeAuto(xRange, compiledFns);
  const yMin = yMinAuto ? autoLo : (resolveFixedBound(content.yMin, variables) ?? autoLo);
  const yMax = yMaxAuto ? autoHi : (resolveFixedBound(content.yMax, variables) ?? autoHi);
  if (yMin >= yMax) return [yMin - 1, yMin + 1];
  return [yMin, yMax];
};

// Pas de grille adapté à l'étendue de l'axe (vise ~10 graduations)
const niceStep = (range) => {
  const raw = range / 10;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const rel = raw / pow;
  const nice = rel < 1.5 ? 1 : rel < 3 ? 2 : rel < 7 ? 5 : 10;
  return nice * pow;
};

const NO_VARIABLES = {};

const GraphRenderer = ({ content, variables = NO_VARIABLES }) => {
  const canvasRef = useRef(null);
  const vars = variables;

  const compiledFns = useMemo(
    () =>
      (content.functions || [])
        .filter((fn) => fn && fn.expression)
        .map((fn) => ({ ...fn, _eval: compileFunction(fn.expression, vars) })),
    [content.functions, vars],
  );

  const [xMin, xMax] = useMemo(() => computeXRange(content, vars), [content, vars]);
  const [yMin, yMax] = useMemo(
    () => computeYRange(content, vars, [xMin, xMax], compiledFns.map((f) => f._eval)),
    [content, vars, xMin, xMax, compiledFns],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    const xScale = WIDTH / (xMax - xMin);
    const yScale = HEIGHT / (yMax - yMin);
    const toScreenX = (x) => (x - xMin) * xScale;
    const toScreenY = (y) => HEIGHT - (y - yMin) * yScale;

    // 1. Grille
    if (content.showGrid !== false) {
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const stepX = niceStep(xMax - xMin);
      const stepY = niceStep(yMax - yMin);
      for (let x = Math.ceil(xMin / stepX) * stepX; x <= xMax; x += stepX) {
        const sx = toScreenX(x);
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, HEIGHT);
      }
      for (let y = Math.ceil(yMin / stepY) * stepY; y <= yMax; y += stepY) {
        const sy = toScreenY(y);
        ctx.moveTo(0, sy);
        ctx.lineTo(WIDTH, sy);
      }
      ctx.stroke();
    }

    // 2. Axes
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (xMin <= 0 && xMax >= 0) {
      const sx = toScreenX(0);
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, HEIGHT);
    }
    if (yMin <= 0 && yMax >= 0) {
      const sy = toScreenY(0);
      ctx.moveTo(0, sy);
      ctx.lineTo(WIDTH, sy);
    }
    ctx.stroke();

    // 3. Courbes
    compiledFns.forEach((fn) => {
      ctx.strokeStyle = fn.color || "#2563eb";
      ctx.lineWidth = 2;
      ctx.beginPath();

      let first = true;
      let prevY = null;
      const step = (xMax - xMin) / WIDTH;

      for (let i = 0; i <= WIDTH; i++) {
        const x = xMin + i * step;
        const y = fn._eval(x);
        if (!Number.isFinite(y)) {
          first = true;
          prevY = null;
          continue;
        }
        // Asymptote : saut vertical brutal -> on coupe le trait
        if (prevY !== null && Math.abs(y - prevY) > (yMax - yMin) * 2) first = true;
        prevY = y;

        const sx = toScreenX(x);
        const sy = toScreenY(y);
        if (sy < -HEIGHT || sy > HEIGHT * 2) {
          first = true;
          continue;
        }
        if (first) {
          ctx.moveTo(sx, sy);
          first = false;
        } else {
          ctx.lineTo(sx, sy);
        }
      }
      ctx.stroke();
    });
  }, [compiledFns, xMin, xMax, yMin, yMax, content.showGrid]);

  const visibleLabels = compiledFns.filter((fn) => fn.showExpression !== false);

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-100 shadow-sm gap-2">
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="border border-gray-200 rounded bg-white max-w-full"
      />
      {visibleLabels.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {visibleLabels.map((fn, idx) => (
            <span key={idx} style={{ color: fn.color || "#2563eb" }}>
              <MathText content={`$f(x) = ${fn.expression}$`} variables={vars} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default GraphRenderer;
