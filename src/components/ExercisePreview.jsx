import ElementRenderer from "../renderers/ElementRenderer";

const ExercisePreview = ({ currentExercise, generatedValues }) => {
  const title = currentExercise.appTitle || currentExercise.title || "Sans titre";

  return (
    <div className="space-y-6">
      <div className="border-b-2 pb-4">
        <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
        <div className="flex flex-wrap gap-2 mt-2 text-xs">
          {currentExercise.chapter && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
              {currentExercise.chapter}
            </span>
          )}
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
            {currentExercise.difficulty}
          </span>
          {currentExercise.Is_Flash && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">⚡ Flash</span>
          )}
          {currentExercise.Need_Calculator && (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded">🧮 Calculatrice</span>
          )}
        </div>

        {currentExercise.variables.length > 0 && (
          <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm font-medium text-purple-900 mb-1">🎲 Valeurs générées :</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(generatedValues).map(([key, value]) => (
                <span
                  key={key}
                  className="px-2 py-1 bg-white rounded border border-purple-300 text-sm"
                >
                  <strong>{key}</strong> = {String(value)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {currentExercise.elements.length === 0 && (
        <p className="text-gray-400 text-center py-8 bg-gray-50 rounded-lg">
          Aucun élément à afficher.
        </p>
      )}

      {currentExercise.elements.map((element) => (
        <ElementRenderer key={element.id} element={element} variables={generatedValues} />
      ))}
    </div>
  );
};

export default ExercisePreview;
