import { evalMath } from "../utils/mathExpr";

const num = (expr, variables) => {
  const v = evalMath(expr, variables);
  return Number.isFinite(v) ? v : 0;
};

const ComplexPlaneRenderer = ({ content, variables }) => {
  const width = 400;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;

  const points = Array.isArray(content.points) ? content.points : [];
  const evaluatedPoints = points.map((pt) => ({
    name: pt.name,
    re: num(pt.re, variables),
    im: num(pt.im, variables),
  }));

  // Échelle adaptée au point le plus éloigné
  const maxCoord = Math.max(5, ...evaluatedPoints.flatMap((p) => [Math.abs(p.re), Math.abs(p.im)]));
  const unit = Math.ceil(maxCoord);
  const scale = (width / 2 - 20) / unit;
  const ticks = Array.from({ length: 2 * unit + 1 }, (_, i) => i - unit);

  return (
    <svg width={width} height={height} className="border-2 border-gray-300 bg-white rounded">
      {/* Grille */}
      {content.showGrid !== false &&
        ticks.map((value) => (
          <g key={`grid-${value}`}>
            <line x1={centerX + value * scale} y1="0" x2={centerX + value * scale} y2={height} stroke="#e0e0e0" strokeWidth="1" />
            <line x1="0" y1={centerY + value * scale} x2={width} y2={centerY + value * scale} stroke="#e0e0e0" strokeWidth="1" />
          </g>
        ))}

      {/* Axes */}
      <line x1="0" y1={centerY} x2={width} y2={centerY} stroke="#666" strokeWidth="2" />
      <line x1={centerX} y1="0" x2={centerX} y2={height} stroke="#666" strokeWidth="2" />

      {/* Graduations (allégées si trop nombreuses) */}
      {ticks
        .filter((v) => v !== 0 && (unit <= 8 || v % 2 === 0))
        .map((value) => (
          <g key={`grad-${value}`}>
            <text x={centerX + value * scale} y={centerY + 15} fontSize="10" textAnchor="middle" fill="#666">
              {value}
            </text>
            <text x={centerX - 15} y={centerY - value * scale + 3} fontSize="10" textAnchor="middle" fill="#666">
              {value}i
            </text>
          </g>
        ))}

      {/* Points */}
      {evaluatedPoints.map((pt, i) => {
        const x = centerX + pt.re * scale;
        const y = centerY - pt.im * scale;
        const modulus = Math.sqrt(pt.re * pt.re + pt.im * pt.im);
        const angle = (Math.atan2(pt.im, pt.re) * 180) / Math.PI;

        return (
          <g key={i}>
            <line x1={centerX} y1={centerY} x2={x} y2={y} stroke="#3a7bd5" strokeWidth="2" strokeDasharray="5,5" />
            <circle cx={x} cy={y} r="5" fill="#3a7bd5" />
            {content.showLabels !== false && (
              <text x={x + 10} y={y - 10} fontSize="14" fontWeight="bold" fill="#3a7bd5">
                {pt.name}
              </text>
            )}
            {content.showModulus && (
              <text x={x + 10} y={y + 20} fontSize="11" fill="#666">
                |{pt.name}| = {parseFloat(modulus.toFixed(2))}
              </text>
            )}
            {content.showArgument && (
              <text x={x + 10} y={y + 35} fontSize="11" fill="#666">
                arg({pt.name}) = {angle.toFixed(0)}°
              </text>
            )}
          </g>
        );
      })}

      <text x={width - 30} y={centerY - 10} fontSize="14" fontWeight="bold">Re</text>
      <text x={centerX + 10} y="20" fontSize="14" fontWeight="bold">Im</text>
      <circle cx={centerX} cy={centerY} r="3" fill="#000" />
      <text x={centerX - 10} y={centerY + 15} fontSize="10">O</text>
    </svg>
  );
};

export default ComplexPlaneRenderer;
