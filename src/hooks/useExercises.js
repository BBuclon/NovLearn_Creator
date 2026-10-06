import { useCallback, useState } from "react";
import { getDefaultContent } from "../utils/defaultContent";

export const createEmptyExercise = () => ({
  title: "",
  appTitle: "",
  difficulty: "Facile",
  chapter: "",
  competences: [],
  variables: [],
  elements: [],
  Is_Flash: false,
  Need_Calculator: false,
});

/** Identifiant numérique unique dans une liste (les ids sont stockés dans le JSON en BDD). */
const nextId = (items) =>
  Math.max(Date.now(), ...items.map((it) => (Number(it.id) || 0) + 1));

/**
 * Normalise un exercice venant de l'API / d'un import :
 * champs manquants, ancien nommage (variableDefinitions, app_title, apptitle).
 */
export const normalizeExercise = (exercise, preserveId = false) => {
  const ex = exercise || {};
  const {
    apptitle: _apptitle,
    app_title: _appTitleSnake,
    variableDefinitions: _legacyVars,
    ...rest
  } = ex;

  return {
    ...createEmptyExercise(),
    ...rest,
    id: preserveId ? ex.id : undefined,
    appTitle: ex.appTitle ?? ex.app_title ?? ex.apptitle ?? "",
    competences: Array.isArray(ex.competences) ? ex.competences : [],
    variables: Array.isArray(ex.variables)
      ? ex.variables
      : Array.isArray(ex.variableDefinitions)
        ? ex.variableDefinitions
        : [],
    elements: Array.isArray(ex.elements) ? ex.elements : [],
  };
};

export const useExercises = () => {
  const [currentExercise, setCurrentExercise] = useState(createEmptyExercise);

  const addElement = useCallback((type) => {
    setCurrentExercise((prev) => ({
      ...prev,
      elements: [
        ...prev.elements,
        { id: nextId(prev.elements), type, content: getDefaultContent(type) },
      ],
    }));
  }, []);

  const updateElement = useCallback((id, content) => {
    setCurrentExercise((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => (el.id === id ? { ...el, content } : el)),
    }));
  }, []);

  const deleteElement = useCallback((id) => {
    setCurrentExercise((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== id),
    }));
  }, []);

  const moveElement = useCallback((fromIndex, toIndex) => {
    setCurrentExercise((prev) => {
      const elements = [...prev.elements];
      const [removed] = elements.splice(fromIndex, 1);
      elements.splice(toIndex, 0, removed);
      return { ...prev, elements };
    });
  }, []);

  /** Charge un exercice ; preserveId=true pour éditer l'original, false pour une copie. */
  const loadExercise = useCallback((exercise, preserveId = false) => {
    setCurrentExercise(normalizeExercise(exercise, preserveId));
  }, []);

  const resetExercise = useCallback(() => {
    setCurrentExercise(createEmptyExercise());
  }, []);

  return {
    currentExercise,
    setCurrentExercise,
    addElement,
    updateElement,
    deleteElement,
    moveElement,
    loadExercise,
    resetExercise,
  };
};
