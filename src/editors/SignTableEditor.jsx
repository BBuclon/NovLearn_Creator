import React from "react";
import { Plus, Trash2 } from "lucide-react";

const SignTableEditor = ({ content, onUpdate }) => {
  // Ancien format : le signe était porté par chaque point (signAfter / signNext)
  const legacySigns = content?.points
    ? content.points.slice(0, -1).map((pt) => pt.signAfter ?? pt.signNext ?? "+")
    : ["+", "-"];

  const safeContent = {
    variable: "x",
    function: "f(x)",
    points: [
      { x: "-\\infty", type: "boundary" },
      { x: "x_1", type: "zero" },
      { x: "+\\infty", type: "boundary" },
    ],
    ...content,
    signs: content?.signs ?? legacySigns,
  };

  const updateField = (field, value) =>
    onUpdate({ ...safeContent, [field]: value });

  const updatePoint = (index, field, value) => {
    const newPoints = [...safeContent.points];
    newPoints[index] = { ...newPoints[index], [field]: value };
    onUpdate({ ...safeContent, points: newPoints });
  };

  const updateSign = (index, value) => {
    const newSigns = [...safeContent.signs];
    newSigns[index] = value;
    onUpdate({ ...safeContent, signs: newSigns });
  };

  const addPoint = () => {
    const pts = [...safeContent.points];
    const sgns = [...safeContent.signs];
    const last = pts.pop();
    pts.push({ x: "", type: "zero" });
    pts.push(last);
    sgns.push("+");
    onUpdate({ ...safeContent, points: pts, signs: sgns });
  };

  const removePoint = (index) => {
    const pts = safeContent.points.filter((_, i) => i !== index);
    const sgns = [...safeContent.signs];
    // Supprimer le signe de l'intervalle après le point supprimé
    sgns.splice(index, 1);
    onUpdate({ ...safeContent, points: pts, signs: sgns });
  };

  return (
    <div className="space-y-5">
      {/* Entêtes */}
      <div className="flex gap-4">
        <div className="w-1/2">
          <label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">
            Variable (ligne 1)
          </label>
          <input
            className="w-full p-1.5 border rounded text-sm font-mono"
            value={safeContent.variable}
            onChange={(e) => updateField("variable", e.target.value)}
          />
        </div>
        <div className="w-1/2">
          <label className="block text-[10px] text-gray-500 font-bold uppercase mb-1">
            Fonction (ligne 2)
          </label>
          <input
            className="w-full p-1.5 border rounded text-sm font-mono"
            value={safeContent.function}
            onChange={(e) => updateField("function", e.target.value)}
          />
        </div>
      </div>

      {/* Points remarquables */}
      <div>
        <label className="block text-[10px] text-gray-500 font-bold uppercase mb-2">
          Points remarquables
        </label>
        <div className="space-y-2">
          {safeContent.points.map((pt, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === safeContent.points.length - 1;
            return (
              <div
                key={idx}
                className="flex gap-2 items-center bg-gray-50 p-2 rounded border border-gray-200"
              >
                <div className="w-1/2">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">
                    Valeur de x
                  </label>
                  <input
                    className="w-full p-1.5 border rounded font-mono text-sm"
                    value={pt.x}
                    onChange={(e) => updatePoint(idx, "x", e.target.value)}
                    placeholder="-\infty"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">
                    Type
                  </label>
                  <select
                    className="w-full p-1.5 border rounded text-sm bg-white"
                    value={pt.type}
                    onChange={(e) => updatePoint(idx, "type", e.target.value)}
                  >
                    <option value="boundary">Borne</option>
                    <option value="zero">Zéro (0)</option>
                    <option value="forbidden">Interdit (||)</option>
                  </select>
                </div>
                <div className="w-8 flex justify-center mt-4">
                  {!isFirst && !isLast && (
                    <button
                      onClick={() => removePoint(idx)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <button
          onClick={addPoint}
          className="mt-2 flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          <Plus size={16} /> Ajouter un point
        </button>
      </div>

      {/* Signes par intervalle */}
      <div>
        <label className="block text-[10px] text-gray-500 font-bold uppercase mb-2">
          Signes par intervalle
        </label>
        <div className="flex flex-wrap gap-2 items-center bg-gray-50 p-3 rounded border border-gray-200">
          {safeContent.points.map((pt, idx) => (
            <React.Fragment key={idx}>
              <span className="text-xs font-mono text-gray-700 bg-white border rounded px-2 py-1 max-w-[72px] truncate">
                {pt.x || "…"}
              </span>
              {idx < safeContent.signs.length && (
                <select
                  className="p-1.5 border border-blue-300 bg-blue-50 rounded text-sm font-bold text-blue-700 w-14 text-center"
                  value={safeContent.signs[idx]}
                  onChange={(e) => updateSign(idx, e.target.value)}
                >
                  <option value="+">+</option>
                  <option value="-">−</option>
                  <option value="?">?</option>
                </select>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SignTableEditor;
