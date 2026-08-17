"use client";

import { LineItemsEditor } from "@/components/purchase-requests/line-items-editor";
import {
  type PurchaseRequestFormState,
  priorities,
} from "@/components/purchase-requests/use-pr-form";
import { LookupPicker } from "@/components/shared/lookup-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Priority } from "@/lib/types";
import {
  fetchDepartmentOptions,
  purchaseRequestKeys,
} from "@/modules/purchase-requests";

/**
 * Everything the create and edit forms render below their page header: the
 * request fields, the line item editor, and the sidebar. Only the sidebar copy
 * differs between the two, so it is passed in.
 */

/** Departments are a short list, so they normally arrive in a single page. */
const loadDepartmentPage = fetchDepartmentOptions;

export function PurchaseRequestFormLayout({
  form,
  checklist,
  routingNote,
}: {
  form: PurchaseRequestFormState;
  /** "Before you submit" bullets. */
  checklist: string[];
  routingNote: string;
}) {
  const { fieldErrors } = form;

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-5 lg:col-span-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup className="sm:grid sm:grid-cols-2 sm:gap-4">
              <Field
                className="sm:col-span-2"
                data-invalid={fieldErrors.title ? true : undefined}
              >
                <FieldLabel htmlFor="title">Title</FieldLabel>
                <Input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={(event) => {
                    form.setTitle(event.target.value);
                    form.clearFieldError("title");
                  }}
                  placeholder='e.g. "Q3 Production Line Lubricants"'
                  aria-invalid={fieldErrors.title ? true : undefined}
                />
                <FieldDescription>
                  Required — the backend has no auto-titling yet.
                </FieldDescription>
                {fieldErrors.title ? (
                  <FieldError>{fieldErrors.title}</FieldError>
                ) : null}
              </Field>

              <Field data-invalid={fieldErrors.department ? true : undefined}>
                <FieldLabel>Department</FieldLabel>
                <LookupPicker
                  value={form.department}
                  queryKey={purchaseRequestKeys.departmentOptions()}
                  loadPage={loadDepartmentPage}
                  toOption={(department) => ({
                    id: department._id,
                    label: department.title,
                    hint: department.description || undefined,
                  })}
                  placeholder="Select department"
                  searchPlaceholder="Search departments…"
                  ariaLabel="Department"
                  aria-invalid={fieldErrors.department ? true : undefined}
                  onSelect={(department) => {
                    form.setDepartment({
                      id: department._id,
                      label: department.title,
                    });
                    form.clearFieldError("department");
                  }}
                />
                {fieldErrors.department ? (
                  <FieldError>{fieldErrors.department}</FieldError>
                ) : null}
              </Field>

              <Field data-invalid={fieldErrors.dateNeeded ? true : undefined}>
                <FieldLabel htmlFor="date-needed">Date Needed</FieldLabel>
                <Input
                  id="date-needed"
                  name="dateNeeded"
                  type="date"
                  value={form.dateNeeded}
                  onChange={(event) => {
                    form.setDateNeeded(event.target.value);
                    form.clearFieldError("dateNeeded");
                  }}
                  aria-invalid={fieldErrors.dateNeeded ? true : undefined}
                />
                {fieldErrors.dateNeeded ? (
                  <FieldError>{fieldErrors.dateNeeded}</FieldError>
                ) : null}
              </Field>

              <Field>
                <FieldLabel>Priority</FieldLabel>
                <Select
                  items={priorities}
                  value={form.priority}
                  onValueChange={(value) => form.setPriority(value as Priority)}
                >
                  <SelectTrigger
                    size="sm"
                    className="w-full"
                    aria-label="Priority"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {priorities.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field
                className="sm:col-span-2"
                data-invalid={fieldErrors.justification ? true : undefined}
              >
                <FieldLabel htmlFor="justification">Justification</FieldLabel>
                <Textarea
                  id="justification"
                  name="justification"
                  rows={4}
                  value={form.justification}
                  onChange={(event) => {
                    form.setJustification(event.target.value);
                    form.clearFieldError("justification");
                  }}
                  placeholder="Explain why this purchase is needed…"
                  aria-invalid={fieldErrors.justification ? true : undefined}
                />
                {fieldErrors.justification ? (
                  <FieldError>{fieldErrors.justification}</FieldError>
                ) : null}
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <LineItemsEditor
          lines={form.lines}
          onChange={(next) => {
            form.setLines(next);
            form.clearFieldError("items");
          }}
          error={fieldErrors.items}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Before you submit</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-xs text-muted-foreground">
              {checklist.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approval Routing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{routingNote}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
