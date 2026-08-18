/**
 * Request contracts for the department writes, mirroring FastAPI exactly.
 *
 * There is no response DTO: `GET`/`POST`/`PUT` all answer with the department
 * document itself, and that shape is the model — see `models/department`.
 */

export interface CreateDepartmentDto {
  title: string;
  description: string;
}

/** `PUT /departments/{id}` accepts a full replacement, same shape as create. */
export type UpdateDepartmentDto = CreateDepartmentDto;
