/**
 * `PATCH .../items/{itemId}/partial-delivery` — how much of the item arrived.
 *
 * Upstream declares `amount: float = Field(..., gt=0)`: required, and strictly
 * greater than zero. It is a quantity, not a money value — there is no cost on
 * an item anywhere in this app.
 */
export interface RecordPartialDeliveryDto {
  amount: number;
}
