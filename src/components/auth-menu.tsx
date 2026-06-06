"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

/**
 * Compact account link for the header. Renders nothing when cloud sync is not
 * configured, so the header is unchanged on local-only deployments.
 */
export function AuthMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { enabled, user, loading } = useAuth();
  if (!enabled || loading) return null;

  return (
    <Link
      href="/account"
      onClick={onNavigate}
      className="text-sm font-medium text-ink-soft transition hover:text-brand-700"
    >
      {user ? "Account" : "Sign in"}
    </Link>
  );
}
