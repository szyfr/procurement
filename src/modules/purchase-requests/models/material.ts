/**
 * The `/materials` response, verbatim.
 *
 * Materials have no module of their own — they are only ever read through the
 * purchase request lookups — so the shape lives here. Canvassing imports it
 * from this module rather than restating it: joined onto a canvassing row it
 * is the same document, and one declaration is what keeps it that way.
 */
export interface Material {
  _id: string;
  no: string;
  description: string;
  inventory: number;
  uom: string;
  inv_post_grp: string;
  is_needs_canvass: boolean;
  /** Declared by the backend schema but absent from every synced material. */
  last_cost?: number | null;
  consumption_qty?: number | null;
  created_at: string;
  updated_at: string;
}
