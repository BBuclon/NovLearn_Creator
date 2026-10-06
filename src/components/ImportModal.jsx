import React, { useEffect, useMemo, useState } from 'react';
import { X, Download, Loader, Trash2, Copy, Search, Filter, RotateCcw } from 'lucide-react';
import { fetchExercisesList, fetchFullExercise, deleteExerciseFromDB } from '../utils/publishUtils';
import { difficulties, getChapters } from '../constants';

const DIFFICULTY_STYLES = {
  Facile: 'bg-green-100 text-green-700',
  Moyen: 'bg-yellow-100 text-yellow-700',
  Difficile: 'bg-red-100 text-red-700',
};

const ImportModal = ({ onClose, onLoadExercise }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importingId, setImportingId] = useState(null);

  const [chapters, setChapters] = useState([]);
  const [chapterFilter, setChapterFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [searchId, setSearchId] = useState('');

  useEffect(() => {
    loadList();
    getChapters().then(setChapters).catch(() => setChapters([]));
  }, []);

  const loadList = async () => {
    setLoading(true);
    const result = await fetchExercisesList();
    if (result.success) {
      setList(result.data);
    } else {
      alert("Erreur de chargement : " + result.error);
    }
    setLoading(false);
  };

  const resetFilters = () => {
    setChapterFilter('');
    setDifficultyFilter('');
    setSearchId('');
  };

  const filteredList = useMemo(() => {
    const term = searchId.trim().toLowerCase();
    return list.filter((ex) => {
      if (chapterFilter && ex.chapter !== chapterFilter) return false;
      if (difficultyFilter && ex.difficulty !== difficultyFilter) return false;
      if (term) {
        const idMatch = String(ex.id ?? '').toLowerCase().includes(term);
        const titleMatch = (ex.title ?? '').toLowerCase().includes(term);
        if (!idMatch && !titleMatch) return false;
      }
      return true;
    });
  }, [list, chapterFilter, difficultyFilter, searchId]);

  const hasActiveFilters = chapterFilter || difficultyFilter || searchId;

  // Importer pour MODIFIER (Garde l'ID)
  const handleSelect = async (id) => {
    setImportingId(id);
    const result = await fetchFullExercise(id);

    if (result.success) {
      onLoadExercise(result.data, true);
      onClose();
      alert(`✅ Exercice "${result.data.title}" chargé pour modification !`);
    } else {
      alert("Erreur lors de l'import : " + result.error);
    }
    setImportingId(null);
  };

  // Dupliquer (Nouveau sans ID)
  const handleDuplicate = async (e, id) => {
    e.stopPropagation();
    setImportingId(id);
    const result = await fetchFullExercise(id);

    if (result.success) {
      const duplicatedExercise = {
        ...result.data,
        title: `${result.data.title} (Copie)`,
      };
      onLoadExercise(duplicatedExercise, false);
      onClose();
      alert(`📋 Exercice dupliqué ! Vous êtes maintenant sur un NOUVEL exercice basé sur "${result.data.title}".`);
    } else {
      alert("Erreur lors de la duplication : " + result.error);
    }
    setImportingId(null);
  };

  // Supprimer
  const handleDelete = async (e, id, title) => {
    e.stopPropagation();

    if (!confirm(`⚠️ Êtes-vous sûr de vouloir supprimer définitivement l'exercice "${title}" ?\nCette action est irréversible.`)) {
      return;
    }

    const previousList = list;
    setList(list.filter((item) => item.id !== id));

    const result = await deleteExerciseFromDB(id);

    if (!result.success) {
      setList(previousList);
      alert("❌ Erreur lors de la suppression : " + result.error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Download className="text-blue-600" />
            Gérer les exercices (Supabase)
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Filtres */}
        <div className="px-6 py-4 border-b bg-gray-50 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Recherche ID / titre */}
            <div className="relative md:col-span-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Rechercher par ID ou titre…"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>

            {/* Chapitre */}
            <select
              value={chapterFilter}
              onChange={(e) => setChapterFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Tous les chapitres</option>
              {chapters.map((ch) => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>

            {/* Difficulté */}
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Toutes les difficultés</option>
              {difficulties.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Filter size={12} />
              {filteredList.length} / {list.length} exercice{list.length > 1 ? 's' : ''}
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
              >
                <RotateCcw size={12} />
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader className="animate-spin text-blue-500" size={32} />
            </div>
          ) : filteredList.length === 0 ? (
            <p className="text-center text-gray-500 py-10">
              {list.length === 0
                ? "Aucun exercice trouvé dans la base."
                : "Aucun exercice ne correspond aux filtres."}
            </p>
          ) : (
            <div className="grid gap-3">
              {filteredList.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition group bg-white"
                >
                  {/* Clic principal : Importer/Modifier */}
                  <div
                    onClick={() => handleSelect(ex.id)}
                    className="flex-1 cursor-pointer min-w-0"
                  >
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2 truncate">
                      {ex.title}
                      {importingId === ex.id && <Loader size={14} className="animate-spin text-blue-600" />}
                    </h3>
                    <div className="text-sm text-gray-500 flex flex-wrap gap-2 mt-1 items-center">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{ex.chapter}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${DIFFICULTY_STYLES[ex.difficulty] ?? 'bg-gray-100 text-gray-700'}`}>
                        {ex.difficulty}
                      </span>
                      <span className="text-[11px] text-gray-400 font-mono">#{ex.id}</span>
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex items-center gap-1 pl-4 border-l ml-4 border-gray-100">
                    <button
                      onClick={(e) => handleDuplicate(e, ex.id)}
                      disabled={importingId !== null}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition"
                      title="Dupliquer (Créer une copie)"
                    >
                      <Copy size={20} />
                    </button>

                    <button
                      onClick={() => handleSelect(ex.id)}
                      disabled={importingId !== null}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                      title="Modifier l'original"
                    >
                      <Download size={20} />
                    </button>

                    <button
                      onClick={(e) => handleDelete(e, ex.id, ex.title)}
                      disabled={importingId !== null}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                      title="Supprimer définitivement"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
