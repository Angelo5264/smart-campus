import { Card } from "../common/UI";
import {
  filterDefinitions,
  type FilterKey,
  type StudentFilters as Filters,
} from "../../utils/studentFilters";
export function StudentFilters({
  filters,
  onChange,
  onClear,
}: {
  filters: Filters;
  onChange: (key: FilterKey, value: string) => void;
  onClear: () => void;
}) {
  const active = filterDefinitions.filter(
    (filter) =>
      filters[filter.key] && filters[filter.key] !== filter.defaultValue,
  );
  return (
    <Card>
      <div className="section-title">
        <h2>Filtros de información académica</h2>
        <button
          className="btn secondary compact"
          disabled={!active.length}
          onClick={onClear}
        >
          Limpiar filtros
        </button>
      </div>
      <div className="academic-filter-grid">
        {filterDefinitions.map((filter) => (
          <div key={filter.key}>
            <label htmlFor={filter.key}>{filter.label}</label>
            <select
              id={filter.key}
              value={filters[filter.key] || filter.defaultValue}
              onChange={(e) => onChange(filter.key, e.target.value)}
            >
              {filter.options.map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="active-filters" aria-label="Filtros activos">
        {active.length ? (
          active.map((filter) => (
            <button
              className="filter-chip"
              key={filter.key}
              onClick={() => onChange(filter.key, filter.defaultValue)}
              aria-label={`Quitar filtro ${filter.label}`}
            >
              {filter.label}:{" "}
              {filter.options.find(
                ([value]) => value === filters[filter.key],
              )?.[1] || filters[filter.key]}{" "}
              <span aria-hidden="true">×</span>
            </button>
          ))
        ) : (
          <span className="small muted">Sin filtros activos</span>
        )}
      </div>
      <details>
        <summary>Criterios de disponibilidad</summary>
        <p className="small muted mt-3">
          Se consideran matrícula, aprobaciones, evaluaciones y promedio de cada
          semestre: ocho campos en total. Con información: ocho números
          disponibles; parcial: de uno a siete; sin información: ninguno. El
          cero es un valor disponible. NULL, claves ausentes, vacíos y valores
          no numéricos no son números disponibles.
        </p>
        <p className="small muted mt-3">
          Un semestre está disponible si al menos uno de sus cuatro campos tiene
          valor numérico. Esto describe los registros, no el ciclo cursado ni el
          ingreso del estudiante.
        </p>
        <p className="small muted mt-3">
          «Con» indica al menos un conteo positivo en el semestre seleccionado.
          «Sin» indica que no hay conteos positivos registrados: puede incluir
          ceros o datos desconocidos. «Conteo cero conocido» exige ceros en
          todos los campos seleccionados; «Conteo no disponible» identifica al
          menos un campo desconocido. Con ambos semestres, «Con» puede
          corresponder a cualquiera de ellos.
        </p>
      </details>
    </Card>
  );
}
