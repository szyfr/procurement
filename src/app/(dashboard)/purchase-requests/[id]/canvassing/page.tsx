import type { Metadata } from "next";

import { CanvassingItemsView } from "@/components/canvassing/canvassing-items-view";
import { CanvassingQuotationsView } from "@/components/canvassing/canvassing-quotations-view";

export const metadata: Metadata = {
  title: "Canvassing",
};

export default async function CanvassingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <CanvassingItemsView id={id} />
      <CanvassingQuotationsView id={id} />
    </>
  );
}
