import { client } from "./client";
import * as validate from "./validate";
export const getStudents = async (page: number, perPage = 20) =>
  validate.students(
    (await client.get("/students", { params: { page, per_page: perPage } }))
      .data,
  );
export const getStudent = async (id: number) =>
  validate.student((await client.get(`/students/${id}`)).data);
