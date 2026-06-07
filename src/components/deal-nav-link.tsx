"use client";

import Link from "next/link";
import { isDealsEnabled } from "@/lib/supabase/config";
import { useAuth } from "@/hooks/use-auth";

/**
 * Header link to the deal-management page (invite members, roles, agency &
 * consent). Renders nothing unless the deal layer is enabled and the user is
 * signed in — so the nav is unchanged for guests / local-only deployments.
 */
export function DealNavLink({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  if (!isDealsEnabled() || !user) return null;
  return (
    <Link
      href="/deal"
      onClick={onNavigate}
      className="text-sm font-medium text-ink-soft transition hover:text-brand-700"
    >
      My Deal
    </Link>
  );
}
