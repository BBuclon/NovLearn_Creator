import ComplexPlaneRenderer from "./ComplexPlaneRenderer";
import DiscreteGraphRenderer from "./DiscreteGraphRenderer";
import EquationRenderer from "./EquationRenderer";
import GraphRenderer from "./GraphRenderer";
import MCQRenderer from "./MCQRenderer";
import ProbaTreeRenderer from "./ProbaTreeRenderer";
import QuestionRenderer from "./QuestionRenderer";
import SignTableRenderer from "./SignTableRenderer";
import StatsTableRenderer from "./StatsTableRenderer";
import TextRenderer from "./TextRenderer";
import VariationTableRenderer from "./VariationTableRenderer";
import VectorRenderer from "./VectorRenderer";

const RENDERERS = {
  text: TextRenderer,
  equation: EquationRenderer,
  graph: GraphRenderer,
  question: QuestionRenderer,
  mcq: MCQRenderer,
  signTable: SignTableRenderer,
  variationTable: VariationTableRenderer,
  statsTable: StatsTableRenderer,
  probaTree: ProbaTreeRenderer,
  vector: VectorRenderer,
  complexPlane: ComplexPlaneRenderer,
  discreteGraph: DiscreteGraphRenderer,
};

/**
 * Dispatch par type. Tous les renderers reçoivent `content` et `variables`
 * (les valeurs générées pour les @variables).
 */
const ElementRenderer = ({ element, variables = {} }) => {
  const { type, content } = element;
  const Renderer = RENDERERS[type];

  if (!Renderer) {
    console.warn(`Type d'élément non supporté dans le rendu : ${type}`);
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
        Type d'élément inconnu : <code>{type}</code>
      </div>
    );
  }

  return <Renderer content={content || {}} variables={variables} />;
};

export default ElementRenderer;
