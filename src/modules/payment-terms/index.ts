/**
 * Payment terms module — public surface.
 *
 * Two consumers share the one list call: the quotation form's picker and the
 * Payment Terms management screen. Both read the same records; only what they
 * render from them differs.
 *
 * The DAL is deliberately left out: it reaches FastAPI and must be imported
 * directly by Route Handlers (`@/modules/payment-terms/dal/...`) so it can
 * never be pulled into a client bundle through this barrel.
 */

export {
  createPaymentTerm,
  deletePaymentTerm,
  fetchPaymentTerms,
  updatePaymentTerm,
} from "@/modules/payment-terms/api";
export type {
  CreatePaymentTermDto,
  UpdatePaymentTermDto,
} from "@/modules/payment-terms/dto";
export type { PaymentTerm } from "@/modules/payment-terms/models/payment-term";
export {
  paymentTermKeys,
  paymentTermListQuery,
} from "@/modules/payment-terms/queries";
