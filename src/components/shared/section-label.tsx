import { cn } from "@/lib/utils";

/** The small uppercase heading above a group of fields in a sheet or dialog. */
export function SectionLabel({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase",
        className,
      )}
      {...props}
    />
  );
}
