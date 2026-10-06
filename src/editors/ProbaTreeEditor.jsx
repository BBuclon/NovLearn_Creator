import { Plus, RotateCcw, Trash2 } from "lucide-react";

const ROOT_NODE = { id: 0, label: "Départ", isRoot: true };

/**
 * Modèle : content.nodes = [{ id, label, isRoot? , parent?, proba? }]
 * Un nœud sans `parent` (ou avec isRoot) est une racine.
 */
const normalize = (content) => ({
  showPathProbabilities: false,
  ...content,
  nodes: Array.isArray(content?.nodes) && content.nodes.length > 0 ? content.nodes : [ROOT_NODE],
});

export const ProbaTreeEditor = ({ content, onUpdate }) => {
  const safeContent = normalize(content);
  const nodes = safeContent.nodes;

  const update = (patch) => onUpdate({ ...safeContent, ...patch });

  const updateNode = (nodeId, field, value) =>
    update({ nodes: nodes.map((n) => (n.id === nodeId ? { ...n, [field]: value } : n)) });

  const deleteNode = (nodeId) => {
    // Supprime le nœud et toute sa descendance
    const toDelete = new Set([nodeId]);
    let changed = true;
    while (changed) {
      changed = false;
      nodes.forEach((n) => {
        if (n.parent !== undefined && toDelete.has(n.parent) && !toDelete.has(n.id)) {
          toDelete.add(n.id);
          changed = true;
        }
      });
    }
    update({ nodes: nodes.filter((n) => !toDelete.has(n.id)) });
  };

  const addChild = (parentId) => {
    const siblings = nodes.filter((n) => n.parent === parentId);
    const newId = Math.max(0, ...nodes.map((n) => Number(n.id) || 0)) + 1;
    update({
      nodes: [
        ...nodes,
        {
          id: newId,
          label: `Branche ${siblings.length + 1}`,
          parent: parentId,
          proba: "0.5",
        },
      ],
    });
  };

  const resetTree = () => update({ nodes: [ROOT_NODE] });

  // Regroupement par niveau (profondeur)
  const depthOf = (node) => {
    let depth = 0;
    let current = node;
    let guard = 0;
    while (current && current.parent !== undefined && guard++ < 100) {
      current = nodes.find((n) => n.id === current.parent);
      if (current) depth++;
    }
    return depth;
  };
  const nodesByLevel = {};
  nodes.forEach((node) => {
    const level = depthOf(node);
    (nodesByLevel[level] ||= []).push(node);
  });
  const levels = Object.keys(nodesByLevel).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium">Configuration de l'arbre</label>
          <span className="text-xs text-gray-500">
            Construisez votre arbre niveau par niveau. Labels et probabilités acceptent{" "}
            <code>@a</code> et le LaTeX (<code>$\bar&#123;A&#125;$</code>, <code>\frac&#123;1&#125;&#123;3&#125;</code>).
          </span>
        </div>
        <button
          type="button"
          onClick={resetTree}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          <RotateCcw size={14} /> Réinitialiser
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!safeContent.showPathProbabilities}
          onChange={(e) => update({ showPathProbabilities: e.target.checked })}
        />
        Afficher la probabilité de chaque chemin (feuilles)
      </label>

      <div className="space-y-4">
        {levels.map((level) => (
          <div key={level}>
            <div className="mb-2 pb-1 border-b border-gray-200 text-sm">
              <span className="font-bold text-purple-700">
                {level === "0" ? "🌳 Racine" : `📊 Niveau ${level}`}
              </span>
              <span className="text-gray-500 ml-2">
                ({nodesByLevel[level].length} nœud{nodesByLevel[level].length > 1 ? "s" : ""})
              </span>
            </div>

            <div className="space-y-2">
              {nodesByLevel[level].map((node) => {
                const parent = nodes.find((n) => n.id === node.parent);
                return (
                  <div
                    key={node.id}
                    className="border-2 border-purple-200 rounded-lg p-3 bg-white hover:bg-purple-50 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono bg-purple-100 px-2 py-1 rounded">
                            #{node.id}
                          </span>
                          <input
                            className="flex-1 p-2 border rounded text-sm"
                            placeholder="Label du nœud"
                            value={node.label || ""}
                            onChange={(e) => updateNode(node.id, "label", e.target.value)}
                          />
                          {!node.isRoot && node.parent !== undefined && (
                            <input
                              className="w-28 p-2 border rounded text-sm font-mono"
                              placeholder="Proba"
                              value={node.proba || ""}
                              onChange={(e) => updateNode(node.id, "proba", e.target.value)}
                            />
                          )}
                        </div>
                        {parent && (
                          <div className="text-xs text-gray-500 ml-1">
                            ↳ Parent :{" "}
                            <span className="font-medium text-purple-600">
                              {parent.label || `#${parent.id}`}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => addChild(node.id)}
                          className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs font-medium"
                          title="Ajouter un enfant"
                        >
                          <Plus size={12} /> Enfant
                        </button>
                        {!node.isRoot && node.parent !== undefined && (
                          <button
                            type="button"
                            onClick={() => deleteNode(node.id)}
                            className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-medium"
                            title="Supprimer ce nœud et ses enfants"
                          >
                            <Trash2 size={12} /> Suppr.
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {nodes.length === 1 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center text-sm text-blue-800">
          🌱 Commencez par ajouter des enfants au nœud racine « {nodes[0].label} »
        </div>
      )}
    </div>
  );
};

export default ProbaTreeEditor;
