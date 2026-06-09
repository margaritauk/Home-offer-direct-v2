import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DealManagementPanel } from "@/components/deals/deal-management-panel";
import { isDealsEnabled } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Manage deal",
  description:
    "Invite collaborators, manage roles, and capture the agency relationship and consent for your home-buying deal.",
};

export default function DealManagementPage() {
  // The multi-party collaboration layer is off by default (deals decoupled from
  // cloud sync). When disabled, the route 404s instead of rendering the
  // agent-collaboration workspace, even by direct URL.
  if (!isDealsEnabled()) notFound();

  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Manage this deal</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Invite your agent, co-buyer, or attorney, manage who has access, and
          record the representation relationship and any consent to share
          financial data. Optional — your journey works solo too.
        </p>
      </div>
      <div className="mt-8 max-w-2xl">
        <DealManagementPanel />
      </div>
    </div>
  );
}
