// src/utils/publishUtils.js
// Accès aux exercices via l'API Novlearn (lecture publique, écriture avec secret).

const API_URL = import.meta.env.VITE_NOVLEARN_API_URL;
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET;

// Colonnes de la table `exercises` : tout le reste part dans `content` (JSON).
const META_KEYS = new Set([
  "id",
  "title",
  "appTitle",
  "apptitle",
  "app_title",
  "chapter",
  "difficulty",
  "competences",
  "Is_Flash",
  "Need_Calculator",
  "content",
  "created_at",
  "updated_at",
]);

const handleApiResponse = async (response) => {
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(`Réponse API invalide (HTTP ${response.status})`);
  }
  if (!response.ok || !result.success) {
    throw new Error(result.error || `Erreur API (HTTP ${response.status})`);
  }
  return result;
};

const guardConfig = () => {
  if (!API_URL) {
    throw new Error("VITE_NOVLEARN_API_URL n'est pas défini dans le fichier .env");
  }
};

/** Liste simplifiée des exercices */
export const fetchExercisesList = async () => {
  try {
    guardConfig();
    const response = await fetch(API_URL, { headers: { "Content-Type": "application/json" } });
    const result = await handleApiResponse(response);
    return { success: true, data: result.exercises };
  } catch (err) {
    console.error("Erreur fetch list:", err);
    return { success: false, error: err.message };
  }
};

/** Exercice complet (l'API renvoie déjà un objet aplati : appTitle, variables, elements...) */
export const fetchFullExercise = async (id) => {
  try {
    guardConfig();
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
      headers: { "Content-Type": "application/json" },
    });
    const result = await handleApiResponse(response);
    return { success: true, data: result.data };
  } catch (err) {
    console.error("Erreur fetch one:", err);
    return { success: false, error: err.message };
  }
};

/** Suppression (nécessite le secret) */
export const deleteExerciseFromDB = async (id) => {
  try {
    guardConfig();
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "x-admin-secret": ADMIN_SECRET },
    });
    await handleApiResponse(response);
    return { success: true };
  } catch (err) {
    console.error("Erreur suppression:", err);
    return { success: false, error: err.message };
  }
};

/** Publication / mise à jour (POST = upsert côté API, nécessite le secret) */
export const publishExerciseToDB = async (exercise) => {
  if (!exercise.title || !exercise.chapter) {
    return { success: false, error: "Titre et Chapitre requis." };
  }
  if (!exercise.elements || exercise.elements.length === 0) {
    return { success: false, error: "L'exercice doit contenir au moins un élément." };
  }

  const content = Object.fromEntries(
    Object.entries(exercise).filter(([key]) => !META_KEYS.has(key)),
  );

  const dbRow = {
    ...(exercise.id && { id: exercise.id }),
    title: exercise.title,
    app_title: exercise.appTitle || exercise.title,
    chapter: exercise.chapter,
    difficulty: exercise.difficulty || "Moyen",
    competences: exercise.competences || [],
    Is_Flash: exercise.Is_Flash ?? false,
    Need_Calculator: exercise.Need_Calculator ?? false,
    content,
  };

  try {
    guardConfig();
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": ADMIN_SECRET },
      body: JSON.stringify(dbRow),
    });
    const result = await handleApiResponse(response);
    return { success: true, data: result.data };
  } catch (err) {
    console.error("Erreur Publication API:", err);
    return { success: false, error: err.message };
  }
};
