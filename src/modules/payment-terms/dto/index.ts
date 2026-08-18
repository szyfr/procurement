/**
 * Request contracts for the payment term writes, mirroring FastAPI exactly.
 *
 * There is no response DTO: every read and write answers with the payment term
 * document itself, and that shape is the model — see `models/payment-term`.
 */

export interface CreatePaymentTermDto {
  title: string;
  description: string;
}

/** `PUT /payment-terms/{id}` accepts a full replacement, same shape as create. */
export type UpdatePaymentTermDto = CreatePaymentTermDto;
