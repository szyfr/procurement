import type { CreateQuotationInput } from "@/modules/canvassing/dto/create-quotation.dto";

/**
 * What the UI submits to change a quote — `PUT /quotations/{id}`.
 *
 * It is the create body, not a subset of it: the endpoint declares
 * `request: QuotationCreate = Depends(get_quotation_create)`, the very same
 * dependency the POST uses, so every field is required on an update too. There
 * is no partial write — the backend's all-optional `QuotationUpdate` schema is
 * imported by the router and never reached.
 *
 * An alias rather than a second interface, so the two can't drift; the distinct
 * name is only so call sites read as what they are.
 */
export type UpdateQuotationInput = CreateQuotationInput;

/**
 * `get_quotation_create`'s form fields in full, as sent upstream on an update.
 *
 * `user_id` is required here as well, and the backend writes it straight onto
 * the document — so a quote's recorded user becomes whoever edited it last.
 * Nothing upstream separates author from editor.
 */
export interface UpdateQuotationDto extends UpdateQuotationInput {
  user_id: string;
}
