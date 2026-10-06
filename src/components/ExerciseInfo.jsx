// src/components/ExerciseInfo.jsx
import { Calculator, Check, ChevronDown, ChevronRight, X, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { difficulties, getChapters, getCompetencesByChapterMap } from "../constants";

const ExerciseInfo = ({ currentExercise, setCurrentExercise }) => {
  const [showCompetences, setShowCompetences] = useState(false);
  const [chaptersList, setChaptersList] = useState([]);
  const [competencesByChapter, setCompetencesByChapter] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});
  const [taxonomyError, setTaxonomyError] = useState(null);

  const patch = (updates) => setCurrentExercise((prev) => ({ ...prev, ...updates }));

  // Chargement de la taxonomie (mise en cache dans constants)
  useEffect(() => {
    let cancelled = false;
    Promise.all([getChapters(), getCompetencesByChapterMap()])
      .then(([chapters, map]) => {
        if (cancelled) return;
        setChaptersList(chapters);
        setCompetencesByChapter(map);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setTaxonomyError(err.message || String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Nouvel exercice sans chapitre -> premier chapitre disponible
  useEffect(() => {
    if (chaptersList.length > 0 && !currentExercise.chapter) {
      setCurrentExercise((prev) => ({ ...prev, chapter: chaptersList[0] }));
    }
  }, [chaptersList, currentExercise.chapter, setCurrentExercise]);

  const chapterUnknown =
    !!currentExercise.chapter && !chaptersList.includes(currentExercise.chapter);

  const toggleCompetence = (competence) => {
    setCurrentExercise((prev) => {
      const current = prev.competences || [];
      return {
        ...prev,
        competences: current.includes(competence)
          ? current.filter((c) => c !== competence)
          : [...current, competence],
      };
    });
  };

  // Chapitres ayant des compétences, chapitre courant en premier
  const orderedChapters = useMemo(() => {
    const list = chaptersList.filter((ch) => (competencesByChapter[ch] || []).length > 0);
    const idx = list.indexOf(currentExercise.chapter);
    if (idx > 0) {
      list.splice(idx, 1);
      list.unshift(currentExercise.chapter);
    }
    return list;
  }, [chaptersList, competencesByChapter, currentExercise.chapter]);

  const toggleChapterExpansion = (chapter, current) =>
    setExpandedChapters((prev) => ({ ...prev, [chapter]: !current }));

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-2">📋 Informations Générales</h2>

      {taxonomyError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          ❌ Impossible de charger les chapitres/compétences : {taxonomyError}
        </div>
      )}

      {/* Titres */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Nom de l'exercice (Interne)
          </label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm"
            value={currentExercise.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="Ex: Logarithme_Bac"
          />
        </div>

        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
          <label className="block text-xs font-bold text-blue-600 uppercase mb-1">
            Titre dans l'application (Élève)
          </label>
          <input
            type="text"
            className="w-full p-2 border border-blue-200 rounded focus:border-blue-500 outline-none text-sm"
            value={currentExercise.appTitle || ""}
            onChange={(e) => patch({ appTitle: e.target.value })}
            placeholder="Ex: Étude de fonction logarithme"
          />
          <p className="text-[10px] text-blue-400 mt-1">
            C'est ce titre que l'élève verra en haut de la page
          </p>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => patch({ Is_Flash: !currentExercise.Is_Flash })}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-bold transition-all shadow-sm ${
            currentExercise.Is_Flash
              ? "bg-yellow-400 border-yellow-500 text-yellow-900 shadow-yellow-200"
              : "bg-white border-dashed border-gray-300 text-gray-400 line-through"
          }`}
        >
          <Zap size={16} className={currentExercise.Is_Flash ? "fill-yellow-700" : ""} />
          Flash Exos
          {currentExercise.Is_Flash ? (
            <Check size={14} className="ml-1 text-yellow-700" />
          ) : (
            <X size={14} className="ml-1" />
          )}
        </button>

        <button
          type="button"
          onClick={() => patch({ Need_Calculator: !currentExercise.Need_Calculator })}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-bold transition-all shadow-sm ${
            currentExercise.Need_Calculator
              ? "bg-green-400 border-green-500 text-green-900 shadow-green-200"
              : "bg-white border-dashed border-gray-300 text-gray-400 line-through"
          }`}
        >
          <Calculator size={16} />
          Calculatrice
          {currentExercise.Need_Calculator ? (
            <Check size={14} className="ml-1 text-green-700" />
          ) : (
            <X size={14} className="ml-1" />
          )}
        </button>
      </div>

      {/* Chapitre, Difficulté */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Chapitre</label>
          <select
            className="w-full p-2 border-2 border-gray-300 rounded-lg"
            value={currentExercise.chapter}
            onChange={(e) => patch({ chapter: e.target.value })}
          >
            {chapterUnknown && (
              <option value={currentExercise.chapter}>
                {currentExercise.chapter} (hors liste)
              </option>
            )}
            {chaptersList.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Difficulté</label>
          <select
            className="w-full p-2 border-2 border-gray-300 rounded-lg"
            value={currentExercise.difficulty}
            onChange={(e) => patch({ difficulty: e.target.value })}
          >
            {difficulties.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Compétences */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">
            Compétences ({currentExercise.competences?.length || 0})
          </label>
          <button
            type="button"
            onClick={() => setShowCompetences(!showCompetences)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {showCompetences ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {currentExercise.competences?.length > 0 && (
          <div className="p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-blue-700">Compétences sélectionnées :</span>
              <button
                onClick={() => patch({ competences: [] })}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Tout effacer
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {currentExercise.competences.map((comp) => (
                <span
                  key={comp}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs flex items-center gap-1"
                >
                  {comp}
                  <button onClick={() => toggleCompetence(comp)} className="hover:text-blue-900">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {showCompetences && (
          <div className="border-2 border-gray-200 rounded-lg p-2 max-h-60 overflow-y-auto">
            {orderedChapters.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-2">
                Aucune compétence disponible (voir « Chapitres & Compétences »)
              </p>
            ) : (
              <div className="space-y-3">
                {orderedChapters.map((chapter) => {
                  const chapterCompetences = competencesByChapter[chapter] || [];
                  const isCurrentChapter = chapter === currentExercise.chapter;
                  const isExpanded = expandedChapters[chapter] ?? isCurrentChapter;

                  return (
                    <div key={chapter} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => toggleChapterExpansion(chapter, isExpanded)}
                        className={`w-full flex items-center justify-between text-xs font-semibold px-2 py-1 rounded ${
                          isCurrentChapter
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <span>
                          {chapter}
                          {isCurrentChapter ? " (chapitre sélectionné)" : ""}
                        </span>
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>

                      {isExpanded &&
                        chapterCompetences.map((competence) => {
                          const isSelected = currentExercise.competences?.includes(competence);
                          return (
                            <label
                              key={`${chapter}-${competence}`}
                              className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                                isSelected ? "bg-blue-50" : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={!!isSelected}
                                onChange={() => toggleCompetence(competence)}
                                className="rounded"
                              />
                              <span className="text-sm">{competence}</span>
                            </label>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseInfo;
