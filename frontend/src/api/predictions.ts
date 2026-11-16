import { client } from "./client";
import * as validate from "./validate";
export const getPrediction = async (id: number) =>
  validate.prediction((await client.get(`/predictions/${id}`)).data);
export const createPrediction = async (id: number) =>
  validate.prediction(
    (await client.post("/predictions", { student_id: id })).data,
  );
