"use client";

import { ChevronRightIcon } from "lucide-react";

import { TriStateCheckbox } from "@/components/shared/tri-state-checkbox";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { PermissionModuleGroup } from "@/modules/permissions";

/**
 * The permission catalogue as one collapsible card per module.
 *
 * Grouping is the whole point: the flat list this replaced ran to the full
 * catalogue in one column, where `purchase_request.update` and
 * `payment_term.store` sat next to each other with nothing to say they belonged
 * to different parts of the app. Grouped, a module can be granted or cleared in
 * one action and the count chip says how much of it a role holds.
 *
 * Every module starts collapsed. Opening one is cheap, and a page of expanded
 * modules is exactly the wall of checkboxes the grouping exists to avoid.
 */

/** `3 / 5` beside the module name — green once the module has any grant. */
function ModuleCountChip({
  granted,
  total,
}: {
  granted: number;
  total: number;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[19px] shrink-0 items-center rounded-md border px-1.5 text-[11px] font-semibold leading-none tabular-nums",
        granted > 0
          ? "border-status-success-border bg-status-success-subtle text-status-success-fg"
          : "border-transparent bg-muted text-muted-foreground",
      )}
    >
      {granted} / {total}
    </span>
  );
}

function PermissionModuleCard({
  group,
  grantedIds,
  expanded,
  onExpandedChange,
  onTogglePermission,
  onSetModule,
}: {
  group: PermissionModuleGroup;
  grantedIds: Set<string>;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onTogglePermission: (id: string, granted: boolean) => void;
  /** Grants or clears every permission in this module at once. */
  onSetModule: (group: PermissionModuleGroup, granted: boolean) => void;
}) {
  const grantedCount = group.permissions.filter((permission) =>
    grantedIds.has(permission._id),
  ).length;
  const allGranted = grantedCount === group.permissions.length;
  const someGranted = grantedCount > 0 && !allGranted;

  return (
    <Collapsible
      open={expanded}
      onOpenChange={onExpandedChange}
      className="group/module overflow-hidden rounded-xl border"
    >
      <div
        className={cn(
          "flex items-center gap-2.5 px-3 py-2.5",
          grantedCount > 0 ? "bg-accent" : "bg-muted/40",
        )}
      >
        {/* Outside the trigger, not inside it — a checkbox nested in a button
            is neither operable nor announced correctly. */}
        <TriStateCheckbox
          checked={allGranted}
          indeterminate={someGranted}
          aria-label={`Grant every ${group.label} permission`}
          onCheckedChange={(checked) => onSetModule(group, checked === true)}
        />

        <CollapsibleTrigger className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-left">
          <ChevronRightIcon
            aria-hidden
            className="size-3 shrink-0 text-muted-foreground transition-transform duration-150 group-data-open/module:rotate-90"
          />
          <span className="truncate text-[13.5px] font-semibold">
            {group.label}
          </span>
          <ModuleCountChip
            granted={grantedCount}
            total={group.permissions.length}
          />
        </CollapsibleTrigger>

        <Button
          variant="ghost"
          size="sm"
          className="h-[26px] px-[9px] text-xs"
          disabled={allGranted}
          onClick={() => onSetModule(group, true)}
        >
          Select all
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-[26px] px-[9px] text-xs"
          disabled={grantedCount === 0}
          onClick={() => onSetModule(group, false)}
        >
          Clear
        </Button>
      </div>

      <CollapsibleContent>
        <div className="grid gap-x-2.5 gap-y-0.5 border-t p-2 sm:grid-cols-2">
          {group.permissions.map((permission) => (
            <Label
              key={permission._id}
              htmlFor={permission._id}
              className="items-start gap-2.5 rounded-lg px-2.5 py-1.5 font-normal hover:bg-accent"
            >
              <Checkbox
                id={permission._id}
                className="mt-0.5"
                checked={grantedIds.has(permission._id)}
                onCheckedChange={(checked) =>
                  onTogglePermission(permission._id, checked === true)
                }
              />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[13px] font-medium">
                  {permission.description || permission.title}
                </span>
                <span className="font-mono text-[10.5px] text-muted-foreground">
                  {permission.title}
                </span>
              </span>
            </Label>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function PermissionModuleList({
  groups,
  grantedIds,
  expandedKeys,
  onExpandedChange,
  onTogglePermission,
  onSetModule,
}: {
  groups: PermissionModuleGroup[];
  grantedIds: Set<string>;
  expandedKeys: Set<string>;
  onExpandedChange: (key: string, expanded: boolean) => void;
  onTogglePermission: (id: string, granted: boolean) => void;
  onSetModule: (group: PermissionModuleGroup, granted: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {groups.map((group) => (
        <PermissionModuleCard
          key={group.key}
          group={group}
          grantedIds={grantedIds}
          expanded={expandedKeys.has(group.key)}
          onExpandedChange={(expanded) => onExpandedChange(group.key, expanded)}
          onTogglePermission={onTogglePermission}
          onSetModule={onSetModule}
        />
      ))}
    </div>
  );
}
