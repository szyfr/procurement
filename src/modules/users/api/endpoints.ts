const BASE = "/api/users";

/** Every BFF path the users feature may call. */
export const userEndpoints = {
  list: BASE,
  /** `POST`. The BFF reaches `/auth/register` upstream — see `CreateUserDto`. */
  create: BASE,
  detail: (id: string) => `${BASE}/${encodeURIComponent(id)}`,
  roles: (id: string) => `${BASE}/${encodeURIComponent(id)}/roles`,
} as const;
