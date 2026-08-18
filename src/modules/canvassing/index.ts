/**
 * Canvassing module — public surface.
 *
 * Only the browser-safe pieces are re-exported here. The DAL is deliberately
 * left out: it reaches FastAPI and must be imported directly by Route Handlers
 * (`@/modules/canvassing/dal/...`) so it can never be pulled into a client
 * bundle through this barrel.
 */

export {
  awardQuotation,
  createQuotation,
  updateQuotation,
} from "@/modules/canvassing/api";
export {
  canvassingStatusOptions,
  canvassingStatusTone,
  quotationVendorLabel,
} from "@/modules/canvassing/constants";
export type {
  CreateQuotationDto,
  CreateQuotationInput,
  UpdateQuotationDto,
  UpdateQuotationInput,
} from "@/modules/canvassing/dto";
export { useCanvassingUpdates } from "@/modules/canvassing/hooks/use-canvassing-updates";
export type {
  AwardQuotationResult,
  CanvassAward,
  CanvassAwardIssue,
} from "@/modules/canvassing/models/award";
export type {
  CanvassingEntry,
  CanvassingStatus,
} from "@/modules/canvassing/models/canvassing";
export type {
  ItemQuotations,
  Quotation,
  QuotationDetail,
  QuotationDocument,
  QuotationItemPricing,
} from "@/modules/canvassing/models/quotation";
export {
  canvassingKeys,
  canvassingListQuery,
  canvassingQuotationsQuery,
  quotationDetailQuery,
} from "@/modules/canvassing/queries";
