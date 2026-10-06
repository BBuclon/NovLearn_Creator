const ComplexPlaneEditor = ({ content, onUpdate }) => {
  const safeContent = {
    showGrid: true,
    showLabels: true,
    showModulus: false,
    showArgument: false,
    ...content,
    points: Array.isArray(content?.points) ? content.points : [],
  };
  const points = safeContent.points;

  const update = (patch) => onUpdate({ ...safeContent, ...patch });

  const updatePoint = (index, field, value) =>
    update({ points: points.map((p, i) => (i === index ? { ...p, [field]: value } : p)) });

  const addPoint = () =>
    update({ points: [...points, { name: `z${points.length + 1}`, re: "0", im: "0" }] });

  const removePoint = (index) => update({ points: points.filter((_, i) => i !== index) });

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-medium">Points complexes</p>
        <button
          type="button"
          onClick={addPoint}
          className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
        >
          + Point
        </button>
      </div>

      <div className="space-y-2">
        {points.map((pt, i) => (
          <div key={i} className="border border-gray-200 rounded p-2 bg-gray-50">
            <div className="flex gap-1 items-center">
              <input
                className="w-16 p-1 border rounded text-sm font-bold"
                value={pt.name ?? ""}
                onChange={(e) => updatePoint(i, "name", e.target.value)}
                placeholder="z1"
              />
              <span className="text-sm px-2">=</span>
              <input
                className="flex-1 p-1 border rounded text-sm"
                value={pt.re ?? ""}
                onChange={(e) => updatePoint(i, "re", e.target.value)}
                placeholder="Partie réelle"
              />
              <span className="text-sm px-2">+</span>
              <input
                className="flex-1 p-1 border rounded text-sm"
                value={pt.im ?? ""}
                onChange={(e) => updatePoint(i, "im", e.target.value)}
                placeholder="Partie imaginaire"
              />
              <span className="text-sm px-2">i</span>
              {points.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePoint(i)}
                  className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs font-medium">Afficher</label>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={safeContent.showGrid !== false}
            onChange={(e) => update({ showGrid: e.target.checked })}
          />
          Grille
        </label>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={safeContent.showLabels !== false}
            onChange={(e) => update({ showLabels: e.target.checked })}
          />
          Labels
        </label>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={!!safeContent.showModulus}
            onChange={(e) => update({ showModulus: e.target.checked })}
          />
          Module
        </label>
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={!!safeContent.showArgument}
            onChange={(e) => update({ showArgument: e.target.checked })}
          />
          Argument
        </label>
      </div>
    </div>
  );
};

export default ComplexPlaneEditor;
