"use client";

import { XIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { FilterSelect } from "@/components/shared/filter-select";
import { LookupPicker } from "@/components/shared/lookup-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toDateInputValue } from "@/lib/date";
import {
  fetchVendorOptions,
  purchaseRequestKeys,
} from "@/modules/purchase-requests";
import {
  DEFAULT_RANGE_PRESET,
  type ReportDateRange,
  reportRangeOptions,
} from "@/modules/reports";

/**
 * The report toolbar. The vendor-name search is backed by `GET
 * /reports/vendor`, which no other report endpoint takes, so it only renders
 * while Vendor Performance is the active report (`showVendorFilter`) — every
 * other report has no parameter for it.
 *
 * The URL is the source of truth, so a filtered report stays linkable.
 */

const loadVendorPage = fetchVendorOptions;

export function ReportFilters({
  range,
  search,
  showVendorFilter,
}: {
  range: ReportDateRange;
  search: string;
  showVendorFilter: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);

    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const isCustom = range.preset === "custom";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <FilterSelect
        label="Date Range"
        options={[...reportRangeOptions]}
        value={range.preset}
        onValueChange={(value) =>
          // Leaving a custom range drops its bounds so the preset alone
          // describes the window.
          updateParams(
            value === "custom"
              ? {
                  range: "custom",
                  start: range.startDate,
                  end: toDateInputValue(range.endDate),
                }
              : {
                  range: value === DEFAULT_RANGE_PRESET ? null : value,
                  start: null,
                  end: null,
                },
          )
        }
      />

      {isCustom ? (
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor="range-start" className="text-[13px]">
            From
          </Label>
          <Input
            id="range-start"
            type="date"
            className="h-8 w-auto text-[13px]"
            value={range.startDate}
            max={toDateInputValue(range.endDate)}
            onChange={(event) =>
              updateParams({ start: event.target.value || null })
            }
          />
          <Label htmlFor="range-end" className="text-[13px]">
            To
          </Label>
          <Input
            id="range-end"
            type="date"
            className="h-8 w-auto text-[13px]"
            value={toDateInputValue(range.endDate)}
            min={range.startDate}
            onChange={(event) =>
              updateParams({ end: event.target.value || null })
            }
          />
        </div>
      ) : null}

      {showVendorFilter ? (
        <div className="flex items-center gap-1">
          <LookupPicker
            // Upstream matches the search term against the vendor name, so the
            // name — not `_id` — is what a selection is identified by here.
            value={search ? { id: search, label: search } : null}
            onSelect={(vendor) => updateParams({ search: vendor.name || null })}
            queryKey={purchaseRequestKeys.vendorOptions()}
            loadPage={loadVendorPage}
            toOption={(vendor) => ({
              id: vendor.name,
              label: vendor.name || vendor.no,
              hint: vendor.no,
            })}
            placeholder="Vendor"
            searchPlaceholder="Search vendors…"
            ariaLabel="Vendor"
            className="h-8 w-56 rounded-md text-[13px]"
          />

          {search ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              aria-label="Clear vendor filter"
              onClick={() => updateParams({ search: null })}
            >
              <XIcon />
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
