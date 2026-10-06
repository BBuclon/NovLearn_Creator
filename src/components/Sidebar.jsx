import { Code, Info } from "lucide-react";

const Sidebar = () => {
  return (
    <aside className="w-full bg-white rounded-xl shadow-lg overflow-hidden self-start">
      <div className="p-4 space-y-6">
        {/* --- GUIDE MOTEUR --- */}
        <section className="bg-blue-50 rounded-lg border border-blue-100 p-3">
          <h3 className="font-bold text-blue-900 text-sm mb-3 flex items-center gap-2 border-b border-blue-200 pb-2">
            <Info size={16} /> Fonctionnement Moteur
          </h3>

          <div className="space-y-3 text-xs text-blue-800">
            <div>
              <span className="font-bold block mb-1">
                1. Variables Dynamiques
              </span>
              <p className="opacity-80 mb-1">
                Définissez vos variables à droite (a, b...), puis utilisez{" "}
                <code className="bg-white px-1 border rounded">@</code> pour les
                insérer.
              </p>
              <div className="bg-white p-2 rounded border border-blue-100 font-mono text-[10px]">
                f(x) = @a * x + @b
              </div>
            </div>

            <div>
              <span className="font-bold block mb-1">
                2. Simplification Auto
              </span>
              <p className="opacity-80">Le moteur nettoie automatiquement :</p>
              <ul className="list-disc list-inside ml-1 mt-1 opacity-80 space-y-1">
                <li>
                  <code className="bg-white px-1">1x</code> devient{" "}
                  <code className="bg-white px-1">x</code>
                </li>
                <li>
                  <code className="bg-white px-1">0x</code> disparaît
                </li>
                <li>
                  <code className="bg-white px-1">+ -5</code> devient{" "}
                  <code className="bg-white px-1">- 5</code>
                </li>
              </ul>
            </div>

            <div>
              <span className="font-bold block mb-1">
                3. Valeurs Interdites
              </span>
              <p className="opacity-80">
                Dans le manager de variables, utilisez le champ "Interdire" pour
                exclure des valeurs (ex: division par 0).
                <br />
                Syntaxe : <code className="bg-white px-1">0; -1; 5</code>
              </p>
            </div>
          </div>
        </section>

        {/* --- GUIDE LATEX --- */}
        <section className="bg-gray-50 rounded-lg border border-gray-200 p-3">
          <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2 border-b border-gray-200 pb-2">
            <Code size={16} /> Dictionnaire LaTeX
          </h3>
          <p className="text-[10px] text-gray-500 mb-3">
            Entourez toujours de <code>$</code> pour le texte et <code>$$</code>{" "}
            pour centrer.
          </p>
          <p className="text-[10px] text-gray-500 mb-3">
            Pas besoin de mettre de <code>\text</code>. Attention à
            l'utilisation des fonctions de variables qui se simplifie. Mettez
            les crochets pour les intervalles et les ; entre les solutions
            d'équations.
          </p>

          <div className="space-y-4">
            {/* 1. Opérations */}
            <LatexCategory title="Opérations & Écriture">
              <LatexItem code="\frac{a}{b}" label="Fraction" />
              <LatexItem code="\sqrt{x}" label="Racine" />
              <LatexItem code="x^{n}" label="Puissance" />
              <LatexItem code="u_{n}" label="Indice" />
              <LatexItem code="*" label="Fois (x)" />
            </LatexCategory>

            {/* 2. Ensembles */}
            <LatexCategory title="Ensembles & Logique">
              <LatexItem code="\mathbb{R}" label="Réels" />
              <LatexItem code="\mathbb{N}" label="Entiers N." />
              <LatexItem code="\in" label="Appartient" />
              <LatexItem code="\notin" label="N'appartient pas" />
              <LatexItem code="\cup" label="Union" />
              <LatexItem code="\cap" label="Intersection" />
              <LatexItem code="\emptyset" label="Vide" />
              <LatexItem code="\infty" label="Infini" />
            </LatexCategory>

            {/* 3. Comparaisons */}
            <LatexCategory title="Comparaisons">
              <LatexItem code="\leq" label="Inf. ou égal" />
              <LatexItem code="\geq" label="Sup. ou égal" />
              <LatexItem code="\neq" label="Différent" />
              <LatexItem code="\approx" label="Environ" />
              <LatexItem code="\equiv" label="Équivalent" />
            </LatexCategory>

            {/* 4. Géométrie & Vecteurs */}
            <LatexCategory title="Géométrie">
              <LatexItem code="\vec{u}" label="Vecteur u" />
              <LatexItem code="\vec{AB}" label="Vecteur AB" />
              <LatexItem code="\lVert \vec{u} \rVert" label="Norme" />
              <LatexItem code="\pi" label="Pi" />
              <LatexItem code="\perp" label="Perpendiculaire" />
              <LatexItem code="\widehat{ABC}" label="Angle" />
            </LatexCategory>

            {/* 5. Fonctions */}
            <LatexCategory title="Fonctions">
              <LatexItem code="f(x)" label="Fonction" />
              <LatexItem code="\sin(x)" label="Sinus" />
              <LatexItem code="\cos(x)" label="Cosinus" />
              <LatexItem code="\ln(x)" label="Log népérien" />
              <LatexItem code="e^x" label="Exponentielle" />
              <LatexItem code="\lim_{x \to +\infty}" label="Limite" />
              <LatexItem code="\int_{a}^{b}" label="Intégrale" />
            </LatexCategory>

            {/* 6. Grec */}
            <LatexCategory title="Lettres Grecques">
              <LatexItem code="\alpha" label="Alpha" />
              <LatexItem code="\beta" label="Beta" />
              <LatexItem code="\Delta" label="Delta" />
              <LatexItem code="\lambda" label="Lambda" />
              <LatexItem code="\theta" label="Theta" />
              <LatexItem code="\Sigma" label="Somme" />
            </LatexCategory>
          </div>
        </section>
      </div>
    </aside>
  );
};

// Petits composants internes pour organiser le code
const LatexCategory = ({ title, children }) => (
  <div>
    <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
      {title}
    </h4>
    <div className="grid grid-cols-1 gap-1">{children}</div>
  </div>
);

const LatexItem = ({ code, label }) => (
  <div
    className="flex items-center justify-between bg-white px-2 py-1.5 rounded border border-gray-100 text-xs hover:border-blue-300 group cursor-pointer"
    title="Cliquer pour copier"
    onClick={() => navigator.clipboard?.writeText(code).catch(() => {})}
  >
    <span className="text-gray-500">{label}</span>
    <code className="font-mono text-purple-700 bg-purple-50 px-1 rounded text-[10px] group-hover:bg-purple-100 select-all">
      {code}
    </code>
  </div>
);

export default Sidebar;
