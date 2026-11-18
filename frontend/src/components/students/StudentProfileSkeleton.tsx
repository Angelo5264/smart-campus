export function StudentProfileSkeleton() {
  return (
    <div
      className="profile-skeleton"
      role="status"
      aria-label="Cargando ficha académica"
    >
      <span className="sr-only">Cargando ficha académica…</span>
      <div className="skeleton-block skeleton-header" />
      <div className="profile-columns">
        <div>
          <div className="semester-summary-grid">
            <div className="skeleton-block" />
            <div className="skeleton-block" />
          </div>
          <div className="skeleton-block skeleton-chart" />
        </div>
        <div className="skeleton-block skeleton-chart" />
      </div>
    </div>
  );
}
