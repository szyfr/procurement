"use client";

import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { MIN_PASSWORD_LENGTH, useChangePassword } from "@/modules/auth";

/**
 * The one profile write the backend has: `PATCH /auth/me/change-password`,
 * which takes the account from the session and so can only ever change the
 * caller's own password. The rest of this panel stays read-only.
 *
 * The session is not disturbed by a successful change — the JWT is not
 * invalidated upstream — so there is nothing to re-authenticate and the form
 * just clears itself.
 */

const EMPTY = { oldPassword: "", password: "", confirmPassword: "" };

export function ChangePasswordCard() {
  const [draft, setDraft] = React.useState(EMPTY);

  const {
    mutate: submit,
    isPending: submitting,
    error,
    reset,
  } = useChangePassword();

  function setField(field: keyof typeof draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    // The previous failure described the previous attempt; keep it on screen
    // only until the user starts changing what they typed.
    if (error) reset();
  }

  // Only complain once there is something to complain about — a field the user
  // has not reached yet is not an error.
  const tooShort =
    draft.password.length > 0 && draft.password.length < MIN_PASSWORD_LENGTH;
  const differs =
    draft.confirmPassword.length > 0 &&
    draft.confirmPassword !== draft.password;
  const unchanged =
    draft.password.length > 0 && draft.password === draft.oldPassword;

  const canSubmit =
    draft.oldPassword.length > 0 &&
    draft.password.length >= MIN_PASSWORD_LENGTH &&
    draft.confirmPassword === draft.password &&
    !unchanged;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || submitting) return;

    submit(
      {
        // Not trimmed: leading and trailing spaces are part of a password.
        old_password: draft.oldPassword,
        password: draft.password,
        confirm_password: draft.confirmPassword,
      },
      {
        onSuccess: () => {
          toast.add({ title: "Password updated", type: "success" });
          setDraft(EMPTY);
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Changing your password won&apos;t sign you out, here or anywhere else
          you&apos;re signed in.
        </CardDescription>
      </CardHeader>

      {/* The form wraps two card slots, so it has to carry the spacing the
          card would otherwise apply to them directly. */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-(--card-spacing)"
      >
        <CardContent>
          <FieldGroup>
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Couldn&apos;t change your password</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            ) : null}

            <Field>
              <FieldLabel htmlFor="current-password">
                Current password
              </FieldLabel>
              <Input
                id="current-password"
                name="old_password"
                type="password"
                autoComplete="current-password"
                value={draft.oldPassword}
                onChange={(event) =>
                  setField("oldPassword", event.target.value)
                }
                disabled={submitting}
                required
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={tooShort || unchanged ? true : undefined}>
                <FieldLabel htmlFor="new-password">New password</FieldLabel>
                <Input
                  id="new-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={draft.password}
                  onChange={(event) => setField("password", event.target.value)}
                  disabled={submitting}
                  aria-invalid={tooShort || unchanged ? true : undefined}
                  required
                />
                {tooShort ? (
                  <FieldError>
                    Use at least {MIN_PASSWORD_LENGTH} characters.
                  </FieldError>
                ) : unchanged ? (
                  <FieldError>
                    This is your current password. Choose a different one.
                  </FieldError>
                ) : (
                  <FieldDescription>
                    At least {MIN_PASSWORD_LENGTH} characters.
                  </FieldDescription>
                )}
              </Field>

              <Field data-invalid={differs ? true : undefined}>
                <FieldLabel htmlFor="confirm-new-password">
                  Confirm new password
                </FieldLabel>
                <Input
                  id="confirm-new-password"
                  name="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  value={draft.confirmPassword}
                  onChange={(event) =>
                    setField("confirmPassword", event.target.value)
                  }
                  disabled={submitting}
                  aria-invalid={differs ? true : undefined}
                  required
                />
                {differs ? (
                  <FieldError>Passwords do not match.</FieldError>
                ) : null}
              </Field>
            </div>
          </FieldGroup>
        </CardContent>

        <CardFooter className="justify-end">
          <Button type="submit" disabled={!canSubmit || submitting}>
            {submitting ? <Spinner data-icon="inline-start" /> : null}
            {submitting ? "Updating…" : "Update password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
