import {
  dataTableClass,
  numericCellClass,
} from "@/components/shared/table-classes";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { PurchaseRequestItem } from "@/modules/purchase-requests";

/**
 * The grid itself, with no chrome around it. The create page wraps this in a
 * Card; the edit dialog puts it in a plain section, because a bordered Card
 * inside a dialog reads as a second surface.
 */
export function QuotationItemPricingRows({
  items,
  unitPrices,
  pricingError,
  onPriceChange,
}: {
  items: PurchaseRequestItem[];
  unitPrices: Record<string, string>;
  pricingError?: string;
  onPriceChange: (itemId: string, value: string) => void;
}) {
  return (
    <Table className={dataTableClass}>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Item</TableHead>
          <TableHead scope="col" className={numericCellClass}>
            Qty
          </TableHead>
          <TableHead scope="col" className={numericCellClass}>
            Unit Price
          </TableHead>
          <TableHead scope="col" className={numericCellClass}>
            Line Total
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const unitPrice = Number(unitPrices[item._id]) || 0;
          // The detail pipeline joins the material; the raw id stands in
          // if the lookup missed.
          const name = item.material?.description || item.material_id;

          return (
            <TableRow key={item._id}>
              <TableCell>{name}</TableCell>
              <TableCell>
                {item.quantity}
                {item.material?.uom ? ` ${item.material.uom}` : ""}
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={unitPrices[item._id] ?? ""}
                  placeholder="0.00"
                  aria-label={`Unit price for ${name}`}
                  aria-invalid={pricingError ? true : undefined}
                  className="h-8 w-28"
                  onChange={(event) =>
                    onPriceChange(item._id, event.target.value)
                  }
                />
              </TableCell>
              <TableCell>
                {formatCurrency(item.quantity * unitPrice, true)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/** The error-and-total line that closes the grid off. */
export function QuotationPricingTotal({
  pricingError,
  total,
}: {
  pricingError?: string;
  total: number;
}) {
  return (
    <>
      {pricingError ? <FieldError>{pricingError}</FieldError> : <span />}
      <div className="text-right">
        <p className="text-xs text-muted-foreground">Total Quote Amount</p>
        <p className="text-base font-bold tabular-nums">
          {formatCurrency(total, true)}
        </p>
      </div>
    </>
  );
}

/** One vendor's per-item pricing grid for a new quote — a pure, controlled table. */
export function QuotationItemPricingTable({
  items,
  unitPrices,
  pricingError,
  total,
  onPriceChange,
}: {
  items: PurchaseRequestItem[];
  unitPrices: Record<string, string>;
  pricingError?: string;
  total: number;
  onPriceChange: (itemId: string, value: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b">
        <CardTitle>Item Pricing</CardTitle>
        <span className="text-xs text-muted-foreground">
          {items.length === 1
            ? "The item this quote covers"
            : "Every item this quote covers"}
        </span>
      </CardHeader>
      <CardContent className="px-0">
        <QuotationItemPricingRows
          items={items}
          unitPrices={unitPrices}
          pricingError={pricingError}
          onPriceChange={onPriceChange}
        />
      </CardContent>
      <CardFooter className="justify-between gap-2">
        <QuotationPricingTotal pricingError={pricingError} total={total} />
      </CardFooter>
    </Card>
  );
}
