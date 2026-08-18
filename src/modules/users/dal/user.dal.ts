import { ApiError } from "@/lib/api/errors";
import { serverFetch } from "@/lib/api/fetcher";
import { assertObjectId } from "@/lib/api/object-id";
import {
  clampPageSize,
  DEFAULT_PAGE_SIZE,
  type Paginated,
} from "@/lib/api/pagination";
import type {
  CreateUserDto,
  UpdateUserDto,
  UpdateUserRolesDto,
} from "@/modules/users/dto";
import type {
  UpdateUserRolesResult,
  User,
  UserDetail,
} from "@/modules/users/models/user";

const NOT_FOUND = "User not found";

/** Raw shapes as FastAPI sends them — `password` included, never returned as-is. */
type RawUser = User & { password: string };
type RawUserDetail = RawUser & { roles: UserDetail["roles"] };

/**
 * `/users` and `/users/{id}` answer with the stored user document, bcrypt
 * hash included — the same posture `/auth/me` takes. This is the boundary
 * that stops it, same as `getCurrentUser`; the rest of the document passes
 * through untouched.
 */
function dropPassword<T extends { password: string }>(
  raw: T,
): Omit<T, "password"> {
  const { password: _password, ...user } = raw;
  return user;
}

export interface ListUsersQuery {
  page?: number;
  pageSize?: number;
}

export async function listUsers(
  query: ListUsersQuery = {},
): Promise<Paginated<User>> {
  const result = await serverFetch<Paginated<RawUser>>("/users", {
    query: {
      page: query.page ?? 1,
      page_size: clampPageSize(query.pageSize, DEFAULT_PAGE_SIZE),
    },
  });

  return { ...result, data: result.data.map(dropPassword) };
}

/**
 * `GET /users/{id}` answers with an array containing a single user rather
 * than the object itself — a backend quirk, not a list — so this unwraps it.
 */
export async function getUser(id: string): Promise<UserDetail> {
  assertObjectId(id, NOT_FOUND);

  const result = await serverFetch<RawUserDetail[]>(`/users/${id}`);
  const user = result[0];

  if (!user) throw new ApiError(404, "not_found", NOT_FOUND);

  return dropPassword(user);
}

/**
 * Creates a user through `POST /auth/register` — FastAPI has no create route
 * under `/users`, and register is not gated by `get_current_active_user`, so
 * the `requireUser()` call on our own `POST /api/users` is the only thing
 * making this an administrative action.
 *
 * It answers with the stored document straight out of the insert, bcrypt hash
 * included, so the same boundary `listUsers` draws applies here. A duplicate
 * email comes back as a 422 `{message}` and reaches the browser verbatim,
 * which is the one upstream message class `toPublicMessage` passes through.
 */
export async function createUser(input: CreateUserDto): Promise<User> {
  const created = await serverFetch<RawUser>("/auth/register", {
    method: "POST",
    body: input,
  });

  return dropPassword(created);
}

/**
 * `PUT /users/{id}` answers with the updated document and no `password` — the
 * read it re-fetches through projects the hash out on its own, unlike the
 * other two user reads.
 *
 * Its controller catches every exception and re-raises it as a 500, so an
 * unknown id arrives as `500 "Error: 404: User not found"` rather than a 404.
 * The local id check is what keeps a malformed id honest.
 */
export function updateUser(id: string, input: UpdateUserDto): Promise<User> {
  assertObjectId(id, NOT_FOUND);

  return serverFetch<User>(`/users/${id}`, { method: "PUT", body: input });
}

export function updateUserRoles(
  id: string,
  input: UpdateUserRolesDto,
): Promise<UpdateUserRolesResult> {
  assertObjectId(id, NOT_FOUND);

  return serverFetch<UpdateUserRolesResult>(`/users/${id}/roles`, {
    method: "PATCH",
    body: input,
  });
}
