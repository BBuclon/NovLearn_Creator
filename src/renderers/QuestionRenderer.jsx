import MathText from '../utils/mathRenderer';
import { HelpCircle, Lightbulb, Info } from 'lucide-react';

const QuestionRenderer = ({ content, variables }) => {
  const { 
    question, 
    answerFormat = 'text', 
    points = 1,
    correctAnswer,
    hint,           // Récupération indice
    explanation     // Récupération explication
  } = content;

  // 1. Préfixe pour l'élève (S=, x appartient...)
  const getPrefix = () => {
    switch (answerFormat) {
      case 'set': return 'S =';
      case 'interval': return 'x \\in';
      case 'expression': return ''; 
      default: return '';
    }
  };

  // 2. Placeholder intelligent
  const getPlaceholder = () => {
    switch (answerFormat) {
      case 'set': return '{ ... }'; 
      case 'interval': return '] ... ; ... [';
      case 'expression': return 'f\'(x)...';
      default: return 'Votre réponse...';
    }
  };

  // 3. FONCTION MAGIQUE : Formate la solution
  const getFormattedSolution = () => {
    if (!correctAnswer) return '';
    
    let sol = correctAnswer;

    sol = sol.replace(/\bvide\b/g, '\\emptyset');
    sol = sol.replace(/\binf\b/g, '\\infty');
    sol = sol.replace(/\bU\b/g, '\\cup');

  if (answerFormat === 'set') {
    if (!sol.includes('\\emptyset') && !sol.trim().startsWith('\\{')) {
      sol = `\\{ ${sol} \\}`;
    }
  }

    return sol;
  };

  return (
    <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-100">
      
      {/* En-tête */}
      <div className="flex justify-between items-start mb-4">
        <div className="text-lg text-gray-800 font-medium leading-relaxed w-full">
          <MathText content={question} variables={variables} />
          
          {/* Affichage de l'indice s'il existe */}
          {hint && (
            <div className="mt-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 p-2 rounded-lg flex items-start gap-2">
                <Lightbulb size={16} className="mt-0.5 shrink-0" />
                <div>
                    <span className="font-bold text-xs uppercase block mb-1">Indice :</span>
                    <MathText content={hint} variables={variables} />
                </div>
            </div>
          )}
        </div>
        <div className="shrink-0 ml-4 px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-500">
          {points} pt{points > 1 ? 's' : ''}
        </div>
      </div>

      {/* Zone Réponse Élève */}
      <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-3">
        {getPrefix() && (
          <div className="text-gray-700 font-bold text-lg">
            <MathText content={`$${getPrefix()}$`} />
          </div>
        )}
        <div className="flex-1">
          <input 
             type="text" 
             className="w-full p-2 border-2 border-dashed border-gray-300 rounded bg-white"
             placeholder={getPlaceholder()}
             disabled // Désactivé en mode éditeur
          />
        </div>
      </div>

      {/* Solution & Explication (Visible Prof) */}
      {(correctAnswer || explanation) && (
        <div className="mt-4 pt-3 border-t border-gray-100 animate-in fade-in">
          
          {/* La réponse brute */}
          {correctAnswer && (
              <div className="flex items-start gap-2 mb-3">
                <div className="p-1 bg-green-100 text-green-600 rounded">
                    <HelpCircle size={14} />
                </div>
                <div>
                    <span className="text-xs font-bold text-green-700 uppercase">Solution attendue :</span>
                    <div className="text-sm text-gray-700 font-medium mt-1 px-2 py-1 bg-green-50 rounded border border-green-100 inline-block">
                        <MathText content={`$${getFormattedSolution()}$`} variables={variables} />
                    </div>
                </div>
              </div>
          )}

          {/* L'explication détaillée */}
          {explanation && (
              <div className="flex items-start gap-2 pl-1">
                <div className="p-1 bg-indigo-100 text-indigo-600 rounded">
                    <Info size={14} />
                </div>
                <div className="w-full">
                    <span className="text-xs font-bold text-indigo-700 uppercase">Explication :</span>
                    <div className="text-sm text-gray-600 mt-1 p-2 bg-indigo-50 rounded border border-indigo-100">
                        <MathText content={explanation} variables={variables} />
                    </div>
                </div>
              </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionRenderer;