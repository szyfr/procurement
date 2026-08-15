import { FileQuestionIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export const metadata: Metadata = {
  title: "Not found",
};

/**
 * Renders inside the root layout, so it is reached whether or not the caller
 * is signed in — including for a malformed record id, which `assertObjectId`
 * turns into a local 404 rather than an upstream round trip.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Empty className="gap-0">
        <EmptyHeader className="max-w-none gap-2">
          <EmptyMedia
            variant="icon"
            className="mb-4 size-11 rounded-xl [&_svg:not([class*='size-'])]:size-[22px]"
          >
            <FileQuestionIcon />
          </EmptyMedia>
          <EmptyTitle className="text-base font-bold">
            Page not found
          </EmptyTitle>
          <EmptyDescription className="max-w-[400px] text-[13px] leading-normal">
            That page doesn&apos;t exist, or the record it pointed to has been
            removed.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="mt-6">
          <Button
            size="sm"
            render={<Link href="/dashboard" />}
            nativeButton={false}
          >
            Back to dashboard
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}
