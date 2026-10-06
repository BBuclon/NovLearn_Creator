import { supabase } from "../supabaseClient";

// ------------------------------------------------------------------
// Cache en mémoire (RAM) – TTL : 1 heure
// ------------------------------------------------------------------
const CACHE_TTL = 1000 * 60 * 60;
let taxonomyCache = null;
let lastFetchTime = 0;

export const invalidateTaxonomyCache = () => {
  taxonomyCache = null;
  lastFetchTime = 0;
};

async function getTaxonomy() {
  if (taxonomyCache && Date.now() - lastFetchTime < CACHE_TTL) {
    return taxonomyCache;
  }

  const [
    { data: chaptersData, error: chaptersError },
    { data: competencesData, error: competencesError },
  ] = await Promise.all([
    supabase.from("chapters").select("*").order("order_index"),
    supabase.from("competences").select("id, name, chapter_id, chapters(name)"),
  ]);

  if (chaptersError) throw chaptersError;
  if (competencesError) throw competencesError;

  const chaptersList = chaptersData.map((ch) => ch.name);

  const competencesByChapter = {};
  for (const ch of chaptersData) {
    competencesByChapter[ch.name] = [];
  }
  for (const comp of competencesData) {
    const chName = comp.chapters?.name;
    if (
      chName &&
      Object.prototype.hasOwnProperty.call(competencesByChapter, chName)
    ) {
      competencesByChapter[chName].push(comp.name);
    }
  }

  const allCompetences = competencesData.map((c) => c.name);

  taxonomyCache = { chaptersList, competencesByChapter, allCompetences };
  lastFetchTime = Date.now();
  return taxonomyCache;
}

// ------------------------------------------------------------------
// API publique asynchrone
// ------------------------------------------------------------------
export const difficulties = ["Facile", "Moyen", "Difficile"];

export const getChapters = async () => {
  const { chaptersList } = await getTaxonomy();
  return chaptersList;
};

export const getCompetencesByChapter = async (chapter) => {
  const { competencesByChapter } = await getTaxonomy();
  return competencesByChapter[chapter] ?? [];
};

export const getCompetencesByChapterMap = async () => {
  const { competencesByChapter } = await getTaxonomy();
  return competencesByChapter;
};

export const getAllCompetences = async () => {
  const { allCompetences } = await getTaxonomy();
  return allCompetences;
};

export const searchCompetences = async (searchTerm) => {
  const term = searchTerm.toLowerCase();
  const all = await getAllCompetences();
  return all.filter((comp) => comp.toLowerCase().includes(term));
};

export const elementTypes = [
  { type: "text", label: "Texte/Énoncé", icon: "📝", chapters: "all" },
  { type: "graph", label: "Graphe", icon: "📊", chapters: "all" },
  {
    type: "variationTable",
    label: "Tableau de variations",
    icon: "📋",
    chapters: "all",
  },
  { type: "signTable", label: "Tableau de signes", icon: "±", chapters: "all" },
  {
    type: "probaTree",
    label: "Arbre de probabilité",
    icon: "🌳",
    chapters: "all",
  },
  {
    type: "discreteGraph",
    label: "Graphe Discret",
    icon: "📊",
    chapters: "all",
  },
  { type: "complexPlane", label: "Plan complexe", icon: "🔷", chapters: "all" },
  { type: "vector", label: "Vecteur", icon: "➡️", chapters: "all" },
  {
    type: "statsTable",
    label: "Tableau statistique",
    icon: "📊",
    chapters: "all",
  },
  { type: "equation", label: "Équation", icon: "∑", chapters: "all" },
  { type: "question", label: "Question", icon: "❓", chapters: "all" },
  { type: "mcq", label: "QCM", icon: "☑️", chapters: "all" },
];
