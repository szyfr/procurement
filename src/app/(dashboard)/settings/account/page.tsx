import type { Metadata } from "next";

import { ChangePasswordCard } from "@/components/settings/change-password-card";
import { PageHeader } from "@/components/shared/page-header";
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
 * The whole of Settings, which is why it carries its own `PageHeader` rather
 * than sitting under a shared one. There was a `/settings` layout with a tab
 * list in it; with a single destination to point at, the tabs and the second
 * heading were chrome around nothing.
 *
 * The profile fields are read-only, deliberately. The only write a user can
 * make to their own account upstream is `PATCH /auth/me/change-password`, which
 * the card below is wired to. There is no self-service endpoint for name, email
 * or photo — editing a user is an administrative action (`PUT /users/{id}`, on
 * the Users page), so those fields display rather than invite an edit that
 * would go nowhere.
 */
export default async function AccountSettingsPage() {
  // The dashboard layout has already turned away anyone unauthenticated, so
  // this can read the session outright.
  const user = await getCurrentUser();
  const name = userName(user);

  return (
    <>
      <PageHeader
        title="My Account"
        description="Your own profile — it's personal, not administrative"
      />

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            How you appear to everyone else in the module.
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

            {/* Name and email are the whole of it. Role and department were
                here as permanently blank inputs — `/auth/me` carries a
                permission list and no organizational placement, so there was
                never a value to put in them. */}
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
          </FieldGroup>

          <p className="text-[13px] text-muted-foreground">
            Profile details are managed by your administrator. Your password is
            yours to change below.
          </p>
        </CardContent>
      </Card>

      <ChangePasswordCard />
    </>
  );
}
