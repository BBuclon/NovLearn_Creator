const StatsTableEditor = ({ content, onUpdate }) => {
  const headers = Array.isArray(content?.headers) && content.headers.length > 0
    ? content.headers
    : ["Valeur", "Effectif"];
  const rows = Array.isArray(content?.rows) ? content.rows : [];
  const safeContent = { ...content, headers, rows };

  const update = (patch) => onUpdate({ ...safeContent, ...patch });

  const updateHeader = (index, value) =>
    update({ headers: headers.map((h, i) => (i === index ? value : h)) });

  const updateCell = (rowIndex, colIndex, value) =>
    update({
      rows: rows.map((row, r) =>
        r === rowIndex ? row.map((cell, c) => (c === colIndex ? value : cell)) : row,
      ),
    });

  const addRow = () => update({ rows: [...rows, new Array(headers.length).fill("")] });

  const addColumn = () =>
    update({
      headers: [...headers, `Col ${headers.length + 1}`],
      rows: rows.map((row) => [...row, ""]),
    });

  const removeRow = (index) => update({ rows: rows.filter((_, i) => i !== index) });

  const removeColumn = (index) =>
    update({
      headers: headers.filter((_, i) => i !== index),
      rows: rows.map((row) => row.filter((_, i) => i !== index)),
    });

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={addRow}
          className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
        >
          + Ligne
        </button>
        <button
          type="button"
          onClick={addColumn}
          className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
        >
          + Colonne
        </button>
        <span className="text-xs text-gray-500">
          Les cellules acceptent <code>@a</code> et le LaTeX (<code>$...$</code>).
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              {headers.map((header, i) => (
                <th key={i} className="p-1">
                  <div className="flex items-center gap-1">
                    <input
                      className="w-full p-1 border rounded text-center font-bold"
                      value={header}
                      onChange={(e) => updateHeader(i, e.target.value)}
                    />
                    {headers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColumn(i)}
                        className="px-1 text-red-500 hover:text-red-700"
                        title="Supprimer la colonne"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {headers.map((_, j) => (
                  <td key={j} className="p-1">
                    <input
                      className="w-full p-1 border rounded text-center"
                      value={row[j] ?? ""}
                      onChange={(e) => updateCell(i, j, e.target.value)}
                    />
                  </td>
                ))}
                <td className="p-1">
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="px-1 text-red-500 hover:text-red-700"
                      title="Supprimer la ligne"
                    >
                      ×
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatsTableEditor;
