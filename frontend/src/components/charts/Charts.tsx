import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { count, percent } from "../../utils/format";
import type { ForestMetrics, Profile } from "../../types";
const colors = [
  "#3073d9",
  "#19a995",
  "#90b3ed",
  "#a79be0",
  "#e2ab53",
  "#678195",
];
export function DistributionChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  return (
    <>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              isAnimationActive={false}
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="87%"
              paddingAngle={3}
              stroke="none"
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => count(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="chart-legend">
        {data.map((d, i) => (
          <li key={d.name}>
            <span
              className="legend-dot"
              style={{ background: colors[i % colors.length] }}
            />
            {d.name}
            <strong>{count(d.value)}</strong>
          </li>
        ))}
      </ul>
    </>
  );
}
export function ClusterChart({ profiles }: { profiles: Profile[] }) {
  return (
    <>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={profiles.map((p) => ({
              name: `Cluster ${p.cluster}`,
              value: p.count,
            }))}
            margin={{ left: 0, right: 14, top: 16, bottom: 4 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e6ebf2"
            />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} width={48} />
            <Tooltip
              cursor={{ fill: "#f1f5fb" }}
              formatter={(v) => count(Number(v))}
            />
            <Bar
              isAnimationActive={false}
              dataKey="value"
              name="Registros de entrenamiento"
              fill="#397cdb"
              radius={[5, 5, 0, 0]}
              maxBarSize={70}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="chart-legend">
        {profiles.map((p) => (
          <li key={p.cluster}>
            Cluster {p.cluster}
            <strong>{count(p.count)} registros</strong>
          </li>
        ))}
      </ul>
    </>
  );
}
export function MetricBars({ metrics }: { metrics: ForestMetrics }) {
  return (
    <div className="metric-bars">
      {(["accuracy", "precision", "recall", "f1", "roc_auc"] as const).map(
        (key) => (
          <div key={key}>
            <div>
              <span>
                {
                  {
                    accuracy: "Accuracy",
                    precision: "Precision",
                    recall: "Recall",
                    f1: "F1-score",
                    roc_auc: "ROC-AUC",
                  }[key]
                }
              </span>
              <strong>{percent(metrics[key])}</strong>
            </div>
            <div className="track">
              <div style={{ width: `${metrics[key] * 100}%` }} />
            </div>
          </div>
        ),
      )}
    </div>
  );
}
