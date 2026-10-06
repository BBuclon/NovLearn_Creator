import { useState } from "react";
import ElementList from "./components/ElementList";
import ExerciseInfo from "./components/ExerciseInfo";
import ExercisePreview from "./components/ExercisePreview";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import VariableManager from "./components/VariableManager";
import { useExercises } from "./hooks/useExercises";
import { useVariables } from "./hooks/useVariables";
import TaxonomyManager from "./pages/TaxonomyManager";

const App = () => {
  const [previewMode, setPreviewMode] = useState(false);
  const [showTaxonomyManager, setShowTaxonomyManager] = useState(false);

  const {
    currentExercise,
    setCurrentExercise,
    addElement,
    updateElement,
    deleteElement,
    loadExercise,
    resetExercise,
  } = useExercises();

  const {
    generatedValues,
    addVariable,
    addDoublet,
    addTriplet,
    updateVariable,
    deleteVariable,
    regenerateValues,
  } = useVariables(currentExercise, setCurrentExercise);

  if (showTaxonomyManager) {
    return <TaxonomyManager onClose={() => setShowTaxonomyManager(false)} />;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <Header
          previewMode={previewMode}
          setPreviewMode={setPreviewMode}
          hasVariables={currentExercise.variables.length > 0}
          onRegenerate={regenerateValues}
          currentExercise={currentExercise}
          onLoadExercise={loadExercise}
          onPublished={() => {
            resetExercise();
            setPreviewMode(false);
          }}
          onOpenTaxonomy={() => setShowTaxonomyManager(true)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-white rounded-xl shadow-lg p-6">
            {!previewMode ? (
              <div className="space-y-6">
                <ExerciseInfo
                  currentExercise={currentExercise}
                  setCurrentExercise={setCurrentExercise}
                />
                <VariableManager
                  currentExercise={currentExercise}
                  generatedValues={generatedValues}
                  addVariable={addVariable}
                  addDoublet={addDoublet}
                  addTriplet={addTriplet}
                  updateVariable={updateVariable}
                  deleteVariable={deleteVariable}
                />
                <ElementList
                  currentExercise={currentExercise}
                  setCurrentExercise={setCurrentExercise}
                  updateElement={updateElement}
                  deleteElement={deleteElement}
                  addElement={addElement}
                />
              </div>
            ) : (
              <ExercisePreview
                currentExercise={currentExercise}
                generatedValues={generatedValues}
              />
            )}
          </div>

          <Sidebar />
        </div>
      </div>
    </div>
  );
};

export default App;
