import type { SignedInUser } from "@/modules/auth/models/session";

/**
 * The FastAPI `/auth` contracts that do not reach the browser.
 *
 * `LoginResponseDto` is the one response shape still declared as a DTO: its
 * payload carries the raw JWT, so the sign-in DAL hands on the user and drops
 * the rest. The same token is already in the cookie FastAPI sets, where the
 * browser cannot read it. Everything else the BFF serves is handed back as it
 * arrived.
 */

export interface LoginRequestDto {
  email: string;
  password: string;
}

/**
 * `PATCH /auth/me/change-password`. The account is taken from the session, so
 * the body carries no user id — this endpoint can only change the caller's own
 * password.
 *
 * `confirm_password` is redundant with `password` by the time it reaches the
 * BFF, but upstream declares it required and rejects a mismatch, so it is sent.
 */
export interface ChangePasswordDto {
  old_password: string;
  password: string;
  confirm_password: string;
}

export interface LoginResponseDto {
  status: number;
  user: SignedInUser;
  token: {
    access_token: string;
    token_type: string;
    /** Seconds. Sizes FastAPI's own cookie; nothing here reads it. */
    expires_in: number;
  };
}

/**
 * `GET /auth/me`, as it actually arrives.
 *
 * Its response model extends the stored user document, so the payload carries
 * `password` — the bcrypt hash. It is declared here precisely so the DAL can
 * name the field it drops; nothing downstream should ever see this type.
 */
export interface CurrentUserDto {
  _id?: string;
  id?: string;
  email: string;
  firstname: string;
  lastname: string;
  permissions?: string[];
  password?: string;
}
