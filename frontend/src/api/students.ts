import { client } from "./client";
import * as validate from "./validate";
import type { StudentFilters } from "../utils/studentFilters";
export const getStudents = async (
  page: number,
  perPage = 20,
  filters: StudentFilters = {},
) =>
  validate.students(
    (
      await client.get("/students", {
        params: { page, per_page: perPage, ...filters },
      })
    ).data,
  );
export const getStudent = async (id: number) =>
  validate.student((await client.get(`/students/${id}`)).data);
