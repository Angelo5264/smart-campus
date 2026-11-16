export type Target = "Dropout" | "Graduate" | "Enrolled";
export type Risk = "LOW" | "MEDIUM" | "HIGH";
export interface StudentList {
  items: { id: number; source: string }[];
  page: number;
  per_page: number;
  total: number;
}
export interface Student {
  id: number;
  source: string;
  identity: string;
  observed_target: Target;
  features: Record<string, number>;
}
export interface Summary {
  students: number;
  observed_targets: Partial<Record<Target, number>>;
  predictions: number;
  cluster_assignments: number;
  prediction_mode: string;
}
export interface Health {
  status: string;
  database: string;
  prediction_mode: string;
}
export interface Result {
  id: number;
  student_id: number | null;
  model: string;
  model_version: string;
  created_at: string;
  prediction_mode: string;
  prediction_type: string;
  scope: string;
}
export interface Prediction extends Result {
  dropout_probability: number;
  risk_level: Risk;
  probability_scope: string;
  thresholds: { low: number; high: number; status: string };
}
export interface Assignment extends Result {
  cluster: number;
  interpretation: string;
}
export interface Profile {
  cluster: number;
  count: number;
  numeric_means: Record<string, number>;
  course_counts: Record<string, number>;
}
export interface Clusters {
  model_version: string;
  prediction_mode: string;
  profiles: Profile[];
  interpretation: string;
}
export interface ForestMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
  confusion_matrix?: number[][];
  confusion_matrix_labels?: string[];
  train_rows: number;
  test_rows: number;
  excluded_enrolled: number;
  evaluation: string;
}
export interface KMeansMetrics {
  selected_k: number;
  silhouette_by_k: Record<string, number>;
  profiles: Profile[];
  rows: number;
  interpretation: string;
}
export interface Model<T> {
  model: string;
  model_version: string;
  created_at: string;
  prediction_mode: string;
  dataset: string;
  features: string[];
  metrics: T;
  seed: number;
  sklearn_version: string;
}
export interface Models {
  random_forest: Model<ForestMetrics>;
  kmeans: Model<KMeansMetrics>;
}
