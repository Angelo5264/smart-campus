import { useModels } from "../hooks/queries";
import {
  Card,
  ErrorState,
  Experimental,
  Loading,
  PageHeading,
} from "../components/common/UI";
import { MetricBars } from "../components/charts/Charts";
import { count, dateTime, decimal } from "../utils/format";
export function ModelsPage() {
  const query = useModels();
  return (
    <>
      <PageHeading
        eyebrow="TRANSPARENCIA DEL MODELO"
        title="Modelos de Machine Learning"
        description="Métricas reales, procedencia y alcance de los artefactos de entrenamiento."
        action={<Experimental />}
      />
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : (
        <>
          <div className="two-columns">
            <Card>
              <div className="section-title">
                <h2>Random Forest</h2>
                <span className="subtle-tag">Clasificación binaria</span>
              </div>
              <p className="small muted">
                Dropout = 1 · Graduate = 0 · Enrolled excluido
              </p>
              <MetricBars metrics={query.data.random_forest.metrics} />
              <dl className="metadata">
                <div>
                  <dt>Entrenamiento / prueba</dt>
                  <dd>
                    {count(query.data.random_forest.metrics.train_rows)} /{" "}
                    {count(query.data.random_forest.metrics.test_rows)}
                  </dd>
                </div>
                <div>
                  <dt>Enrolled excluidos</dt>
                  <dd>
                    {count(query.data.random_forest.metrics.excluded_enrolled)}
                  </dd>
                </div>
              </dl>
              {query.data.random_forest.metrics.confusion_matrix && (
                <>
                  <h3>Matriz de confusión</h3>
                  <p className="small muted">
                    Filas: etiqueta observada · Columnas: predicción
                  </p>
                  <div className="table-scroll">
                    <table className="matrix">
                      <thead>
                        <tr>
                          <th>Real / Predicho</th>
                          {(
                            query.data.random_forest.metrics
                              .confusion_matrix_labels || ["Clase 0", "Clase 1"]
                          ).map((label) => (
                            <th key={label}>{label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {query.data.random_forest.metrics.confusion_matrix.map(
                          (row, i) => (
                            <tr key={i}>
                              <th>
                                {query.data.random_forest.metrics
                                  .confusion_matrix_labels?.[i] || `Clase ${i}`}
                              </th>
                              {row.map((value, j) => (
                                <td
                                  className={i === j ? "diagonal" : ""}
                                  key={j}
                                >
                                  {count(value)}
                                </td>
                              ))}
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </Card>
            <Card>
              <div className="section-title">
                <h2>K-Means</h2>
                <span className="subtle-tag">Clustering exploratorio</span>
              </div>
              <div className="kmeans-stats">
                <div>
                  <span>Clusters seleccionados</span>
                  <strong>{query.data.kmeans.metrics.selected_k}</strong>
                </div>
                <div>
                  <span>Silueta del K seleccionado</span>
                  <strong>
                    {query.data.kmeans.metrics.silhouette_by_k[
                      String(query.data.kmeans.metrics.selected_k)
                    ]?.toFixed(4) ?? "No disponible"}
                  </strong>
                </div>
              </div>
              <h3>Evaluación de valores de K</h3>
              <table>
                <thead>
                  <tr>
                    <th>K</th>
                    <th>Coeficiente de silueta</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(
                    query.data.kmeans.metrics.silhouette_by_k,
                  ).map(([k, value]) => (
                    <tr key={k}>
                      <td>
                        {k}
                        {Number(k) === query.data.kmeans.metrics.selected_k && (
                          <span className="subtle-tag ml-2">Seleccionado</span>
                        )}
                      </td>
                      <td>{value.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-5">
                <h3>Tamaño de los perfiles</h3>
                {query.data.kmeans.metrics.profiles.map((p) => (
                  <p className="profile-size" key={p.cluster}>
                    Cluster {p.cluster}
                    <strong>{count(p.count)} registros</strong>
                  </p>
                ))}
              </div>
            </Card>
          </div>
          <div className="two-columns">
            {[query.data.random_forest, query.data.kmeans].map((model) => (
              <Card key={model.model}>
                <h2>Artefacto · {model.model}</h2>
                <dl className="metadata">
                  <div>
                    <dt>Versión</dt>
                    <dd className="mono">{model.model_version}</dd>
                  </div>
                  <div>
                    <dt>Entrenado · hora local</dt>
                    <dd>{dateTime(model.created_at)}</dd>
                  </div>
                  <div>
                    <dt>Origen / modo</dt>
                    <dd>
                      {model.dataset} / {model.prediction_mode}
                    </dd>
                  </div>
                  <div>
                    <dt>Semilla / scikit-learn</dt>
                    <dd>
                      {decimal(model.seed)} / {model.sklearn_version}
                    </dd>
                  </div>
                </dl>
                <details>
                  <summary>
                    Variables seleccionadas ({model.features.length})
                  </summary>
                  <ul className="feature-names">
                    {model.features.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </details>
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  );
}
