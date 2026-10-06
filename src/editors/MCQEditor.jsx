import { Plus, Trash2 } from "lucide-react";
import { useId } from "react";

const MCQEditor = ({ content, onUpdate }) => {
  // Un groupe radio par éditeur : plusieurs QCM sur la page ne se parasitent pas
  const radioGroup = useId();

  const safeContent = {
    question: "",
    options: [],
    multipleChoice: false,
    points: 1,
    hint: "",
    explanation: "",
    ...content,
  };
  const options = Array.isArray(safeContent.options) ? safeContent.options : [];

  const update = (patch) => onUpdate({ ...safeContent, ...patch });
  const setOptions = (next) => update({ options: next });

  const updateOption = (index, field, value) =>
    setOptions(options.map((opt, i) => (i === index ? { ...opt, [field]: value } : opt)));

  const setCorrect = (index, checked) =>
    setOptions(
      options.map((opt, i) => ({
        ...opt,
        correct: safeContent.multipleChoice ? (i === index ? checked : !!opt.correct) : i === index,
      })),
    );

  const addOption = () => setOptions([...options, { text: "", correct: false }]);

  const removeOption = (index) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const hasCorrectAnswer = options.some((opt) => opt.correct);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium">Question QCM</label>
        <textarea
          className="w-full p-2 border rounded text-sm"
          rows="2"
          value={safeContent.question}
          onChange={(e) => update({ question: e.target.value })}
          placeholder="Question du QCM. Utilisez @a, @b pour les variables et $...$ pour le LaTeX"
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={!!safeContent.multipleChoice}
            onChange={(e) => update({ multipleChoice: e.target.checked })}
          />
          Plusieurs réponses possibles
        </label>

        <div>
          <label className="text-xs font-medium mr-2">Points :</label>
          <input
            type="number"
            className="w-16 p-1 border rounded text-sm"
            value={safeContent.points ?? ""}
            min="0.5"
            step="0.5"
            onChange={(e) =>
              update({ points: e.target.value === "" ? "" : parseFloat(e.target.value) })
            }
            onBlur={(e) => {
              if (!(parseFloat(e.target.value) > 0)) update({ points: 1 });
            }}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-medium">Options de réponse</label>
          <button
            type="button"
            onClick={addOption}
            className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
          >
            <Plus size={14} />
            Option
          </button>
        </div>

        {!hasCorrectAnswer && (
          <div className="mb-2 p-2 bg-yellow-50 border border-yellow-300 rounded text-xs text-yellow-800">
            ⚠️ Aucune réponse correcte sélectionnée !
          </div>
        )}

        <div className="space-y-2">
          {options.map((opt, i) => (
            <div
              key={opt.id ?? i}
              className={`flex gap-2 items-center p-2 rounded ${
                opt.correct
                  ? "bg-green-50 border-2 border-green-300"
                  : "bg-gray-50 border border-gray-200"
              }`}
            >
              <input
                type={safeContent.multipleChoice ? "checkbox" : "radio"}
                name={radioGroup}
                checked={!!opt.correct}
                onChange={(e) => setCorrect(i, e.target.checked)}
              />
              <input
                className="flex-1 p-1 border rounded text-sm"
                value={opt.text ?? ""}
                onChange={(e) => updateOption(i, "text", e.target.value)}
                placeholder={`Option ${i + 1} (@a, @b et $...$ acceptés)`}
              />
              {opt.correct && <span className="text-green-600 text-sm font-bold">✓</span>}
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium">💡 Indice (optionnel)</label>
        <input
          type="text"
          className="w-full p-1 border rounded text-sm"
          value={safeContent.hint || ""}
          onChange={(e) => update({ hint: e.target.value })}
          placeholder="Pensez à utiliser la formule..."
        />
      </div>

      <div>
        <label className="text-xs font-medium">📝 Explication (après correction)</label>
        <textarea
          className="w-full p-2 border rounded text-sm"
          rows="2"
          value={safeContent.explanation || ""}
          onChange={(e) => update({ explanation: e.target.value })}
          placeholder="Explication de la bonne réponse..."
        />
      </div>
    </div>
  );
};

export default MCQEditor;
