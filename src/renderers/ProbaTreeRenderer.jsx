import { useMemo } from "react";
import { evalMath } from "../utils/mathExpr";
import MathText from "../utils/mathRenderer";

const LEVEL_WIDTH = 180;
const LEAF_HEIGHT = 64;
const PAD_X = 70;
const PAD_Y = 24;
const LABEL_W = 150;

/** Calcule la position (profondeur, rangée) de chaque nœud. */
const buildLayout = (nodes) => {
  const ids = new Set(nodes.map((n) => n.id));
  const byParent = new Map();
  const roots = [];

  nodes.forEach((n) => {
    const hasParent =
      !n.isRoot && n.parent !== undefined && n.parent !== null && ids.has(n.parent);
    if (!hasParent) {
      roots.push(n);
    } else {
      if (!byParent.has(n.parent)) byParent.set(n.parent, []);
      byParent.get(n.parent).push(n);
    }
  });

  const positions = new Map();
  const visited = new Set();
  let leafCount = 0;
  let maxDepth = 0;

  const visit = (node, depth) => {
    if (visited.has(node.id)) return leafCount;
    visited.add(node.id);
    maxDepth = Math.max(maxDepth, depth);
    const children = byParent.get(node.id) || [];
    let row;
    if (children.length === 0) {
      row = leafCount++;
    } else {
      const rows = children.map((c) => visit(c, depth + 1));
      row = (rows[0] + rows[rows.length - 1]) / 2;
    }
    positions.set(node.id, { depth, row, isLeaf: children.length === 0 });
    return row;
  };
  roots.forEach((r) => visit(r, 0));

  return { positions, leafCount: Math.max(leafCount, 1), maxDepth, byParent };
};

const ProbaTreeRenderer = ({ content, variables }) => {
  const nodes = useMemo(
    () => (Array.isArray(content.nodes) ? content.nodes : []),
    [content.nodes],
  );
  const layout = useMemo(() => buildLayout(nodes), [nodes]);

  if (nodes.length === 0) return null;

  const { positions, leafCount, maxDepth } = layout;
  const width = PAD_X * 2 + LEVEL_WIDTH * maxDepth + LABEL_W;
  const height = PAD_Y * 2 + LEAF_HEIGHT * leafCount;
  const X = (depth) => PAD_X + depth * LEVEL_WIDTH;
  const Y = (row) => PAD_Y + row * LEAF_HEIGHT + LEAF_HEIGHT / 2;

  const byId = new Map(nodes.map((n) => [n.id, n]));

  // Probabilité d'un chemin racine -> nœud (produit des probas numériques)
  const pathProbability = (node) => {
    let p = 1;
    let current = node;
    let guard = 0;
    while (current && current.parent !== undefined && guard++ < 100) {
      const v = evalMath(current.proba, variables);
      if (!Number.isFinite(v)) return NaN;
      p *= v;
      current = byId.get(current.parent);
    }
    return p;
  };

  const Label = ({ x, y, w = LABEL_W, align = "left", children, className = "" }) => (
    <foreignObject x={x} y={y - 12} width={w} height={24} style={{ overflow: "visible" }}>
      <div
        className={`text-sm leading-6 whitespace-nowrap ${
          align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
        } ${className}`}
      >
        {children}
      </div>
    </foreignObject>
  );

  return (
    <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200 overflow-x-auto">
      <svg
        width={width}
        height={height}
        className="bg-white rounded border border-gray-300"
        style={{ minWidth: width }}
      >
        {/* Branches */}
        {nodes.map((node) => {
          const pos = positions.get(node.id);
          const parent = byId.get(node.parent);
          const parentPos = parent && positions.get(parent.id);
          if (!pos || !parentPos) return null;
          const x1 = X(parentPos.depth);
          const y1 = Y(parentPos.row);
          const x2 = X(pos.depth);
          const y2 = Y(pos.row);
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          return (
            <g key={`branch-${node.id}`}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3a7bd5" strokeWidth="2" />
              {node.proba !== undefined && String(node.proba).trim() !== "" && (
                <Label x={mx - 40} y={my - 10} w={80} align="center" className="text-gray-600">
                  <span className="bg-white px-1 rounded">
                    <MathText content={`$${node.proba}$`} variables={variables} />
                  </span>
                </Label>
              )}
            </g>
          );
        })}

        {/* Nœuds */}
        {nodes.map((node) => {
          const pos = positions.get(node.id);
          if (!pos) return null;
          const x = X(pos.depth);
          const y = Y(pos.row);
          const isRoot = pos.depth === 0;
          // Label en texte (utiliser $...$ dans le label pour du LaTeX, ex. $\bar{A}$)
          const label = node.label ? <MathText content={node.label} variables={variables} /> : null;
          const pathP = content.showPathProbabilities && pos.isLeaf ? pathProbability(node) : NaN;

          return (
            <g key={`node-${node.id}`}>
              <circle cx={x} cy={y} r="4" fill="#3a7bd5" />
              {isRoot ? (
                <Label x={x - 8 - 60} y={y} w={60} align="right" className="font-bold">
                  {label}
                </Label>
              ) : (
                <Label x={x + 8} y={y} className="font-bold">
                  {label}
                  {Number.isFinite(pathP) && (
                    <span className="ml-3 font-normal text-xs text-gray-500">
                      P = {parseFloat(pathP.toFixed(4))}
                    </span>
                  )}
                </Label>
              )}
            </g>
          );
        })}
      </svg>

      <div className="mt-3 p-2 bg-white rounded border border-green-300">
        <p className="text-xs text-gray-700">
          <strong>Lecture :</strong> la probabilité d'un chemin est le produit des probabilités
          des branches parcourues.
        </p>
      </div>
    </div>
  );
};

export default ProbaTreeRenderer;
