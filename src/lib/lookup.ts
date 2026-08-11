/**
 * Reference-data picking, shared by every feature that has to resolve an id
 * against a collection too large to enumerate — materials, vendors, payment
 * terms. The picker that renders these is `components/shared/lookup-picker`.
 *
 * There is no `LookupOption` here any more: the picker reads the backend
 * records as they arrive and the caller says which fields are the label and
 * the hint, so nothing has to be reshaped into a common option type first.
 */

/**
 * What a picker keeps once a record is chosen: the id it will submit and the
 * label it shows. Pure UI state — it holds a selection, not a response.
 */
export interface SelectedOption {
  id: string;
  label: string;
}

export const LOOKUP_PAGE_SIZE = 50;
