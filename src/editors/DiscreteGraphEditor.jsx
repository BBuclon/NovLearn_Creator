import React from 'react';

const DiscreteGraphEditor = ({ content = {}, onUpdate }) => {
  // Valeurs par défaut
  const currentContent = {
    type: 'explicit',
    formula: 'n^2 / (n + 1)',
    numberOfTerms: 20,
    showGrid: true,
    ...content
  };

  const handleTypeChange = (newType) => {
    let updatedContent = {
      ...currentContent,
      type: newType
    };

    // Réinitialiser les champs selon le type
    if (newType === 'explicit') {
      delete updatedContent.recursiveFormula;
      delete updatedContent.firstTerm;
      delete updatedContent.manualTerms;
      if (!updatedContent.formula) {
        updatedContent.formula = 'n^2 / (n + 1)';
      }
    } else if (newType === 'recursive') {
      delete updatedContent.formula;
      delete updatedContent.manualTerms;
      if (!updatedContent.recursiveFormula) {
        updatedContent.recursiveFormula = '0.5 * u_n + 2';
        updatedContent.firstTerm = '1';
      }
    } else if (newType === 'manual') {
      delete updatedContent.formula;
      delete updatedContent.recursiveFormula;
      delete updatedContent.firstTerm;
      if (!updatedContent.manualTerms) {
        updatedContent.manualTerms = ['1', '2', '3', '4', '5'];
      }
    }

    onUpdate(updatedContent);
  };

  const updateManualTerm = (index, value) => {
    const terms = [...(currentContent.manualTerms || [])];
    terms[index] = value;
    onUpdate({ ...currentContent, manualTerms: terms });
  };

  const addManualTerm = () => {
    const terms = currentContent.manualTerms || [];
    onUpdate({ ...currentContent, manualTerms: [...terms, ''] });
  };

  const removeManualTerm = (index) => {
    const terms = (currentContent.manualTerms || []).filter((_, i) => i !== index);
    onUpdate({ ...currentContent, manualTerms: terms });
  };

  return (
    <div className="space-y-4">
      {/* Type de suite */}
      <div>
        <label className="block text-sm font-medium mb-1">Type de suite</label>
        <select
          value={currentContent.type}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="explicit">Suite explicite u_n = f(n)</option>
          <option value="recursive">Suite récurrente u_{`n+1`} = f(u_n)</option>
          <option value="manual">Termes manuels</option>
        </select>
      </div>

      {/* FORMULE EXPLICITE */}
      {currentContent.type === 'explicit' && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Formule u_n = 
          </label>
          <input
            type="text"
            value={currentContent.formula || ''}
            onChange={(e) => onUpdate({ ...currentContent, formula: e.target.value })}
            className="w-full p-2 border rounded font-mono"
            placeholder="Ex: n^2 / (n + 1)"
          />
          <p className="text-xs text-gray-600 mt-1">
            Utilisez <code>n</code> pour l'indice et <code>@a</code> pour les variables.
            Ex : <code>@a*n + @b</code>, <code>2^n</code>, <code>sqrt(n)</code>, <code>sin(n)</code>.
          </p>
        </div>
      )}

      {/* FORMULE RÉCURRENTE */}
      {currentContent.type === 'recursive' && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">
              Premier terme u₀ =
            </label>
            <input
              type="text"
              value={currentContent.firstTerm || ''}
              onChange={(e) => onUpdate({ ...currentContent, firstTerm: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Ex: 1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Formule u_{`n+1`} =
            </label>
            <input
              type="text"
              value={currentContent.recursiveFormula || ''}
              onChange={(e) => onUpdate({ ...currentContent, recursiveFormula: e.target.value })}
              className="w-full p-2 border rounded font-mono"
              placeholder="Ex: 0.5 * u_n + 2"
            />
            <p className="text-xs text-gray-600 mt-1">
              Utilisez u_n pour le terme précédent
            </p>
          </div>
        </>
      )}

      {/* TERMES MANUELS */}
      {currentContent.type === 'manual' && (
        <div>
          <label className="block text-sm font-medium mb-1">Termes de la suite</label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(currentContent.manualTerms || []).map((term, index) => (
              <div key={index} className="flex gap-2 items-center">
                <span className="text-sm font-mono w-16">u_{index} =</span>
                <input
                  type="text"
                  value={term || ''}
                  onChange={(e) => updateManualTerm(index, e.target.value)}
                  className="flex-1 p-1 border rounded"
                  placeholder="Valeur"
                />
                <button
                  type="button"
                  onClick={() => removeManualTerm(index)}
                  className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addManualTerm}
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            + Ajouter un terme
          </button>
        </div>
      )}

      {/* Nombre de termes */}
      {currentContent.type !== 'manual' && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Nombre de termes à calculer
          </label>
          <input
            type="text"  // Changé de "number" à "text" pour mieux contrôler la saisie
            value={currentContent.numberOfTerms || ''}
            onChange={(e) => {
              const value = e.target.value;
              // Permettre la saisie vide ou des chiffres seulement
              if (value === '' || /^\d+$/.test(value)) {
                onUpdate({ 
                  ...currentContent, 
                  numberOfTerms: value === '' ? '' : parseInt(value)
                });
              }
            }}
            onBlur={(e) => {
              // Remettre une valeur par défaut si vide lors de la perte de focus
              if (e.target.value === '') {
                onUpdate({ 
                  ...currentContent, 
                  numberOfTerms: 20
                });
              }
            }}
            className="w-full p-2 border rounded"
            placeholder="20"
          />
        </div>
      )}

      {/* Limites du graphe */}
      <div>
        <label className="block text-sm font-medium mb-1">Fenêtre du graphe</label>
        <div className="grid grid-cols-4 gap-2">
          {['minX', 'maxX', 'minY', 'maxY'].map(field => (
            <div key={field}>
              <input
                type="number"
                step="any"
                value={currentContent[field] ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  onUpdate({ 
                    ...currentContent, 
                    [field]: value === '' ? undefined : parseFloat(value)
                  });
                }}
                className="w-full p-1 border rounded text-sm"
                placeholder={field.includes('min') ? '0' : 'Auto'}
              />
              <span className="text-xs text-gray-500">
                {field.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Limite */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="showLimit"
          checked={currentContent.showLimit || false}
          onChange={(e) => onUpdate({ ...currentContent, showLimit: e.target.checked })}
        />
        <label htmlFor="showLimit" className="text-sm">Afficher une limite L =</label>
        {currentContent.showLimit && (
          <input
            type="number"
            step="any"
            value={currentContent.limit ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              onUpdate({ 
                ...currentContent, 
                limit: value === '' ? undefined : parseFloat(value)
              });
            }}
            className="w-20 p-1 border rounded text-sm"
            placeholder="Valeur"
          />
        )}
      </div>

      {/* Options d'affichage */}
      <div className="space-y-1">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={currentContent.showGrid !== false}
            onChange={(e) => onUpdate({ ...currentContent, showGrid: e.target.checked })}
          />
          <span className="text-sm">Grille</span>
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={currentContent.showValues || false}
            onChange={(e) => onUpdate({ ...currentContent, showValues: e.target.checked })}
          />
          <span className="text-sm">Valeurs sur les points</span>
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={currentContent.connectPoints || false}
            onChange={(e) => onUpdate({ ...currentContent, connectPoints: e.target.checked })}
          />
          <span className="text-sm">Relier les points</span>
        </label>
      </div>
    </div>
  );
};

export default DiscreteGraphEditor;