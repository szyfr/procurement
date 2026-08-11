/**
 * ScrollArea placed in a flex column that is sized by `max-height` rather than
 * a set height — a dialog body, a sheet body.
 *
 * The generated Viewport is `size-full`, and that percentage height has
 * nothing to resolve against: the popup's own height is `auto` under a
 * `max-h`, so the Root never receives a computed height, only a flex-shrunk
 * used one. The Viewport falls back to its content height, overflows a Root
 * that doesn't clip, and the dialog spills past its footer instead of
 * scrolling.
 *
 * Making the Root a flex column and letting the Viewport flex gives it a
 * height that is definite by construction, with no percentage involved.
 * `components/ui/scroll-area` stays generated.
 */
export const flexScrollAreaClass = [
  "flex min-h-0 flex-1 flex-col",
  "[&>[data-slot=scroll-area-viewport]]:h-auto",
  "[&>[data-slot=scroll-area-viewport]]:min-h-0",
  "[&>[data-slot=scroll-area-viewport]]:flex-1",
].join(" ");
