import { ShieldAlertIcon } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/query-states";

/**
 * What a page renders in place of itself when the signed-in user holds none of
 * the grants it needs.
 *
 * Deliberately not a redirect: bouncing to the dashboard would leave a user
 * who followed a link with no idea why they ended up somewhere else, and a
 * bookmarked page would look broken. Saying so on the page, under its own
 * title, is the honest version — and it names the grant to ask for.
 */
export function NoAccess({
  title,
  resource,
}: {
  /** The page's own title, so the user still knows where they landed. */
  title: string;
  /** What they can't see, in a sentence: "purchase requests", "the user directory". */
  resource: string;
}) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState
        icon={<ShieldAlertIcon />}
        title="You don't have access to this"
        description={`Your account doesn't have permission to view ${resource}. Ask an administrator to grant it if you need access.`}
      />
    </>
  );
}
