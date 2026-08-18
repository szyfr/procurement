"use client";

import type { QueryKey, UseQueryOptions } from "@tanstack/react-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import * as React from "react";
import { useCan } from "@/components/providers/permissions-provider";
import {
  dropdownContentClass,
  dropdownItemClass,
} from "@/components/shared/menu-classes";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState, ErrorAlert } from "@/components/shared/query-states";
import { dataTableClass } from "@/components/shared/table-classes";
import { TablePagination } from "@/components/shared/table-pagination";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import type { Paginated, Pagination } from "@/lib/api/pagination";
import { formatDate } from "@/lib/date";
import { buildPageHref } from "@/lib/page-href";
import { cn, errorMessage } from "@/lib/utils";
import type { PermissionSlug } from "@/modules/auth/constants/permissions";

/**
 * Departments and payment terms are the same CRUD screen wearing different
 * copy: a `{title, description}` record, listed/paginated, edited through one
 * form shared by create and edit, deleted through a confirm dialog. This file
 * is that screen written once; each module supplies a `EntityCrudConfig`
 * (labels, placeholders, its own query/mutation functions) rather than its
 * own copy of every file below.
 */

interface TitleDescriptionEntity {
  _id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface TitleDescriptionDto {
  title: string;
  description: string;
}

export interface EntityCrudConfig<
  TEntity extends TitleDescriptionEntity,
  TDto extends TitleDescriptionDto,
> {
  /** Singular, capitalized — "Department", "Payment Term". */
  entityLabel: string;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
  emptyStateIcon: React.ReactNode;
  emptyStateTitle: string;
  emptyStateDescription: string;
  pageTitle: string;
  pageDescription: string;
  /** Shown under the dialog title only when creating (edit reuses a fixed sentence). */
  createDescription: string;
  newButtonLabel: string;
  /** Route the list lives at, for pagination hrefs. */
  basePath: string;
  /**
   * The grant behind each write. They are not always three distinct slugs —
   * payment terms gate create, update *and* delete on `payment_term.store`
   * upstream — so each is named separately rather than inferred from a prefix.
   */
  permissions: {
    create: PermissionSlug;
    update: PermissionSlug;
    remove: PermissionSlug;
  };
  queryKeys: { all: QueryKey };
  listQuery: (
    page: number,
    // biome-ignore lint/suspicious/noExplicitAny: each module's queryOptions() narrows its own tuple-shaped query key, which useQuery accepts structurally but UseQueryOptions can't express generically here.
  ) => UseQueryOptions<Paginated<TEntity>, Error, Paginated<TEntity>, any>;
  create: (values: TDto) => Promise<TEntity>;
  update: (id: string, values: TDto) => Promise<TEntity>;
  remove: (id: string) => Promise<unknown>;
}

function EntityTable<
  TEntity extends TitleDescriptionEntity,
  TDto extends TitleDescriptionDto,
>({
  entities,
  page,
  onEdit,
  onDelete,
  config,
}: {
  entities: TEntity[];
  page: Pagination;
  onEdit: (entity: TEntity) => void;
  onDelete: (entity: TEntity) => void;
  config: EntityCrudConfig<TEntity, TDto>;
}) {
  const canEdit = useCan(config.permissions.update);
  const canDelete = useCan(config.permissions.remove);
  // With neither write granted the menu has nothing in it, so the trigger goes
  // too rather than opening an empty popover.
  const showActions = canEdit || canDelete;

  return (
    <Card>
      <CardContent className="px-0">
        <Table className={dataTableClass}>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Title</TableHead>
              <TableHead scope="col">Description</TableHead>
              <TableHead scope="col">Created At</TableHead>
              <TableHead scope="col">Updated At</TableHead>
              <TableHead scope="col">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entities.map((entity) => (
              <TableRow key={entity._id}>
                <TableCell className="font-medium">{entity.title}</TableCell>
                <TableCell className="text-muted-foreground">
                  {entity.description || (
                    <span className="italic">No description</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(entity.created_at) ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(entity.updated_at) ?? "—"}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    {showActions ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${entity.title}`}
                            />
                          }
                        >
                          <MoreVerticalIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className={cn(dropdownContentClass, "min-w-[196px]")}
                        >
                          {canEdit ? (
                            <DropdownMenuItem
                              className={dropdownItemClass}
                              onClick={() => onEdit(entity)}
                            >
                              <PencilIcon />
                              Edit {config.entityLabel.toLowerCase()}
                            </DropdownMenuItem>
                          ) : null}
                          {canEdit && canDelete ? (
                            <DropdownMenuSeparator />
                          ) : null}
                          {canDelete ? (
                            <DropdownMenuItem
                              variant="destructive"
                              className={dropdownItemClass}
                              onClick={() => onDelete(entity)}
                            >
                              <TrashIcon />
                              Delete {config.entityLabel.toLowerCase()}
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <TablePagination
        shown={entities.length}
        page={page}
        buildPageHref={(next) => buildPageHref(config.basePath, next)}
      />
    </Card>
  );
}

/**
 * Title/description fields shared by the create and edit dialogs. Owns field
 * state and required-field validation; the caller owns the async submit
 * (create vs. update) and reports back `submitting`/`error`.
 */
function EntityForm<
  TEntity extends TitleDescriptionEntity,
  TDto extends TitleDescriptionDto,
>({
  initialValues,
  submitLabel,
  submitting,
  error,
  onSubmit,
  onCancel,
  config,
}: {
  initialValues?: TDto;
  submitLabel: string;
  submitting: boolean;
  error: string | null;
  onSubmit: (values: TDto) => void;
  onCancel: () => void;
  config: EntityCrudConfig<TEntity, TDto>;
}) {
  const [title, setTitle] = React.useState(initialValues?.title ?? "");
  const [description, setDescription] = React.useState(
    initialValues?.description ?? "",
  );
  const [validationError, setValidationError] = React.useState<string | null>(
    null,
  );

  function handleSubmit() {
    setValidationError(null);

    if (!title.trim()) {
      setValidationError("Title is required.");
      return;
    }

    onSubmit({ title: title.trim(), description: description.trim() } as TDto);
  }

  return (
    <>
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>
            Couldn&apos;t save this {config.entityLabel.toLowerCase()}
          </AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup>
        <Field data-invalid={validationError ? true : undefined}>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input
            id="title"
            name="title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder={config.titlePlaceholder}
            disabled={submitting}
            aria-invalid={validationError ? true : undefined}
          />
          {validationError ? <FieldError>{validationError}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            name="description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={config.descriptionPlaceholder}
            disabled={submitting}
          />
        </Field>
      </FieldGroup>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Spinner data-icon="inline-start" /> : null}
          {submitLabel}
        </Button>
      </DialogFooter>
    </>
  );
}

/**
 * Create/edit dialog. A single instance handles both modes — passing
 * `entity` switches it to edit, pre-filled from the row already loaded by
 * the list (no extra fetch needed).
 */
function EntityFormDialog<
  TEntity extends TitleDescriptionEntity,
  TDto extends TitleDescriptionDto,
>({
  open,
  onOpenChange,
  entity,
  config,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity?: TEntity | null;
  config: EntityCrudConfig<TEntity, TDto>;
}) {
  const isEdit = Boolean(entity);
  const queryClient = useQueryClient();
  const label = config.entityLabel;

  const {
    mutate: save,
    isPending: submitting,
    error,
    reset,
  } = useMutation({
    mutationFn: (values: TDto) =>
      isEdit && entity
        ? config.update(entity._id, values)
        : config.create(values),
    onSuccess: (_saved, values) => {
      toast.add({
        title: isEdit ? `${label} updated` : `${label} created`,
        description: isEdit
          ? `"${values.title}" was saved.`
          : `"${values.title}" was added.`,
        type: "success",
      });

      onOpenChange(false);
      // The list refetches off this rather than a reload token from the page.
      queryClient.invalidateQueries({ queryKey: config.queryKeys.all });
    },
  });

  // Clear stale request state each time the dialog is opened.
  React.useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${label}` : `New ${label}`}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Update this ${label.toLowerCase()}'s details.`
              : config.createDescription}
          </DialogDescription>
        </DialogHeader>

        <EntityForm
          key={entity?._id ?? "create"}
          initialValues={
            entity
              ? ({
                  title: entity.title,
                  description: entity.description,
                } as TDto)
              : undefined
          }
          submitLabel={isEdit ? "Save Changes" : `Create ${label}`}
          submitting={submitting}
          error={error ? errorMessage(error) : null}
          onSubmit={save}
          onCancel={() => onOpenChange(false)}
          config={config}
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Controlled from the page's overlay state, same as the row's edit dialog —
 * the row menu only decides *which* entity to confirm, not whether the
 * dialog is open.
 */
function DeleteEntityDialog<
  TEntity extends TitleDescriptionEntity,
  TDto extends TitleDescriptionDto,
>({
  entity,
  open,
  onOpenChange,
  config,
}: {
  entity: { _id: string; title: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: EntityCrudConfig<TEntity, TDto>;
}) {
  const queryClient = useQueryClient();
  const label = config.entityLabel;

  const { mutate: remove, isPending: deleting } = useMutation({
    mutationFn: () => {
      if (!entity) throw new Error("No entity selected.");
      return config.remove(entity._id);
    },
    onSuccess: () => {
      toast.add({
        title: `${label} deleted`,
        description: entity ? `"${entity.title}" was removed.` : undefined,
        type: "success",
      });
      onOpenChange(false);
      // Refreshes whichever page the list is on, replacing the reload token
      // the parent used to thread down.
      queryClient.invalidateQueries({ queryKey: config.queryKeys.all });
    },
    onError: (cause) => {
      toast.add({
        title: `Couldn't delete ${label.toLowerCase()}`,
        description: errorMessage(cause),
        type: "error",
      });
    },
  });

  if (!entity) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {label.toLowerCase()}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete &ldquo;{entity.title}&rdquo;. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => remove()}
            disabled={deleting}
          >
            {deleting ? <Spinner data-icon="inline-start" /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EntityListView<
  TEntity extends TitleDescriptionEntity,
  TDto extends TitleDescriptionDto,
>({
  page,
  onEdit,
  onDelete,
  config,
}: {
  page: number;
  onEdit: (entity: TEntity) => void;
  onDelete: (entity: TEntity) => void;
  config: EntityCrudConfig<TEntity, TDto>;
}) {
  // Create, edit and delete invalidate the entity cache, so the list
  // refetches itself — no reload token has to be threaded down from the page.
  const { data, isPending, isError, error } = useQuery(config.listQuery(page));

  if (isError) {
    return (
      <ErrorAlert
        title={`Couldn't load ${config.pageTitle.toLowerCase()}`}
        error={error}
      />
    );
  }

  if (isPending) {
    return <TableSkeleton />;
  }

  const { data: entities, pagination } = data;

  if (pagination.total_items === 0) {
    return (
      <EmptyState
        icon={config.emptyStateIcon}
        title={config.emptyStateTitle}
        description={config.emptyStateDescription}
      />
    );
  }

  return (
    <EntityTable
      entities={entities}
      page={pagination}
      onEdit={onEdit}
      onDelete={onDelete}
      config={config}
    />
  );
}

/**
 * Owns the one thing the list and the create/edit dialog have to agree on:
 * which dialog, if any, is open. Refetching after a save is handled by the
 * mutations invalidating the entity cache.
 */
export function EntityPageContent<
  TEntity extends TitleDescriptionEntity,
  TDto extends TitleDescriptionDto,
>({ page, config }: { page: number; config: EntityCrudConfig<TEntity, TDto> }) {
  const canCreate = useCan(config.permissions.create);

  const [dialogState, setDialogState] = React.useState<
    | { mode: "create" }
    | { mode: "edit"; entity: TEntity }
    | { mode: "delete"; entity: TEntity }
    | null
  >(null);

  return (
    <>
      <PageHeader
        title={config.pageTitle}
        description={config.pageDescription}
        actions={
          canCreate ? (
            <Button
              variant="outline"
              onClick={() => setDialogState({ mode: "create" })}
            >
              <PlusIcon data-icon="inline-start" />
              {config.newButtonLabel}
            </Button>
          ) : null
        }
      />

      <EntityListView
        page={page}
        onEdit={(entity) => setDialogState({ mode: "edit", entity })}
        onDelete={(entity) => setDialogState({ mode: "delete", entity })}
        config={config}
      />

      <EntityFormDialog
        open={dialogState?.mode === "create" || dialogState?.mode === "edit"}
        onOpenChange={(open) => {
          if (!open) setDialogState(null);
        }}
        entity={dialogState?.mode === "edit" ? dialogState.entity : null}
        config={config}
      />

      <DeleteEntityDialog
        entity={dialogState?.mode === "delete" ? dialogState.entity : null}
        open={dialogState?.mode === "delete"}
        onOpenChange={(open) => {
          if (!open) setDialogState(null);
        }}
        config={config}
      />
    </>
  );
}
