"use client";

import { PlusIcon, XIcon } from "lucide-react";
import * as React from "react";

import { LookupPicker } from "@/components/shared/lookup-picker";
import { StatusDot } from "@/components/shared/status-badge";
import {
  dataTableClass,
  numericCellClass,
} from "@/components/shared/table-classes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency } from "@/lib/utils";
import {
  type DraftLineItem,
  fetchMaterialOptions,
  purchaseRequestKeys,
} from "@/modules/purchase-requests";

/**
 * Editable line items backed by the live material catalog.
 *
 * Sourcing is derived from the material's `is_needs_canvass` flag rather than
 * chosen here, matching the wireframe's "determined automatically" note.
 *
 * Unit cost and vendor are deliberately not shown or editable here. Cost
 * estimates are never persisted (FastAPI's item payload carries only
 * `material_id`, `quantity` and `vendor_id`), so `unitCost` only drives the
 * footer total. Dropping the vendor picker means a direct-sourced item now
 * has no UI path to a `vendor_id` on create; `vendorId`/`vendorName` remain on
 * `DraftLineItem` only so editing a request that already has one preserves it
 * on save.
 */

export function createDraftLine(key: string): DraftLineItem {
  return {
    key,
    materialId: null,
    materialName: null,
    unit: null,
    quantity: 1,
    unitCost: null,
    sourcing: "canvassing",
    vendorId: null,
    vendorName: null,
  };
}

/** Null until a cost estimate is entered, so "Pending" can be shown instead of ₱0. */
function lineTotal(line: DraftLineItem) {
  if (line.unitCost === null) return null;
  return line.quantity * line.unitCost;
}

export function LineItemsEditor({
  lines,
  onChange,
  error,
}: {
  lines: DraftLineItem[];
  onChange: (lines: DraftLineItem[]) => void;
  /** Shown inline below the header, e.g. when no item has a catalog entry selected. */
  error?: string | null;
}) {
  const nextKey = React.useRef(lines.length + 1);

  const total = lines.reduce((sum, line) => sum + (lineTotal(line) ?? 0), 0);

  function updateLine(key: string, patch: Partial<DraftLineItem>) {
    onChange(
      lines.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  function addLine() {
    nextKey.current += 1;
    onChange([...lines, createDraftLine(`line-${nextKey.current}`)]);
  }

  function removeLine(key: string) {
    onChange(lines.filter((line) => line.key !== key));
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b">
        <CardTitle>Items</CardTitle>
        <span className="text-xs text-muted-foreground">
          {lines.length} {lines.length === 1 ? "item" : "items"}
        </span>
      </CardHeader>

      {error ? (
        <CardContent className="pb-0">
          <FieldError>{error}</FieldError>
        </CardContent>
      ) : null}

      <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <StatusDot tone="info" /> Needs Canvassing
        </span>
        <span className="flex items-center gap-1.5">
          <StatusDot tone="neutral" /> Direct
        </span>
        <span className="italic">
          — determined automatically, not editable here
        </span>
      </CardContent>

      <CardContent className="px-0">
        <Table className={dataTableClass}>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="w-8">
                #
              </TableHead>
              <TableHead scope="col" className="w-72">
                Item
              </TableHead>
              <TableHead scope="col" className={cn(numericCellClass, "w-24")}>
                Qty
              </TableHead>
              <TableHead scope="col" className="w-20">
                Unit
              </TableHead>
              <TableHead scope="col" className="w-44">
                Sourcing
              </TableHead>
              <TableHead scope="col" className="w-8">
                <span className="sr-only">Remove</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line, index) => (
              <TableRow key={line.key}>
                <TableCell className="text-muted-foreground">
                  {index + 1}
                </TableCell>

                <TableCell>
                  <LookupPicker
                    value={
                      line.materialId && line.materialName
                        ? { id: line.materialId, label: line.materialName }
                        : null
                    }
                    queryKey={purchaseRequestKeys.materialOptions()}
                    loadPage={fetchMaterialOptions}
                    toOption={(material) => ({
                      id: material._id,
                      label: material.description || material.no,
                      hint: material.no,
                    })}
                    placeholder="Select an item"
                    searchPlaceholder="Search the catalog…"
                    ariaLabel={`Item for line ${index + 1}`}
                    onSelect={(material) =>
                      updateLine(line.key, {
                        materialId: material._id,
                        materialName: material.description || material.no,
                        unit: material.uom || null,
                        // `last_cost` is declared by the backend schema but
                        // absent from every synced material.
                        unitCost: material.last_cost ?? null,
                        // Canvassed items get their vendor during canvassing,
                        // so any previously chosen vendor is dropped.
                        sourcing: material.is_needs_canvass
                          ? "canvassing"
                          : "direct",
                        vendorId: null,
                        vendorName: null,
                      })
                    }
                  />
                </TableCell>

                <TableCell className={numericCellClass}>
                  <Input
                    type="number"
                    min={1}
                    value={line.quantity}
                    aria-label={`Quantity for line ${index + 1}`}
                    className="h-8 w-16"
                    onChange={(event) =>
                      updateLine(line.key, {
                        quantity: Number(event.target.value) || 0,
                      })
                    }
                  />
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {line.unit ?? "—"}
                </TableCell>

                <TableCell>
                  {line.materialId === null ? (
                    <span className="text-xs text-muted-foreground">
                      Set once an item is picked
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "flex items-center gap-1.5 text-xs",
                        line.sourcing === "canvassing"
                          ? "text-status-info-fg"
                          : "text-muted-foreground",
                      )}
                    >
                      <StatusDot
                        tone={
                          line.sourcing === "canvassing" ? "info" : "neutral"
                        }
                      />
                      {line.sourcing === "canvassing"
                        ? "Needs Canvassing"
                        : "Direct"}
                    </span>
                  )}
                </TableCell>

                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Remove line ${index + 1}`}
                    onClick={() => removeLine(line.key)}
                  >
                    <XIcon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Separator />

      <CardContent>
        <Button variant="outline" size="sm" type="button" onClick={addLine}>
          <PlusIcon data-icon="inline-start" />
          Add Item
        </Button>
      </CardContent>

      <CardFooter className="gap-4">
        <div className="ml-auto shrink-0 text-right">
          <p className="text-xs text-muted-foreground">
            Total Estimated Amount
          </p>
          <p className="text-base font-bold tabular-nums">
            {formatCurrency(total, true)}
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
