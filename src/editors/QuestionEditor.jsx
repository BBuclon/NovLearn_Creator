import { BookOpen, Lightbulb } from "lucide-react";

const QuestionEditor = ({ content, onUpdate }) => {
  const safeContent = {
    question: "",
    answerFormat: "number",
    correctAnswer: "",
    explanation: "",
    hint: "",
    points: 1,
    ...content,
  };

  const update = (field, value) => onUpdate({ ...safeContent, [field]: value });

  return (
    <div className="space-y-4">
      {/* 1. ÉNONCÉ */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Énoncé de la question</label>
        <textarea
          className="w-full p-2 border rounded font-sans text-sm min-h-[60px]"
          value={safeContent.question}
          onChange={(e) => update("question", e.target.value)}
          placeholder="Ex: Résoudre dans $\mathbb{R}$ l'équation $f(x) = 0$"
        />
      </div>

      {/* 2. TYPE DE RÉPONSE */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Format attendu
          </label>
          <select
            className="w-full p-2 border rounded bg-white text-sm"
            value={safeContent.answerFormat}
            onChange={(e) => update("answerFormat", e.target.value)}
          >
            <option value="number">Nombre (Ex: 4.5)</option>
            <option value="set">Ensemble (Ex: -1; 3)</option>
            <option value="interval">Intervalle (Ex: ]-\infty; 5])</option>
            <option value="expression">Formule (Ex: 2x+1)</option>
            <option value="text">Texte libre</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Points</label>
          <input
            type="number"
            className="w-full p-2 border rounded text-sm"
            value={safeContent.points ?? ""}
            onChange={(e) =>
              update("points", e.target.value === "" ? "" : parseFloat(e.target.value))
            }
            onBlur={(e) => {
              if (!(parseFloat(e.target.value) > 0)) update("points", 1);
            }}
            min="0.5"
            step="0.5"
          />
        </div>
      </div>

      {/* 3. SOLUTION */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
        <label className="block text-sm font-bold text-blue-900 mb-2">Solution attendue</label>

        <div className="flex items-center gap-2">
          {safeContent.answerFormat === "set" && (
            <span className="font-bold text-blue-800 text-lg">S = {"{"}</span>
          )}
          {safeContent.answerFormat === "interval" && (
            <span className="font-bold text-blue-800 text-lg">x ∈</span>
          )}

          <input
            type="text"
            className="flex-1 p-2 border border-blue-300 rounded font-mono text-sm outline-none focus:border-blue-500"
            value={safeContent.correctAnswer || ""}
            onChange={(e) => update("correctAnswer", e.target.value)}
            placeholder={
              safeContent.answerFormat === "set"
                ? "@x1; @x2"
                : safeContent.answerFormat === "interval"
                  ? "]-\\infty; 2]"
                  : "Valeur..."
            }
          />

          {safeContent.answerFormat === "set" && (
            <span className="font-bold text-blue-800 text-lg">{"}"}</span>
          )}
        </div>

        <p className="text-[10px] text-blue-600 mt-2">
          Écrivez @a pour insérer la valeur de a. Tout est en LaTeX sauf le * pour la
          multiplication. Pas besoin de $ dans la réponse.
        </p>
      </div>

      {/* 4. AIDE ET PÉDAGOGIE */}
      <div className="pt-4 border-t border-gray-200 space-y-3">
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-1">
            <Lightbulb size={14} className="text-yellow-500" /> Indice (Optionnel)
          </label>
          <textarea
            className="w-full p-2 border rounded text-sm h-20"
            value={safeContent.hint}
            onChange={(e) => update("hint", e.target.value)}
            placeholder="Un petit coup de pouce pour l'élève..."
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-1">
            <BookOpen size={14} className="text-indigo-500" /> Explication de la correction
          </label>
          <textarea
            className="w-full p-2 border rounded text-sm h-24"
            value={safeContent.explanation}
            onChange={(e) => update("explanation", e.target.value)}
            placeholder="Détaillez le raisonnement ici (visible après la réponse)..."
          />
        </div>
      </div>
    </div>
  );
};

export default QuestionEditor;
