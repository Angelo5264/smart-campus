import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Network,
  ChartNoAxesCombined,
} from "lucide-react";
import { getStudents } from "../api/students";
import {
  Card,
  Empty,
  ErrorState,
  Loading,
  PageHeading,
} from "../components/common/UI";
import { StudentPicker } from "../components/common/StudentPicker";
import { count } from "../utils/format";
import { StudentFilters } from "../components/students/StudentFilters";
import {
  readStudentFilters,
  filterDefinitions,
  type FilterKey,
} from "../utils/studentFilters";
export function StudentsPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const rawPage = Number(params.get("page") || 1);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const rawSize = Number(params.get("size") || 20);
  const size = [10, 20, 50].includes(rawSize) ? rawSize : 20;
  const filters = readStudentFilters(params);
  const query = useQuery({
    queryKey: ["students", page, size, filters],
    queryFn: () => getStudents(page, size, filters),
  });
  const updateParams = (values: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(values).forEach(([key, value]) => next.set(key, value));
    setParams(next);
  };
  const changePage = (value: number) =>
    updateParams({ page: String(value), size: String(size) });
  const changeFilter = (key: FilterKey, value: string) => {
    const next = new URLSearchParams(params);
    next.set("page", "1");
    if (value === filterDefinitions.find((f) => f.key === key)?.defaultValue)
      next.delete(key);
    else next.set(key, value);
    setParams(next);
  };
  const clearFilters = () => {
    const next = new URLSearchParams(params);
    filterDefinitions.forEach((f) => next.delete(f.key));
    next.set("page", "1");
    setParams(next);
  };
  return (
    <>
      <PageHeading
        eyebrow="EXPLORACIÓN DE REGISTROS"
        title="Estudiantes"
        description="Registros anónimos del dataset. Selecciona un ID para conocer su información."
      />
      <Card>
        <div className="section-title">
          <div>
            <h2>Buscar por identificador</h2>
            <p className="muted small">
              El ID es interno a esta demo, no un código institucional.
            </p>
          </div>
        </div>
        <StudentPicker
          onSelect={(id) => navigate(`/students/${id}`)}
          label="Abrir detalle"
        />
      </Card>
      <StudentFilters
        filters={filters}
        onChange={changeFilter}
        onClear={clearFilters}
      />
      {query.data?.academic_summary && (
        <section aria-label="Disponibilidad académica global">
          <p className="small muted mb-3">
            Conteos de todos los estudiantes importados, independientes de los
            filtros.
          </p>
          <div className="stats-grid">
            {(
              [
                ["total", "Total de estudiantes"],
                ["complete", "Con información académica"],
                ["partial", "Información académica parcial"],
                ["none", "Sin información académica"],
              ] as const
            ).map(([key, label]) => (
              <Card className="stat-card" key={key}>
                <div>{label}</div>
                <strong>{count(query.data.academic_summary![key])}</strong>
              </Card>
            ))}
          </div>
        </section>
      )}
      <Card className="table-card">
        <div className="table-heading">
          <h2>
            Resultados{" "}
            {query.data && (
              <span className="subtle-tag">{count(query.data.total)}</span>
            )}
          </h2>
          <label className="page-size">
            Por página{" "}
            <select
              value={size}
              onChange={(e) =>
                updateParams({ page: "1", size: e.target.value })
              }
            >
              {[10, 20, 50].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
        {query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <ErrorState error={query.error} retry={() => void query.refetch()} />
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ID de estudiante</th>
                    <th>Origen</th>
                    <th>Estado observado</th>
                    <th>Explorar</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <Link
                          className="student-link"
                          to={`/students/${row.id}`}
                        >
                          <span className="student-avatar" aria-hidden="true">
                            {String(row.id).padStart(2, "0")}
                          </span>
                          Estudiante #{row.id}
                        </Link>
                      </td>
                      <td>
                        <span className="subtle-tag">{row.source}</span>
                      </td>
                      <td className="muted small">Disponible en el detalle</td>
                      <td>
                        <div className="row-actions">
                          <Link
                            title={`Ver estudiante ${row.id}`}
                            aria-label={`Ver estudiante ${row.id}`}
                            className="btn secondary compact"
                            to={`/students/${row.id}`}
                          >
                            Detalle <ArrowRight size={14} />
                          </Link>
                          <Link
                            aria-label={`Predecir estudiante ${row.id}`}
                            title="Consultar o calcular predicción"
                            className="icon-button"
                            to={`/predictions?student_id=${row.id}`}
                          >
                            <ChartNoAxesCombined size={18} />
                          </Link>
                          <Link
                            aria-label={`Perfil del estudiante ${row.id}`}
                            title="Identificar perfil"
                            className="icon-button"
                            to={`/clusters?student_id=${row.id}`}
                          >
                            <Network size={18} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!query.data.items.length && (
              <Empty>
                {Object.keys(filters).length
                  ? "No hay coincidencias en esta página para los filtros seleccionados."
                  : "No hay registros en esta página."}
              </Empty>
            )}
            <div className="pagination">
              <span>
                {query.data.items.length
                  ? `${count((page - 1) * size + 1)}–${count((page - 1) * size + query.data.items.length)} de ${count(query.data.total)} registros`
                  : "Sin registros"}{" "}
                · Página {page}
              </span>
              <div>
                <button
                  className="btn secondary compact"
                  disabled={page <= 1}
                  onClick={() => changePage(page - 1)}
                >
                  <ChevronLeft size={16} />
                  Anterior
                </button>
                <button
                  className="btn secondary compact"
                  disabled={page * size >= query.data.total}
                  onClick={() => changePage(page + 1)}
                >
                  Siguiente
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
      <p className="small muted">
        Los datos académicos se consultan al abrir un detalle. No se descargan
        miles de registros ni se generan predicciones automáticamente.
      </p>
    </>
  );
}
