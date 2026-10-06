import { useId, useState } from "react";
import { MathText } from "../utils/mathRenderer";

const MCQRenderer = ({ content, variables }) => {
  const radioGroup = useId();
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);

  const options = Array.isArray(content.options) ? content.options : [];

  const handleAnswerToggle = (index) => {
    if (showResult) return;
    if (content.multipleChoice) {
      setSelectedAnswers((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
      );
    } else {
      setSelectedAnswers([index]);
    }
  };

  const getOptionText = (option) => {
    if (option === null || option === undefined) return "";
    if (typeof option === "object") {
      return option.text ?? option.label ?? option.content ?? option.value ?? "";
    }
    return String(option);
  };

  const isOptionCorrect = (option, index) => {
    if (typeof option === "object" && option !== null) {
      return option.isCorrect === true || option.correct === true;
    }
    if (Array.isArray(content.correctAnswers)) return content.correctAnswers.includes(index);
    if (content.correctAnswer !== undefined) return content.correctAnswer === index;
    return false;
  };

  const getResultStatus = (option, index) => {
    if (!showResult) return null;
    const isCorrect = isOptionCorrect(option, index);
    const isSelected = selectedAnswers.includes(index);
    if (isSelected && isCorrect) return "correct";
    if (isSelected && !isCorrect) return "incorrect";
    if (!isSelected && isCorrect) return "missed";
    return null;
  };

  const getOptionClassName = (option, index) => {
    const status = getResultStatus(option, index);
    const isSelected = selectedAnswers.includes(index);
    const baseClass = "flex items-center p-3 rounded cursor-pointer transition-colors border";

    if (showResult) {
      switch (status) {
        case "correct":
          return `${baseClass} bg-green-100 border-green-500 ring-2 ring-green-500`;
        case "incorrect":
          return `${baseClass} bg-red-100 border-red-500`;
        case "missed":
          return `${baseClass} bg-yellow-100 border-yellow-500 border-dashed`;
        default:
          return `${baseClass} bg-gray-50 border-gray-200`;
      }
    }
    return `${baseClass} ${
      isSelected ? "bg-green-100 border-green-400" : "bg-white hover:bg-gray-50 border-gray-200"
    }`;
  };

  const points = Number(content.points) || 1;

  return (
    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
      <div className="mb-4 flex justify-between items-start gap-4">
        <MathText
          content={content.question || ""}
          variables={variables}
          className="font-medium text-gray-800"
        />
        <span className="shrink-0 px-2 py-1 bg-white rounded text-xs font-bold text-gray-500 border border-green-200">
          {points} pt{points > 1 ? "s" : ""}
        </span>
      </div>

      {content.hint && (
        <div className="mb-3 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 p-2 rounded">
          💡 <MathText content={content.hint} variables={variables} />
        </div>
      )}

      <div className="space-y-2">
        {options.map((option, index) => {
          const status = getResultStatus(option, index);
          return (
            <label key={index} className={getOptionClassName(option, index)}>
              <input
                type={content.multipleChoice ? "checkbox" : "radio"}
                name={radioGroup}
                checked={selectedAnswers.includes(index)}
                onChange={() => handleAnswerToggle(index)}
                disabled={showResult}
                className="mr-3 h-4 w-4"
              />
              <span className="flex-1">
                <MathText
                  content={getOptionText(option)}
                  variables={variables}
                  className="text-gray-700"
                />
              </span>
              {status === "correct" && <span className="ml-2 text-green-600 font-bold">✓</span>}
              {status === "incorrect" && <span className="ml-2 text-red-600 font-bold">✗</span>}
              {status === "missed" && (
                <span className="ml-2 text-yellow-600 text-sm">(bonne réponse)</span>
              )}
            </label>
          );
        })}
      </div>

      {showResult && content.explanation && (
        <div className="mt-3 text-sm text-indigo-800 bg-indigo-50 border border-indigo-200 p-2 rounded">
          <span className="font-bold text-xs uppercase block mb-1">Explication :</span>
          <MathText content={content.explanation} variables={variables} />
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {!showResult ? (
          <button
            type="button"
            onClick={() => setShowResult(true)}
            disabled={selectedAnswers.length === 0}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Valider
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setSelectedAnswers([]);
              setShowResult(false);
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Réessayer
          </button>
        )}
      </div>
    </div>
  );
};

export default MCQRenderer;
