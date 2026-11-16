import { Navigate, Route, Routes, Link } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { StudentsPage } from "./pages/StudentsPage";
import { StudentDetailPage } from "./pages/StudentDetailPage";
import { PredictionsPage } from "./pages/PredictionsPage";
import { ClustersPage } from "./pages/ClustersPage";
import { ModelsPage } from "./pages/ModelsPage";
export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/:id" element={<StudentDetailPage />} />
        <Route path="predictions" element={<PredictionsPage />} />
        <Route path="clusters" element={<ClustersPage />} />
        <Route path="models" element={<ModelsPage />} />
        <Route
          path="*"
          element={
            <div className="card">
              <h1>Página no encontrada</h1>
              <Link className="text-link" to="/dashboard">
                Volver al inicio
              </Link>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}
