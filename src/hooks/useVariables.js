import { useCallback, useEffect, useState } from "react";
import { generateRandomValues } from "../utils/generateRandomValues";

const LETTERS = "abcdefghijklmnopqrstuvwxyz";

const usedNames = (variables) =>
  new Set(
    variables
      .flatMap((v) => (Array.isArray(v.names) ? v.names : [v.name]))
      .filter(Boolean)
      .map((n) => String(n).trim()),
  );

const nextFreeName = (variables) => {
  const used = usedNames(variables);
  for (const letter of LETTERS) if (!used.has(letter)) return letter;
  return `v${variables.length + 1}`;
};

export const useVariables = (currentExercise, setCurrentExercise) => {
  const [generatedValues, setGeneratedValues] = useState({});

  const patchVariables = useCallback(
    (fn) =>
      setCurrentExercise((prev) => ({
        ...prev,
        variables: fn(prev.variables || []),
      })),
    [setCurrentExercise],
  );

  const addVariable = useCallback(
    () =>
      patchVariables((vars) => [
        ...vars,
        {
          id: Date.now(),
          name: nextFreeName(vars),
          type: "integer",
          min: 1,
          max: 10,
          exclusions: "",
          decimals: 2,
          choices: [],
          expression: "",
        },
      ]),
    [patchVariables],
  );

  const addDoublet = useCallback(
    () =>
      patchVariables((vars) => [
        ...vars,
        { id: Date.now(), type: "doublet", mode: "choice", names: ["a", "b"], choices: "" },
      ]),
    [patchVariables],
  );

  const addTriplet = useCallback(
    () =>
      patchVariables((vars) => [
        ...vars,
        {
          id: Date.now(),
          type: "triplet",
          mode: "perfect_square",
          names: ["A", "B", "C"],
          min: -4,
          max: 4,
          exclusions: "0",
        },
      ]),
    [patchVariables],
  );

  const updateVariable = useCallback(
    (id, updates) =>
      patchVariables((vars) => vars.map((v) => (v.id === id ? { ...v, ...updates } : v))),
    [patchVariables],
  );

  const deleteVariable = useCallback(
    (id) => patchVariables((vars) => vars.filter((v) => v.id !== id)),
    [patchVariables],
  );

  // --- Génération : on régénère dès que la définition des variables change ---
  const signature = JSON.stringify(currentExercise.variables || []);

  const regenerateValues = useCallback(() => {
    const list = JSON.parse(signature);
    setGeneratedValues(list.length ? generateRandomValues(list) : {});
  }, [signature]);

  useEffect(() => {
    regenerateValues();
  }, [regenerateValues]);

  return {
    generatedValues,
    addVariable,
    addDoublet,
    addTriplet,
    updateVariable,
    deleteVariable,
    regenerateValues,
  };
};

export default useVariables;
