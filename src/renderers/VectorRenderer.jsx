import { evalMath } from "../utils/mathExpr";

const num = (expr, variables) => {
  const v = evalMath(expr, variables);
  return Number.isFinite(v) ? v : 0;
};

const VectorRenderer = ({ content, variables }) => {
  const is3D = content.dimension === "3D";
  const vectors = Array.isArray(content.vectors) ? content.vectors : [];

  const evaluatedVectors = vectors.map((v) => ({
    name: v.name,
    x: num(v.x, variables),
    y: num(v.y, variables),
    z: is3D ? num(v.z, variables) : 0,
  }));

  const calculateNorm = (v) => Math.sqrt(v.x * v.x + v.y * v.y + (is3D ? v.z * v.z : 0));

  const width = 400;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;

  if (is3D) {
    const scale = 30;
    const angle = Math.PI / 6;
    const project3D = (x, y, z) => ({
      x: centerX + scale * (x - z * Math.cos(angle)),
      y: centerY - scale * (y - z * Math.sin(angle)),
    });
    const zAxis = project3D(0, 0, 3.5);

    return (
      <svg width={width} height={height} className="border-2 border-gray-300 bg-white rounded">
        <defs>
          <marker id="arrowhead3d" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#3a7bd5" />
          </marker>
        </defs>

        <line x1={centerX} y1={centerY} x2={centerX + 100} y2={centerY} stroke="#666" strokeWidth="2" />
        <text x={centerX + 105} y={centerY + 5} fontSize="12">x</text>
        <line x1={centerX} y1={centerY} x2={centerX} y2={centerY - 100} stroke="#666" strokeWidth="2" />
        <text x={centerX + 5} y={centerY - 105} fontSize="12">y</text>
        <line x1={centerX} y1={centerY} x2={zAxis.x} y2={zAxis.y} stroke="#666" strokeWidth="2" />
        <text x={zAxis.x - 10} y={zAxis.y} fontSize="12">z</text>

        {evaluatedVectors.map((v, i) => {
          const end = project3D(v.x, v.y, v.z);
          return (
            <g key={i}>
              <line x1={centerX} y1={centerY} x2={end.x} y2={end.y} stroke="#3a7bd5" strokeWidth="3" markerEnd="url(#arrowhead3d)" />
              <text x={end.x + 10} y={end.y} fontSize="14" fontWeight="bold" fill="#3a7bd5">{v.name}</text>
              {content.showCoordinates && (
                <text x={end.x + 10} y={end.y + 15} fontSize="11" fill="#666">
                  ({v.x.toFixed(1)}, {v.y.toFixed(1)}, {v.z.toFixed(1)})
                </text>
              )}
              {content.showNorm && (
                <text x={end.x + 10} y={end.y + 30} fontSize="11" fill="#666">
                  ‖{v.name}‖ = {calculateNorm(v).toFixed(2)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  // 2D : échelle adaptée à la plus grande coordonnée
  const maxCoord = Math.max(4, ...evaluatedVectors.flatMap((v) => [Math.abs(v.x), Math.abs(v.y)]));
  const unit = Math.ceil(maxCoord);
  const scale = (width / 2 - 20) / unit;

  return (
    <svg width={width} height={height} className="border-2 border-gray-300 bg-white rounded">
      <defs>
        <marker id="arrowhead2d" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#3a7bd5" />
        </marker>
      </defs>

      {/* Grille */}
      {Array.from({ length: 2 * unit + 1 }).map((_, i) => {
        const offset = (i - unit) * scale;
        return (
          <g key={i}>
            <line x1={centerX + offset} y1="0" x2={centerX + offset} y2={height} stroke="#e0e0e0" strokeWidth="1" />
            <line x1="0" y1={centerY + offset} x2={width} y2={centerY + offset} stroke="#e0e0e0" strokeWidth="1" />
          </g>
        );
      })}

      {/* Axes */}
      <line x1="0" y1={centerY} x2={width} y2={centerY} stroke="#000" strokeWidth="2" />
      <line x1={centerX} y1="0" x2={centerX} y2={height} stroke="#000" strokeWidth="2" />
      <text x={centerX + scale + 2} y={centerY + 12} fontSize="10" fill="#666">1</text>
      <text x={centerX - 12} y={centerY - scale + 4} fontSize="10" fill="#666">1</text>

      {evaluatedVectors.map((v, i) => {
        const endX = centerX + v.x * scale;
        const endY = centerY - v.y * scale;
        return (
          <g key={i}>
            <line x1={centerX} y1={centerY} x2={endX} y2={endY} stroke="#3a7bd5" strokeWidth="3" markerEnd="url(#arrowhead2d)" />
            <text x={endX + 10} y={endY} fontSize="14" fontWeight="bold" fill="#3a7bd5">{v.name}</text>
            {content.showCoordinates && (
              <text x={endX + 10} y={endY + 15} fontSize="11" fill="#666">
                ({parseFloat(v.x.toFixed(2))}, {parseFloat(v.y.toFixed(2))})
              </text>
            )}
            {content.showNorm && (
              <text x={endX + 10} y={endY + 30} fontSize="11" fill="#666">
                ‖{v.name}‖ = {calculateNorm(v).toFixed(2)}
              </text>
            )}
          </g>
        );
      })}

      <text x={width - 20} y={centerY - 10} fontSize="14" fontWeight="bold">x</text>
      <text x={centerX + 10} y="20" fontSize="14" fontWeight="bold">y</text>
    </svg>
  );
};

export default VectorRenderer;
