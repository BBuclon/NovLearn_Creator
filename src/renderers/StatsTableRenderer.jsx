import MathText from "../utils/mathRenderer";

const StatsTableRenderer = ({ content, variables }) => {
  const headers = Array.isArray(content.headers) ? content.headers : [];
  const rows = Array.isArray(content.rows) ? content.rows : [];

  if (headers.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-2 border-gray-800 border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {headers.map((h, i) => (
              <th key={i} className="border border-gray-800 p-2 font-bold text-center">
                <MathText content={h} variables={variables} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              {headers.map((_, j) => (
                <td key={j} className="border border-gray-800 p-2 text-center">
                  <MathText content={row?.[j] ?? ""} variables={variables} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StatsTableRenderer;
