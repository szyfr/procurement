"use client";

import * as React from "react";

import { createDraftLine } from "@/components/purchase-requests/line-items-editor";
import { toDateInputValue } from "@/lib/date";
import type { SelectedOption } from "@/lib/lookup";
import type { Priority } from "@/lib/types";
import type {
  CreatePurchaseRequestInput,
  DraftLineItem,
  PurchaseRequestDetail,
} from "@/modules/purchase-requests";

/**
 * State and validation for the purchase request create and edit forms, which
 * collect exactly the same fields. The forms own only what differs: what
 * `submit` does with the result, and the copy around it.
 *
 * `validate` hands back the FastAPI request body itself, so there is no second
 * shape between the form and the wire.
 */

export const priorities = [
  { label: "High", value: "high" },
  { label: "Normal", value: "normal" },
  { label: "Low", value: "low" },
] as const;

export interface PurchaseRequestFieldErrors {
  department?: string;
  dateNeeded?: string;
  justification?: string;
  items?: string;
}

export interface PurchaseRequestFormState {
  title: string;
  setTitle: (title: string) => void;
  department: SelectedOption | null;
  setDepartment: (department: SelectedOption | null) => void;
  dateNeeded: string;
  setDateNeeded: (dateNeeded: string) => void;
  priority: Priority;
  setPriority: (priority: Priority) => void;
  justification: string;
  setJustification: (justification: string) => void;
  lines: DraftLineItem[];
  setLines: (lines: DraftLineItem[]) => void;
  fieldErrors: PurchaseRequestFieldErrors;
  clearFieldError: (field: keyof PurchaseRequestFieldErrors) => void;
  /** Seeds every field from an existing request, for the edit form. */
  seedFrom: (request: PurchaseRequestDetail) => void;
  /**
   * Returns the request body when everything required is present, or null
   * after publishing the field errors that stopped it.
   */
  validate: () => CreatePurchaseRequestInput | null;
}

export function usePurchaseRequestForm(): PurchaseRequestFormState {
  const [title, setTitle] = React.useState("");
  const [department, setDepartment] = React.useState<SelectedOption | null>(
    null,
  );
  const [dateNeeded, setDateNeeded] = React.useState("");
  const [priority, setPriority] = React.useState<Priority>("normal");
  const [justification, setJustification] = React.useState("");
  const [lines, setLines] = React.useState<DraftLineItem[]>([
    createDraftLine("line-1"),
  ]);
  const [fieldErrors, setFieldErrors] =
    React.useState<PurchaseRequestFieldErrors>({});

  const clearFieldError = React.useCallback(
    (field: keyof PurchaseRequestFieldErrors) => {
      setFieldErrors((current) => {
        if (!current[field]) return current;
        const next = { ...current };
        delete next[field];
        return next;
      });
    },
    [],
  );

  const seedFrom = React.useCallback((request: PurchaseRequestDetail) => {
    setTitle(request.title ?? "");
    setDepartment({
      id: request.department_id,
      // The detail join supplies the name; the id only shows if it missed.
      label: request.department?.title || request.department_id,
    });
    setDateNeeded(toDateInputValue(request.date_needed));
    setPriority(request.priority);
    setJustification(request.justification ?? "");
    setLines(
      request.items.length > 0
        ? request.items.map((item) => ({
            key: item._id,
            materialId: item.material_id,
            // The detail pipeline joins the material; the raw id stands in if
            // the lookup missed.
            materialName: item.material?.description || item.material_id,
            unit: item.material?.uom ?? null,
            quantity: item.quantity,
            // `last_cost` is declared by the backend schema but absent from
            // every synced material, so this is null in practice.
            unitCost: item.material?.last_cost ?? null,
            sourcing: item.is_needs_canvass ? "canvassing" : "direct",
            vendorId: item.vendor_id,
            // The backend joins no vendor, so the id is the only label there is.
            vendorName: item.vendor_id,
          }))
        : [createDraftLine("line-1")],
    );
  }, []);

  function validate() {
    const items = lines
      .filter((line) => line.materialId !== null)
      .map((line) => ({
        material_id: line.materialId as string,
        quantity: line.quantity,
        vendor_id: line.vendorId,
      }));

    const nextFieldErrors: PurchaseRequestFieldErrors = {};
    if (!department)
      nextFieldErrors.department = "Pick a department before submitting.";
    if (!dateNeeded) nextFieldErrors.dateNeeded = "Date needed is required.";
    if (!justification.trim())
      nextFieldErrors.justification = "Justification is required.";
    if (items.length === 0)
      nextFieldErrors.items =
        "Add at least one item with a catalog entry selected.";

    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return null;

    return {
      // Optional, but sent as "" rather than omitted: the request is stored
      // with a nullable title, while `PRRequest.title` upstream is still a
      // required `str` and 422s on a missing or null one.
      title: title.trim(),
      department_id: (department as SelectedOption).id,
      date_needed: dateNeeded,
      priority,
      justification: justification.trim(),
      items,
    };
  }

  return {
    title,
    setTitle,
    department,
    setDepartment,
    dateNeeded,
    setDateNeeded,
    priority,
    setPriority,
    justification,
    setJustification,
    lines,
    setLines,
    fieldErrors,
    clearFieldError,
    seedFrom,
    validate,
  };
}
