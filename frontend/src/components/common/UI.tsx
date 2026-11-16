import type { ReactNode } from "react";
import { AlertCircle, FlaskConical, LoaderCircle } from "lucide-react";
import { errorMessage } from "../../api/client";
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`card ${className}`}>{children}</section>;
}
export function Loading({
  label = "Cargando información…",
}: {
  label?: string;
}) {
  return (
    <div className="state" role="status">
      <LoaderCircle size={21} className="animate-spin" />
      {label}
    </div>
  );
}
export function ErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={20} />
      <div>
        <strong>No se pudo completar la consulta</strong>
        <p>{errorMessage(error)}</p>
        {retry && (
          <button className="btn secondary mt-3" onClick={retry}>
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className="state empty">{children}</div>;
}
export function Experimental() {
  return (
    <span className="badge experimental">
      <FlaskConical size={12} />
      EXPERIMENTAL
    </span>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Warning() {
  return (
    <div className="notice">
      <FlaskConical size={19} />
      <p>
        Esta predicción es experimental y no está validada para instituciones de
        educación superior de Piura. Requiere evaluación humana.
      </p>
    </div>
  );
}
