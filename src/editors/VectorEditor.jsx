const VectorEditor = ({ content, onUpdate }) => {
  const safeContent = {
    dimension: "2D",
    showNorm: false,
    showCoordinates: true,
    ...content,
    vectors: Array.isArray(content?.vectors) ? content.vectors : [],
  };
  const vectors = safeContent.vectors;
  const is3D = safeContent.dimension === "3D";

  const update = (patch) => onUpdate({ ...safeContent, ...patch });

  const updateVector = (index, field, value) =>
    update({ vectors: vectors.map((v, i) => (i === index ? { ...v, [field]: value } : v)) });

  const addVector = () =>
    update({
      vectors: [
        ...vectors,
        { name: `v${vectors.length + 1}`, x: "0", y: "0", ...(is3D ? { z: "0" } : {}) },
      ],
    });

  const removeVector = (index) => update({ vectors: vectors.filter((_, i) => i !== index) });

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <label className="text-xs font-medium">Dimension</label>
        <select
          className="p-1 border rounded text-sm"
          value={safeContent.dimension}
          onChange={(e) => update({ dimension: e.target.value })}
        >
          <option value="2D">2D</option>
          <option value="3D">3D</option>
        </select>
        <span className="text-xs text-gray-500">
          Coordonnées : nombres ou expressions (<code>@a</code>, <code>2*@b-1</code>, <code>sqrt(2)</code>)
        </span>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm font-medium">Vecteurs</p>
        <button
          type="button"
          onClick={addVector}
          className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
        >
          + Vecteur
        </button>
      </div>

      <div className="space-y-2">
        {vectors.map((v, i) => (
          <div key={i} className="border border-gray-200 rounded p-2 bg-gray-50">
            <div className="flex gap-1 items-center">
              <input
                className="w-14 p-1 border rounded text-sm font-bold"
                value={v.name ?? ""}
                onChange={(e) => updateVector(i, "name", e.target.value)}
                placeholder="u"
              />
              <span className="text-sm">= (</span>
              <input
                className="flex-1 p-1 border rounded text-sm"
                value={v.x ?? ""}
                onChange={(e) => updateVector(i, "x", e.target.value)}
                placeholder="x"
              />
              <span className="text-sm">;</span>
              <input
                className="flex-1 p-1 border rounded text-sm"
                value={v.y ?? ""}
                onChange={(e) => updateVector(i, "y", e.target.value)}
                placeholder="y"
              />
              {is3D && (
                <>
                  <span className="text-sm">;</span>
                  <input
                    className="flex-1 p-1 border rounded text-sm"
                    value={v.z ?? "0"}
                    onChange={(e) => updateVector(i, "z", e.target.value)}
                    placeholder="z"
                  />
                </>
              )}
              <span className="text-sm">)</span>
              {vectors.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVector(i)}
                  className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 items-center">
        <label className="text-xs font-medium">Options</label>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={!!safeContent.showNorm}
            onChange={(e) => update({ showNorm: e.target.checked })}
          />
          Afficher la norme
        </label>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={!!safeContent.showCoordinates}
            onChange={(e) => update({ showCoordinates: e.target.checked })}
          />
          Coordonnées
        </label>
      </div>
    </div>
  );
};

export default VectorEditor;
