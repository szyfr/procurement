"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  createUser,
  MIN_PASSWORD_LENGTH,
  type User,
  updateUser,
  userKeys,
} from "@/modules/users";

/**
 * Create and edit share one dialog: the only differences are the copy and
 * whether the fields start populated.
 *
 * Create persists through `POST /api/users`, which the BFF fulfils upstream
 * with `/auth/register` — the one create path FastAPI offers. Edit goes to
 * `PUT /users/{id}`, which takes no password: the only password write the
 * backend has changes the *caller's* own, so an admin cannot reset someone
 * else's here and the fields are left out of edit mode entirely.
 */

interface DraftUser {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function draftFrom(user: User | null): DraftUser {
  return {
    firstname: user?.firstname ?? "",
    lastname: user?.lastname ?? "",
    email: user?.email ?? "",
    password: "",
    confirmPassword: "",
  };
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The user being edited; null when creating from scratch. */
  user: User | null;
  mode: "create" | "edit";
}) {
  const [draft, setDraft] = React.useState<DraftUser>(() => draftFrom(user));
  const queryClient = useQueryClient();

  const isEdit = mode === "edit";

  const {
    mutate: submitUser,
    isPending: submitting,
    error,
    reset,
  } = useMutation({
    mutationFn: (values: DraftUser): Promise<User> =>
      isEdit && user
        ? updateUser(user._id, {
            firstname: values.firstname.trim(),
            lastname: values.lastname.trim(),
            email: values.email.trim(),
          })
        : createUser({
            firstname: values.firstname.trim(),
            lastname: values.lastname.trim(),
            email: values.email.trim(),
            // Not trimmed: leading and trailing spaces are part of a password.
            password: values.password,
            confirm_password: values.confirmPassword,
          }),
    // Both endpoints answer with the saved document, so the toast names the
    // user as it was actually stored rather than as it was typed.
    onSuccess: (saved) => {
      toast.add({
        title: `${saved.firstname} ${saved.lastname} ${
          isEdit ? "updated" : "created"
        }`,
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      onOpenChange(false);
    },
  });

  // Reopening for a different user — or switching between create and edit —
  // has to reset the whole form, passwords included.
  const [lastOpenedFor, setLastOpenedFor] = React.useState<string | null>(null);
  const openedFor = open ? `${mode}:${user?._id ?? "new"}` : null;
  if (openedFor !== lastOpenedFor) {
    setLastOpenedFor(openedFor);
    setDraft(draftFrom(user));
  }

  // `reset` writes to the mutation's own store, so it can't ride along in the
  // render-time reset above the way the draft state does.
  React.useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  function setField(field: keyof DraftUser, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  const identityFilled =
    draft.firstname.trim().length > 0 &&
    draft.lastname.trim().length > 0 &&
    draft.email.trim().length > 0;

  // Only complain once there is something to complain about — an empty field
  // the user has not reached yet is not an error.
  const passwordTooShort =
    draft.password.length > 0 && draft.password.length < MIN_PASSWORD_LENGTH;
  const passwordsDiffer =
    draft.confirmPassword.length > 0 &&
    draft.confirmPassword !== draft.password;

  const passwordReady =
    draft.password.length >= MIN_PASSWORD_LENGTH &&
    draft.confirmPassword === draft.password;

  const canSubmit = identityFilled && (isEdit || passwordReady);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || submitting) return;

    submitUser(draft);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit user" : "New user"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this person's name and email. Roles are assigned separately."
              : "Create an account for someone who needs access to this module. You can assign roles afterwards."}
          </DialogDescription>
        </DialogHeader>

        {/* `grid gap-4` mirrors DialogContent's own spacing, which the form
            would otherwise collapse into a single child. */}
        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <FieldGroup>
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>
                  Couldn&apos;t {isEdit ? "update" : "create"} this user
                </AlertTitle>
                <AlertDescription>
                  {error instanceof Error
                    ? error.message
                    : "Something went wrong."}
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="user-firstname">First name</FieldLabel>
                <Input
                  id="user-firstname"
                  name="firstname"
                  autoComplete="given-name"
                  placeholder="e.g. John"
                  value={draft.firstname}
                  onChange={(event) =>
                    setField("firstname", event.target.value)
                  }
                  disabled={submitting}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="user-lastname">Last name</FieldLabel>
                <Input
                  id="user-lastname"
                  name="lastname"
                  autoComplete="family-name"
                  placeholder="e.g. Doe"
                  value={draft.lastname}
                  onChange={(event) => setField("lastname", event.target.value)}
                  disabled={submitting}
                  required
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="user-email">Email</FieldLabel>
              <Input
                id="user-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@mkthemedattractions.com.ph"
                value={draft.email}
                onChange={(event) => setField("email", event.target.value)}
                disabled={submitting}
                required
              />
              <FieldDescription>
                This is the address they sign in with.
              </FieldDescription>
            </Field>

            {/* Edit carries no password fields: `PUT /users/{id}` accepts none,
                and the only password write upstream targets the caller. */}
            {isEdit ? null : (
              <>
                <Field data-invalid={passwordTooShort ? true : undefined}>
                  <FieldLabel htmlFor="user-password">Password</FieldLabel>
                  <Input
                    id="user-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={draft.password}
                    onChange={(event) =>
                      setField("password", event.target.value)
                    }
                    disabled={submitting}
                    aria-invalid={passwordTooShort ? true : undefined}
                    required
                  />
                  {passwordTooShort ? (
                    <FieldError>
                      Use at least {MIN_PASSWORD_LENGTH} characters.
                    </FieldError>
                  ) : (
                    <FieldDescription>
                      At least {MIN_PASSWORD_LENGTH} characters. Share it with
                      them directly — they can change it after signing in.
                    </FieldDescription>
                  )}
                </Field>

                <Field data-invalid={passwordsDiffer ? true : undefined}>
                  <FieldLabel htmlFor="user-confirm-password">
                    Confirm password
                  </FieldLabel>
                  <Input
                    id="user-confirm-password"
                    name="confirm_password"
                    type="password"
                    autoComplete="new-password"
                    value={draft.confirmPassword}
                    onChange={(event) =>
                      setField("confirmPassword", event.target.value)
                    }
                    disabled={submitting}
                    aria-invalid={passwordsDiffer ? true : undefined}
                    required
                  />
                  {passwordsDiffer ? (
                    <FieldError>Passwords do not match.</FieldError>
                  ) : null}
                </Field>
              </>
            )}
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || submitting}>
              {submitting ? <Spinner data-icon="inline-start" /> : null}
              {submitting
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save changes"
                  : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
