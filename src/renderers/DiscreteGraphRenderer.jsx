import { useMemo } from "react";
import { evaluateExpression } from "../utils/evaluateExpression";
import { compileExpression, evalMath } from "../utils/mathExpr";

const MAX_TERMS = 500;

const DiscreteGraphRenderer = ({ content, variables }) => {
  // Calcul des termes de la suite
  const terms = useMemo(() => {
    const result = [];
    const { formula, recursiveFormula, firstTerm, type } = content;
    const numberOfTerms = Math.min(MAX_TERMS, Math.max(0, parseInt(content.numberOfTerms, 10) || 20));

    if (type === "explicit" && formula) {
      const f = compileExpression(evaluateExpression(formula, variables));
      if (f) {
        for (let n = 0; n <= numberOfTerms; n++) {
          const value = f({ n });
          if (Number.isFinite(value)) result.push({ n, value });
        }
      }
    } else if (type === "recursive" && recursiveFormula) {
      const f = compileExpression(evaluateExpression(recursiveFormula, variables));
      const u0 = evalMath(firstTerm ?? "", variables);
      if (f && Number.isFinite(u0)) {
        result.push({ n: 0, value: u0 });
        let current = u0;
        for (let n = 1; n <= numberOfTerms; n++) {
          const next = f({ u_n: current, u: current, n });
          if (!Number.isFinite(next)) break;
          result.push({ n, value: next });
          current = next;
        }
      }
    } else if (type === "manual" && Array.isArray(content.manualTerms)) {
      content.manualTerms.forEach((term, index) => {
        const value = evalMath(term, variables);
        if (Number.isFinite(value)) result.push({ n: index, value });
      });
    }
    return result;
  }, [content, variables]);

  const limitValue =
    content.showLimit && content.limit !== undefined && content.limit !== ""
      ? parseFloat(content.limit)
      : NaN;

  const dims = useMemo(() => {
    if (terms.length === 0) return { minX: 0, maxX: 10, minY: -5, maxY: 5 };
    const values = terms.map((t) => t.value);
    let minY = Math.min(...values);
    let maxY = Math.max(...values);
    const rangeY = maxY - minY || 1;
    minY -= rangeY * 0.1;
    maxY += rangeY * 0.1;
    if (Number.isFinite(limitValue)) {
      minY = Math.min(minY, limitValue - rangeY * 0.1);
      maxY = Math.max(maxY, limitValue + rangeY * 0.1);
    }
    const n = (v, fallback) => (Number.isFinite(v) ? v : fallback);
    return {
      minX: n(content.minX, 0),
      maxX: n(content.maxX, Math.max(...terms.map((t) => t.n), 10)),
      minY: n(content.minY, minY),
      maxY: n(content.maxY, maxY),
    };
  }, [terms, content.minX, content.maxX, content.minY, content.maxY, limitValue]);

  const svgWidth = 600;
  const svgHeight = 400;
  const padding = 40;

  const xScale = (n) =>
    padding + ((n - dims.minX) / (dims.maxX - dims.minX || 1)) * (svgWidth - 2 * padding);
  const yScale = (value) =>
    svgHeight - padding - ((value - dims.minY) / (dims.maxY - dims.minY || 1)) * (svgHeight - 2 * padding);

  const generateTicks = (min, max, count) =>
    Array.from({ length: count + 1 }, (_, i) => min + (i * (max - min)) / count);

  const xTicks = generateTicks(dims.minX, dims.maxX, 10);
  const yTicks = generateTicks(dims.minY, dims.maxY, 5);
  const axisY = Math.min(Math.max(yScale(0), padding), svgHeight - padding);
  const axisX = Math.min(Math.max(xScale(0), padding), svgWidth - padding);

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 overflow-x-auto">
      <svg
        width={svgWidth}
        height={svgHeight}
        className="border border-gray-300 rounded"
        style={{ backgroundColor: "#fafafa" }}
      >
        {content.showGrid !== false && (
          <g>
            {xTicks.map((x) => (
              <line key={`vgrid-${x}`} x1={xScale(x)} y1={padding} x2={xScale(x)} y2={svgHeight - padding} stroke="#e5e5e5" strokeWidth="1" />
            ))}
            {yTicks.map((y) => (
              <line key={`hgrid-${y}`} x1={padding} y1={yScale(y)} x2={svgWidth - padding} y2={yScale(y)} stroke="#e5e5e5" strokeWidth="1" />
            ))}
          </g>
        )}

        {/* Axes */}
        <g>
          <line x1={padding} y1={axisY} x2={svgWidth - padding} y2={axisY} stroke="#4a5568" strokeWidth="2" />
          <line x1={axisX} y1={padding} x2={axisX} y2={svgHeight - padding} stroke="#4a5568" strokeWidth="2" />
          <polygon points={`${svgWidth - padding},${axisY} ${svgWidth - padding - 8},${axisY - 4} ${svgWidth - padding - 8},${axisY + 4}`} fill="#4a5568" />
          <polygon points={`${axisX},${padding} ${axisX - 4},${padding + 8} ${axisX + 4},${padding + 8}`} fill="#4a5568" />
        </g>

        {/* Graduations */}
        <g>
          {xTicks
            .filter((x) => Number.isInteger(x) && x >= 0)
            .map((x) => (
              <g key={`xtick-${x}`}>
                <line x1={xScale(x)} y1={axisY - 3} x2={xScale(x)} y2={axisY + 3} stroke="#4a5568" />
                <text x={xScale(x)} y={axisY + 15} textAnchor="middle" fontSize="12" fill="#4a5568">
                  {x}
                </text>
              </g>
            ))}
          {yTicks
            .filter((y) => Math.abs(y) > 0.001)
            .map((y) => (
              <g key={`ytick-${y}`}>
                <line x1={axisX - 3} y1={yScale(y)} x2={axisX + 3} y2={yScale(y)} stroke="#4a5568" />
                <text x={axisX - 10} y={yScale(y) + 4} textAnchor="end" fontSize="12" fill="#4a5568">
                  {parseFloat(y.toFixed(2))}
                </text>
              </g>
            ))}
        </g>

        {/* Limite */}
        {Number.isFinite(limitValue) && (
          <g>
            <line x1={padding} y1={yScale(limitValue)} x2={svgWidth - padding} y2={yScale(limitValue)} stroke="#ef4444" strokeWidth="2" strokeDasharray="5,5" />
            <text x={svgWidth - padding - 50} y={yScale(limitValue) - 5} fill="#ef4444" fontSize="12" fontWeight="bold">
              L = {limitValue}
            </text>
          </g>
        )}

        {content.connectPoints && terms.length > 1 && (
          <polyline
            points={terms.map((t) => `${xScale(t.n)},${yScale(t.value)}`).join(" ")}
            fill="none"
            stroke="#cbd5e0"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        )}

        <g>
          {terms.map((term, index) => (
            <g key={`point-${term.n}`}>
              <circle cx={xScale(term.n)} cy={yScale(term.value)} r="4" fill="#667eea" stroke="#4c51bf" strokeWidth="2" />
              {content.showValues && index < 10 && (
                <text x={xScale(term.n)} y={yScale(term.value) - 8} textAnchor="middle" fontSize="10" fill="#4c51bf">
                  {parseFloat(term.value.toFixed(2))}
                </text>
              )}
            </g>
          ))}
        </g>

        <g>
          <text x={svgWidth - padding} y={axisY - 10} textAnchor="end" fontSize="14" fill="#2d3748" fontWeight="bold">
            n
          </text>
          <text x={axisX + 10} y={padding + 15} textAnchor="start" fontSize="14" fill="#2d3748" fontWeight="bold">
            uₙ
          </text>
        </g>
      </svg>

      {terms.length === 0 && (
        <p className="text-xs text-red-600 mt-2">
          Aucun terme calculable : vérifiez la formule (ex. <code>n^2/(n+1)</code>, <code>0.5*u_n + 2</code>).
        </p>
      )}
    </div>
  );
};

export default DiscreteGraphRenderer;
