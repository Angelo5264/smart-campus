import { client } from "./client";
import * as validate from "./validate";
export const getSummary = async () =>
  validate.summary((await client.get("/analytics/summary")).data);
export const getModels = async () =>
  validate.models((await client.get("/models/metrics")).data);
export const getHealth = async () =>
  validate.health((await client.get("/health")).data);
