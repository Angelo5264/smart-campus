import { featureGroups, featureLabel } from "../../utils/features";
import {
  attributeValue,
  featureNotes,
  type AcademicFeatures,
} from "../../utils/academic";
const groups = [
  {
    title: "Datos sociodemográficos",
    keys: [
      ...Object.keys(featureGroups[0].fields),
      "Mother's qualification",
      "Father's qualification",
      "Mother's occupation",
      "Father's occupation",
    ],
  },
  {
    title: "Información de admisión",
    keys: Object.keys(featureGroups[1].fields),
  },
  {
    title: "Información económica",
    keys: Object.keys(featureGroups[3].fields).filter(
      (key) => !key.endsWith("occupation"),
    ),
  },
  {
    title: "Datos académicos adicionales",
    keys: ["Course", "Daytime/evening attendance"],
  },
];
export function StudentAttributes({
  features,
}: {
  features: AcademicFeatures;
}) {
  const known = new Set(
    featureGroups.flatMap((group) => Object.keys(group.fields)),
  );
  const additional = Object.keys(features).filter((key) => !known.has(key));
  return (
    <section id="student-attributes" aria-labelledby="attributes-title">
      <div className="section-title">
        <h2 id="attributes-title">Información complementaria</h2>
        <span className="subtle-tag">24 variables adicionales</span>
      </div>
      <div className="attribute-accordions">
        {[
          ...groups,
          ...(additional.length
            ? [{ title: "Otros campos recibidos", keys: additional }]
            : []),
        ].map((group) => (
          <details key={group.title} className="card attribute-group">
            <summary>
              {group.title}
              <span>{group.keys.length} variables</span>
            </summary>
            <dl className="feature-list">
              {group.keys.map((key) => (
                <div key={key}>
                  <dt>
                    {featureLabel(key)}
                    <small>{key}</small>
                    <span className="field-description">
                      {featureNotes[key] ||
                        "Código categórico original del diccionario UCI 697."}
                    </span>
                  </dt>
                  <dd>{attributeValue(key, features[key])}</dd>
                </div>
              ))}
            </dl>
          </details>
        ))}
      </div>
      <p className="small muted mt-3">
        Las claves y los valores originales se conservan.{" "}
        <a
          className="text-link"
          href="https://archive.ics.uci.edu/dataset/697/predict"
          target="_blank"
          rel="noreferrer"
        >
          Diccionario de variables UCI 697
        </a>
      </p>
    </section>
  );
}
