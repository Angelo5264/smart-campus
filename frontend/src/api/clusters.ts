import { client } from "./client";
import * as validate from "./validate";
export const getClusters = async () =>
  validate.clusters((await client.get("/clusters")).data);
export const assignCluster = async (id: number) =>
  validate.assignment(
    (await client.post("/clusters/predict", { student_id: id })).data,
  );
