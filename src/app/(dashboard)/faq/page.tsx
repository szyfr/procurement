import type { Metadata } from "next";

import { FaqView } from "@/components/faq/faq-view";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "FAQ",
};

/**
 * Help content rather than data: nothing here is fetched, so there is no
 * permission to gate on. Like the Dashboard it stays open to every signed-in
 * user, which is the point — one of the likeliest reasons to open it is that
 * something else was refused.
 */
export default async function FaqPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;

  return (
    <>
      <PageHeader
        title="Frequently Asked Questions"
        description="How purchase requests, canvassing, ordering and deliveries work here"
      />

      <FaqView search={q ?? ""} category={category ?? ""} />
    </>
  );
}
