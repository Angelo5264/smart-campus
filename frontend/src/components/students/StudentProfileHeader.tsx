import { GraduationCap } from "lucide-react";
import type { Student } from "../../types";
import { Experimental } from "../common/UI";
import { targetLabel } from "../../utils/format";
export function StudentProfileHeader({ student }: { student: Student }) {
  return (
    <section
      className="card student-profile-header"
      aria-labelledby="student-title"
    >
      <div className="profile-heading">
        <span className="profile-emblem" aria-hidden="true">
          <GraduationCap size={30} />
        </span>
        <div>
          <div className="eyebrow">FICHA ACADÉMICA</div>
          <h1 id="student-title">Estudiante #{student.id}</h1>
          <p className="muted small">
            Fuente: {student.source} · Identificador interno: {student.id}
          </p>
        </div>
        <Experimental />
      </div>
      <div className="observed-state">
        <div>
          <h2>Estado académico observado</h2>
          <p className="small muted">
            Etiqueta histórica del dataset, distinta del riesgo estimado por el
            modelo.
          </p>
        </div>
        <span className="badge observed">
          {targetLabel[student.observed_target]} · {student.observed_target}
        </span>
      </div>
      <nav className="profile-nav" aria-label="Secciones de la ficha">
        <a href="#academic-summary">Resumen académico</a>
        <a href="#risk-evaluation">Evaluación predictiva</a>
        <a href="#student-attributes">Información complementaria</a>
      </nav>
    </section>
  );
}
