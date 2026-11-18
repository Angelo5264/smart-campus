import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getHealth, getModels, getSummary } from "../api/analytics";
import { assignCluster, getClusters } from "../api/clusters";
import { createPrediction, getPrediction } from "../api/predictions";
import { getStudent } from "../api/students";
export const useStudent = (id: number) =>
  useQuery({
    queryKey: ["student", id],
    queryFn: () => getStudent(id),
    enabled: id > 0,
  });
export const useSummary = () =>
  useQuery({ queryKey: ["summary"], queryFn: getSummary });
export const useModels = () =>
  useQuery({ queryKey: ["models"], queryFn: getModels });
export const useClusters = () =>
  useQuery({ queryKey: ["clusters"], queryFn: getClusters });
export const useHealth = () =>
  useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    refetchInterval: 30000,
  });
export const usePrediction = (id: number) =>
  useQuery({
    queryKey: ["prediction", id],
    queryFn: () => getPrediction(id),
    enabled: id > 0,
    retry: false,
  });
export function useInference() {
  const cache = useQueryClient();
  const prediction = useMutation({
    mutationFn: createPrediction,
    onMutate: async (id) => {
      await cache.cancelQueries({ queryKey: ["prediction", id] });
    },
    onSuccess: (data) => {
      cache.setQueryData(["prediction", data.student_id], data);
      void cache.invalidateQueries({
        queryKey: ["prediction", data.student_id],
      });
      void cache.invalidateQueries({ queryKey: ["summary"] });
    },
  });
  const cluster = useMutation({
    mutationFn: assignCluster,
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: ["summary"] });
    },
  });
  return { prediction, cluster };
}
