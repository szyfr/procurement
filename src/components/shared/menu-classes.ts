/**
 * Shared geometry for every DropdownMenu in the app.
 *
 * `components/ui/dropdown-menu` is generated, so the design system's menu
 * density lives here instead of in the primitive — one import per call site
 * keeps a row-action menu on the purchase request table identical to the one
 * in the sidebar footer.
 */

export const dropdownContentClass = "w-[196px] rounded-lg p-[5px] shadow-md";

export const dropdownItemClass =
  "h-8 gap-2 rounded-md px-2 text-[13px] [&_svg]:size-[15px]";
