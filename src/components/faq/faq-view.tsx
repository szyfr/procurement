"use client";

import { SearchXIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

import { DataToolbar } from "@/components/shared/data-toolbar";
import { EmptyState } from "@/components/shared/query-states";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type FaqBlock,
  faqCategories,
  faqEntries,
  faqSearchText,
} from "@/data/faq";
import { cn } from "@/lib/utils";

/**
 * The FAQ, grouped into one collapsible section per category.
 *
 * Search and category live in the URL — `?q=` and `?category=` — the same way
 * the request and role lists carry theirs, so a filtered view is linkable and
 * survives a reload. The content itself is static, so filtering is local and
 * there is no query, loading state or error state to handle.
 */

const SEARCH_DEBOUNCE_MS = 300;

const categoryOptions = faqCategories.map((category) => ({
  label: category.label,
  value: category.id,
}));

/**
 * One answer's blocks.
 *
 * Paragraph spacing comes from `AccordionContent`, which already puts a margin
 * under every `p` that isn't last; lists and term lists carry the matching
 * margin themselves rather than the wrapper adding a gap on top of it.
 */
function FaqAnswer({ blocks }: { blocks: FaqBlock[] }) {
  return (
    // Capped measure: the card runs the full width of the page, and answers
    // are prose rather than a table.
    <div className="max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
      {blocks.map((block, index) => {
        const spacing = index < blocks.length - 1 ? "mb-4" : undefined;

        if (block.kind === "text") {
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: answer blocks are static copy and never reorder
            <p key={index}>{block.text}</p>
          );
        }

        if (block.kind === "list") {
          return (
            <ul
              // biome-ignore lint/suspicious/noArrayIndexKey: answer blocks are static copy and never reorder
              key={index}
              className={cn("flex list-disc flex-col gap-1.5 pl-4", spacing)}
            >
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }

        return (
          <dl
            // biome-ignore lint/suspicious/noArrayIndexKey: answer blocks are static copy and never reorder
            key={index}
            className={cn("flex flex-col gap-2.5", spacing)}
          >
            {block.items.map((item) => (
              <div key={item.term}>
                <dt className="font-medium text-foreground">{item.term}</dt>
                <dd>{item.description}</dd>
              </div>
            ))}
          </dl>
        );
      })}
    </div>
  );
}

export function FaqView({
  search,
  category,
}: {
  search: string;
  category: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = React.useState(search);

  // Keeps the field in sync when the URL changes from elsewhere, e.g. back
  // navigation or a shared link.
  React.useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const updateParams = React.useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams);

      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: only typing should reset the debounce timer — reacting to `search` or `updateParams` here would restart it every URL change.
  React.useEffect(() => {
    if (searchInput === search) return;

    const timeout = setTimeout(() => {
      updateParams({ q: searchInput || null });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  const query = search.trim().toLowerCase();
  // A category the catalogue doesn't have is ignored rather than filtering
  // everything away — the param is user-editable.
  const activeCategory = faqCategories.some((entry) => entry.id === category)
    ? category
    : "";

  const matches = React.useMemo(
    () =>
      faqEntries.filter(
        (entry) =>
          (!activeCategory || entry.category === activeCategory) &&
          (!query || faqSearchText[entry.id]?.includes(query)),
      ),
    [activeCategory, query],
  );

  const sections = faqCategories
    .map((section) => ({
      ...section,
      entries: matches.filter((entry) => entry.category === section.id),
    }))
    .filter((section) => section.entries.length > 0);

  const isFiltered = Boolean(query || activeCategory);

  return (
    <>
      <DataToolbar
        placeholder="Search the FAQ…"
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        filters={[
          {
            label: "Category",
            options: categoryOptions,
            value: activeCategory || null,
            onValueChange: (value) => updateParams({ category: value }),
          },
        ]}
      />

      <p className="text-xs text-muted-foreground">
        {isFiltered
          ? `${matches.length} of ${faqEntries.length} questions`
          : `${faqEntries.length} questions`}
      </p>

      {sections.length === 0 ? (
        <EmptyState
          variant="no-results"
          icon={<SearchXIcon />}
          title="No matching questions"
          description="Try a different word, or clear the category filter."
        />
      ) : (
        sections.map((section) => (
          <Card key={section.id}>
            <CardHeader className="border-b">
              <CardTitle>{section.label}</CardTitle>
            </CardHeader>
            <CardContent className="py-1">
              {/* Remounted on each new search term so the matches open by
                  themselves, then left uncontrolled — the reader can collapse
                  and expand freely until the term changes again. */}
              <Accordion
                key={query}
                multiple
                defaultValue={
                  query ? section.entries.map((entry) => entry.id) : []
                }
              >
                {section.entries.map((entry) => (
                  <AccordionItem key={entry.id} value={entry.id}>
                    <AccordionTrigger className="gap-4 py-3.5">
                      <span className="min-w-0">{entry.question}</span>
                    </AccordionTrigger>
                    {/* `h-auto` overrides the fixed panel height the generated
                        component sets from Base UI's measurement. That measure
                        is taken while the panel's open animation is still
                        running, so a long answer opens clipped the first time
                        and only reads correctly on the second expand. */}
                    <AccordionContent className="h-auto">
                      <FaqAnswer blocks={entry.answer} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))
      )}
    </>
  );
}
