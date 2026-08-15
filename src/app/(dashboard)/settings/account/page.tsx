import type { Metadata } from "next";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { initials } from "@/lib/utils";
import { getCurrentUser } from "@/modules/auth/dal/auth.dal";
import { userName } from "@/modules/auth/models/session";

export const metadata: Metadata = {
  title: "My Account",
};

/**
 * Read-only, deliberately.
 *
 * FastAPI exposes no profile write at all — the only user mutation in the
 * backend is role assignment (`PATCH /users/{id}/roles`), and there is no
 * password-change endpoint. This panel previously offered a photo picker, an
 * editable name and email, a full change-password fieldset and a Save button,
 * none of which were wired to anything: a user could set a new password, click
 * Save, and get no feedback while nothing happened. Same call as the inert
 * Comments card on the purchase request detail page — show what the backend
 * can actually answer for, and leave the rest out until it exists.
 */
export default async function AccountSettingsPage() {
  // The dashboard layout has already turned away anyone unauthenticated, so
  // this can read the session outright.
  const user = await getCurrentUser();
  const name = userName(user);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>My Account</CardTitle>
        <CardDescription>
          Your own profile. Every role sees this panel — it&apos;s personal, not
          administrative.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex items-center gap-4">
        <Avatar className="size-14">
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-[13px] text-muted-foreground">{user.email}</p>
        </div>
      </CardContent>

      <Separator />

      <CardContent className="flex flex-col gap-4">
        <FieldGroup className="sm:grid sm:grid-cols-2 sm:gap-4">
          <Field>
            <FieldLabel htmlFor="full-name">Full Name</FieldLabel>
            <Input
              id="full-name"
              name="fullName"
              defaultValue={name}
              readOnly
            />
          </Field>

          {/* Role and department have no source on `/auth/me` — it carries a
              permission list and no organizational placement — so both stay
              blank rather than showing a value the backend never sent. */}
          <Field>
            <FieldLabel htmlFor="role">Role</FieldLabel>
            <Input id="role" name="role" placeholder="—" readOnly />
          </Field>

          <Field>
            <FieldLabel htmlFor="company-email">Company Email</FieldLabel>
            <Input
              id="company-email"
              name="email"
              type="email"
              defaultValue={user.email}
              readOnly
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="department">Department</FieldLabel>
            <Input id="department" name="department" placeholder="—" readOnly />
          </Field>
        </FieldGroup>

        <p className="text-[13px] text-muted-foreground">
          Profile details and passwords are managed by your administrator.
        </p>
      </CardContent>
    </Card>
  );
}
