/**
 * A row of `GET /reports/pr-cycle` — one purchase request status and how many
 * requests were created in the range with it.
 *
 * Despite the endpoint's name this is a status distribution, not cycle time:
 * the backend loops its `Status` enum counting matches, so all eight statuses
 * always come back, zeros included.
 */
export interface PrStatusCount {
  /**
   * The backend's own titling of the status slug (`"Po Created"`, `"Pending"`)
   * — not display copy. The render site maps it back to a slug and takes the
   * app's label from `purchaseRequestStatusLabels`.
   */
  category: string;
  value: number;
}
