export { DEFAULT_PAGE_SIZE } from "@/lib/api/pagination";

/**
 * Login's floor, not register's.
 *
 * `LoginRequest` upstream declares `password: str = Field(..., min_length=6)`
 * while `CreateAccountRequest` puts no constraint on it at all — so without
 * this an admin could create an account that nobody, including its owner, is
 * ever able to sign in to.
 */
export const MIN_PASSWORD_LENGTH = 6;
