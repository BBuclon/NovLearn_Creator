import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  Edit2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { invalidateTaxonomyCache } from "../constants";
import { supabaseAdmin } from "../supabaseAdmin";

/* ─────────────────────────────────────────────
   Styles utilitaires (inline) pour éviter de
   dépendre de classes CSS non définies.
───────────────────────────────────────────── */
const S = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(to bottom right, #eff6ff, #eef2ff, #faf5ff)",
    padding: "1.5rem",
  },
  container: { maxWidth: "56rem", margin: "0 auto" },

  /* Header bar */
  topBar: {
    background: "white",
    borderRadius: "0.75rem",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
    padding: "1.25rem 1.5rem",
    marginBottom: "1.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
  },
  topBarLeft: { display: "flex", alignItems: "center", gap: "1rem" },
  btnBack: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    background: "#f3f4f6",
    color: "#374151",
    borderRadius: "0.5rem",
    border: "1px solid #d1d5db",
    fontWeight: 600,
  },
  title: { fontSize: "1.375rem", fontWeight: 700, color: "#1e3a8a", margin: 0 },
  subtitle: { color: "#6b7280", fontSize: "0.875rem", marginTop: "0.125rem" },
  btnPrimary: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    background: "#3b82f6",
    color: "white",
    borderRadius: "0.5rem",
    fontWeight: 600,
    border: "none",
  },

  /* Feedback banners */
  errorBanner: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    padding: "0.875rem 1rem",
    borderRadius: "0.5rem",
    marginBottom: "1rem",
  },
  loadingBox: {
    textAlign: "center",
    padding: "3rem",
    color: "#6b7280",
    background: "white",
    borderRadius: "0.75rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
  },
  emptyBox: {
    textAlign: "center",
    padding: "3rem",
    color: "#9ca3af",
    background: "white",
    borderRadius: "0.75rem",
    fontStyle: "italic",
  },

  /* Add-chapter inline row */
  addChapterRow: {
    background: "white",
    borderRadius: "0.75rem",
    border: "2px solid #3b82f6",
    padding: "0.875rem 1rem",
    marginBottom: "0.75rem",
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
  },

  /* Chapter card */
  chapterCard: {
    background: "white",
    borderRadius: "0.75rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
  },
  chapterHeader: (expanded) => ({
    display: "flex",
    alignItems: "center",
    padding: "0.875rem 1rem",
    gap: "0.625rem",
    background: expanded ? "#eff6ff" : "white",
    transition: "background 0.15s ease",
  }),
  orderBtns: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flexShrink: 0,
  },
  orderBtn: (disabled) => ({
    padding: "2px 4px",
    background: disabled ? "#f3f4f6" : "#e0e7ff",
    color: disabled ? "#9ca3af" : "#4f46e5",
    borderRadius: "3px",
    lineHeight: 1,
    opacity: disabled ? 0.5 : 1,
    border: "none",
    cursor: disabled ? "default" : "pointer",
  }),
  orderNum: {
    minWidth: "1.5rem",
    fontWeight: 700,
    color: "#9ca3af",
    fontSize: "0.875rem",
    flexShrink: 0,
  },
  badge: {
    fontSize: "0.75rem",
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "0.125rem 0.5rem",
    borderRadius: "9999px",
    flexShrink: 0,
  },

  /* Icon buttons */
  btnIcon: (variant = "ghost") => {
    const map = {
      ghost: { bg: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb" },
      danger: { bg: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca" },
      toggle: { bg: "transparent", color: "#6b7280", border: "none" },
      green: { bg: "#22c55e", color: "white", border: "none" },
      red: { bg: "#ef4444", color: "white", border: "none" },
    };
    const v = map[variant] || map.ghost;
    return {
      padding: "0.3rem 0.4rem",
      background: v.bg,
      color: v.color,
      borderRadius: "0.375rem",
      border: v.border,
      display: "flex",
      alignItems: "center",
    };
  },

  /* Competences zone */
  compZone: {
    borderTop: "1px solid #e5e7eb",
    padding: "0.875rem 1rem",
    background: "#f9fafb",
  },
  compList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.375rem",
    marginBottom: "0.625rem",
  },
  compRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.375rem 0.75rem",
    background: "white",
    borderRadius: "0.5rem",
    border: "1px solid #e5e7eb",
  },
  compDot: {
    width: "0.45rem",
    height: "0.45rem",
    borderRadius: "50%",
    background: "#6366f1",
    flexShrink: 0,
    display: "inline-block",
  },
  compName: { flex: 1, fontSize: "0.875rem", color: "#374151" },
  btnCompIcon: (variant = "ghost") => ({
    padding: "3px 5px",
    background: "transparent",
    color: variant === "danger" ? "#f87171" : "#9ca3af",
    border: "none",
    borderRadius: "0.25rem",
    display: "flex",
    alignItems: "center",
  }),

  /* Add-competence form */
  addCompRow: { display: "flex", gap: "0.5rem", alignItems: "center" },
  btnAddComp: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    padding: "0.375rem 0.75rem",
    background: "white",
    color: "#6366f1",
    borderRadius: "0.375rem",
    border: "1px dashed #a5b4fc",
    fontSize: "0.875rem",
    fontWeight: 500,
  },

  /* Inline inputs */
  inputChapter: {
    flex: 1,
    border: "2px solid #3b82f6",
    borderRadius: "0.375rem",
    padding: "0.25rem 0.5rem",
    fontSize: "1rem",
    fontWeight: 600,
    outline: "none",
  },
  inputComp: {
    flex: 1,
    border: "1px solid #3b82f6",
    borderRadius: "0.25rem",
    padding: "0.25rem 0.5rem",
    fontSize: "0.875rem",
    outline: "none",
  },
  inputAddChapter: {
    flex: 1,
    border: "none",
    fontSize: "1rem",
    fontWeight: 500,
    outline: "none",
    color: "#1f2937",
  },
  inputAddComp: {
    flex: 1,
    border: "1px solid #3b82f6",
    borderRadius: "0.375rem",
    padding: "0.375rem 0.5rem",
    fontSize: "0.875rem",
    outline: "none",
  },
};

/* ─────────────────────────────────────────────
   Génère un ID lisible (slug) à partir d'un nom
───────────────────────────────────────────── */
function generateCompetenceId(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/* ─────────────────────────────────────────────
   Composant principal
───────────────────────────────────────────── */
const TaxonomyManager = ({ onClose }) => {
  const [chapters, setChapters] = useState([]);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Chapter inline edit / add
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [editingChapterName, setEditingChapterName] = useState("");
  const [addingChapter, setAddingChapter] = useState(false);
  const [newChapterName, setNewChapterName] = useState("");

  // Competence inline edit / add
  const [editingCompetenceId, setEditingCompetenceId] = useState(null);
  const [editingCompetenceName, setEditingCompetenceName] = useState("");
  const [addingCompetenceFor, setAddingCompetenceFor] = useState(null);
  const [newCompetenceName, setNewCompetenceName] = useState("");

  /* ── Fetch ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: chaps, error: e1 }, { data: comps, error: e2 }] =
        await Promise.all([
          supabaseAdmin.from("chapters").select("*").order("order_index"),
          supabaseAdmin.from("competences").select("*").order("name"),
        ]);
      if (e1) throw e1;
      if (e2) throw e2;

      setChapters(
        chaps.map((ch) => ({
          ...ch,
          competences: comps.filter((c) => c.chapter_id === ch.id),
        })),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Helpers ── */
  const refresh = async () => {
    invalidateTaxonomyCache();
    await fetchData();
  };

  /* ── Chapters CRUD ── */
  const saveNewChapter = async () => {
    const name = newChapterName.trim();
    if (!name) return;
    const maxOrder = chapters.reduce(
      (m, c) => Math.max(m, c.order_index ?? 0),
      0,
    );
    const { error: err } = await supabaseAdmin
      .from("chapters")
      .insert({ name, order_index: maxOrder + 1 });
    if (err) {
      alert(`Erreur : ${err.message}`);
      return;
    }
    setNewChapterName("");
    setAddingChapter(false);
    await refresh();
  };

  const saveEditChapter = async (id) => {
    const name = editingChapterName.trim();
    if (!name) return;
    const { error: err } = await supabaseAdmin
      .from("chapters")
      .update({ name })
      .eq("id", id);
    if (err) {
      alert(`Erreur : ${err.message}`);
      return;
    }
    setEditingChapterId(null);
    await refresh();
  };

  const deleteChapter = async (id, name) => {
    if (!confirm(`Supprimer le chapitre "${name}" et toutes ses compétences ?`))
      return;
    await supabaseAdmin.from("competences").delete().eq("chapter_id", id);
    const { error: err } = await supabaseAdmin
      .from("chapters")
      .delete()
      .eq("id", id);
    if (err) {
      alert(`Erreur : ${err.message}`);
      return;
    }
    await refresh();
  };

  const moveChapter = async (id, direction) => {
    const idx = chapters.findIndex((c) => c.id === id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= chapters.length) return;
    const a = chapters[idx];
    const b = chapters[swapIdx];
    await Promise.all([
      supabaseAdmin
        .from("chapters")
        .update({ order_index: b.order_index })
        .eq("id", a.id),
      supabaseAdmin
        .from("chapters")
        .update({ order_index: a.order_index })
        .eq("id", b.id),
    ]);
    await refresh();
  };

  /* ── Competences CRUD ── */
  const saveNewCompetence = async (chapterId) => {
    const name = newCompetenceName.trim();
    if (!name) return;
    const id = generateCompetenceId(name);
    const { error: err } = await supabaseAdmin
      .from("competences")
      .insert({ id, name, chapter_id: chapterId });
    if (err) {
      alert(`Erreur : ${err.message}`);
      return;
    }
    setNewCompetenceName("");
    setAddingCompetenceFor(null);
    await refresh();
  };

  const saveEditCompetence = async (id) => {
    const name = editingCompetenceName.trim();
    if (!name) return;
    const { error: err } = await supabaseAdmin
      .from("competences")
      .update({ name })
      .eq("id", id);
    if (err) {
      alert(`Erreur : ${err.message}`);
      return;
    }
    setEditingCompetenceId(null);
    await refresh();
  };

  const deleteCompetence = async (id, name) => {
    if (!confirm(`Supprimer la compétence "${name}" ?`)) return;
    const { error: err } = await supabaseAdmin
      .from("competences")
      .delete()
      .eq("id", id);
    if (err) {
      alert(`Erreur : ${err.message}`);
      return;
    }
    await refresh();
  };

  const toggleChapter = (id) =>
    setExpandedChapters((prev) => ({ ...prev, [id]: !prev[id] }));

  /* ── Render ── */
  return (
    <div style={S.page}>
      <div style={S.container}>
        {/* ── Top bar ── */}
        <div style={S.topBar}>
          <div style={S.topBarLeft}>
            <button style={S.btnBack} onClick={onClose}>
              <ArrowLeft size={17} />
              Retour
            </button>
            <div>
              <h1 style={S.title}>📚 Gestion des Chapitres et Compétences</h1>
              <p style={S.subtitle}>Chapitres et compétences associées</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button
              style={{ ...S.btnIcon("ghost"), padding: "0.5rem" }}
              onClick={fetchData}
              title="Actualiser"
            >
              <RefreshCw size={16} />
            </button>
            {!addingChapter && (
              <button
                style={S.btnPrimary}
                onClick={() => {
                  setAddingChapter(true);
                  setNewChapterName("");
                }}
              >
                <Plus size={17} />
                Nouveau chapitre
              </button>
            )}
          </div>
        </div>

        {/* ── Error ── */}
        {error && <div style={S.errorBanner}>❌ Erreur : {error}</div>}

        {/* ── Loading ── */}
        {loading && (
          <div style={S.loadingBox}>
            <RefreshCw
              size={18}
              style={{ animation: "spin 1s linear infinite" }}
            />
            Chargement…
          </div>
        )}

        {/* ── Add chapter form ── */}
        {addingChapter && (
          <div style={S.addChapterRow}>
            <Plus size={17} style={{ color: "#3b82f6", flexShrink: 0 }} />
            <input
              autoFocus
              type="text"
              value={newChapterName}
              onChange={(e) => setNewChapterName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveNewChapter();
                if (e.key === "Escape") {
                  setAddingChapter(false);
                  setNewChapterName("");
                }
              }}
              placeholder="Nom du nouveau chapitre…"
              style={S.inputAddChapter}
            />
            <button style={S.btnIcon("green")} onClick={saveNewChapter}>
              <Check size={15} />
            </button>
            <button
              style={S.btnIcon("red")}
              onClick={() => {
                setAddingChapter(false);
                setNewChapterName("");
              }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* ── Chapters list ── */}
        {!loading && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {chapters.length === 0 && !addingChapter && (
              <div style={S.emptyBox}>Aucun chapitre. Créez-en un !</div>
            )}

            {chapters.map((chapter, idx) => {
              const expanded = !!expandedChapters[chapter.id];
              return (
                <div key={chapter.id} style={S.chapterCard}>
                  {/* ── Chapter header row ── */}
                  <div style={S.chapterHeader(expanded)}>
                    {/* Up / Down */}
                    <div style={S.orderBtns}>
                      <button
                        style={S.orderBtn(idx === 0)}
                        onClick={() => moveChapter(chapter.id, -1)}
                        disabled={idx === 0}
                        title="Monter"
                      >
                        <ArrowUp size={11} />
                      </button>
                      <button
                        style={S.orderBtn(idx === chapters.length - 1)}
                        onClick={() => moveChapter(chapter.id, 1)}
                        disabled={idx === chapters.length - 1}
                        title="Descendre"
                      >
                        <ArrowDown size={11} />
                      </button>
                    </div>

                    {/* Index */}
                    <span style={S.orderNum}>{idx + 1}.</span>

                    {/* Name – editable inline */}
                    {editingChapterId === chapter.id ? (
                      <>
                        <input
                          autoFocus
                          type="text"
                          value={editingChapterName}
                          onChange={(e) =>
                            setEditingChapterName(e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditChapter(chapter.id);
                            if (e.key === "Escape") setEditingChapterId(null);
                          }}
                          style={S.inputChapter}
                        />
                        <button
                          style={S.btnIcon("green")}
                          onClick={() => saveEditChapter(chapter.id)}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          style={S.btnIcon("red")}
                          onClick={() => setEditingChapterId(null)}
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span
                          style={{
                            flex: 1,
                            fontWeight: 600,
                            fontSize: "1rem",
                            color: "#1f2937",
                          }}
                        >
                          {chapter.name}
                        </span>
                        <span style={S.badge}>
                          {chapter.competences.length} compétence
                          {chapter.competences.length !== 1 ? "s" : ""}
                        </span>
                        <button
                          style={S.btnIcon("ghost")}
                          title="Renommer"
                          onClick={() => {
                            setEditingChapterId(chapter.id);
                            setEditingChapterName(chapter.name);
                          }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          style={S.btnIcon("danger")}
                          title="Supprimer"
                          onClick={() =>
                            deleteChapter(chapter.id, chapter.name)
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          style={S.btnIcon("toggle")}
                          title={expanded ? "Réduire" : "Développer"}
                          onClick={() => toggleChapter(chapter.id)}
                        >
                          {expanded ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </button>
                      </>
                    )}
                  </div>

                  {/* ── Competences zone ── */}
                  {expanded && (
                    <div style={S.compZone}>
                      {chapter.competences.length === 0 &&
                        addingCompetenceFor !== chapter.id && (
                          <p
                            style={{
                              color: "#9ca3af",
                              fontSize: "0.875rem",
                              marginBottom: "0.625rem",
                              fontStyle: "italic",
                            }}
                          >
                            Aucune compétence pour ce chapitre.
                          </p>
                        )}

                      {/* List */}
                      {chapter.competences.length > 0 && (
                        <div style={S.compList}>
                          {chapter.competences.map((comp) => (
                            <div key={comp.id} style={S.compRow}>
                              <span style={S.compDot} />

                              {editingCompetenceId === comp.id ? (
                                <>
                                  <input
                                    autoFocus
                                    type="text"
                                    value={editingCompetenceName}
                                    onChange={(e) =>
                                      setEditingCompetenceName(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter")
                                        saveEditCompetence(comp.id);
                                      if (e.key === "Escape")
                                        setEditingCompetenceId(null);
                                    }}
                                    style={S.inputComp}
                                  />
                                  <button
                                    style={S.btnIcon("green")}
                                    onClick={() => saveEditCompetence(comp.id)}
                                  >
                                    <Check size={12} />
                                  </button>
                                  <button
                                    style={S.btnIcon("red")}
                                    onClick={() => setEditingCompetenceId(null)}
                                  >
                                    <X size={12} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span style={S.compName}>{comp.name}</span>
                                  <button
                                    style={S.btnCompIcon("ghost")}
                                    title="Modifier"
                                    onClick={() => {
                                      setEditingCompetenceId(comp.id);
                                      setEditingCompetenceName(comp.name);
                                    }}
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    style={S.btnCompIcon("danger")}
                                    title="Supprimer"
                                    onClick={() =>
                                      deleteCompetence(comp.id, comp.name)
                                    }
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add competence */}
                      {addingCompetenceFor === chapter.id ? (
                        <div style={S.addCompRow}>
                          <input
                            autoFocus
                            type="text"
                            value={newCompetenceName}
                            onChange={(e) =>
                              setNewCompetenceName(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                saveNewCompetence(chapter.id);
                              if (e.key === "Escape") {
                                setAddingCompetenceFor(null);
                                setNewCompetenceName("");
                              }
                            }}
                            placeholder="Nom de la compétence…"
                            style={S.inputAddComp}
                          />
                          <button
                            style={S.btnIcon("green")}
                            onClick={() => saveNewCompetence(chapter.id)}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            style={S.btnIcon("red")}
                            onClick={() => {
                              setAddingCompetenceFor(null);
                              setNewCompetenceName("");
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          style={S.btnAddComp}
                          onClick={() => {
                            setAddingCompetenceFor(chapter.id);
                            setNewCompetenceName("");
                          }}
                        >
                          <Plus size={14} />
                          Ajouter une compétence
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Spin animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default TaxonomyManager;
