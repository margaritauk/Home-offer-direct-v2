import type { Metadata } from "next";
import { ListingAlertsGuide } from "@/components/tools/listing-alerts-guide";
import { ToolPageHeader } from "@/components/tools/tool-page-header";

export const metadata: Metadata = {
  title: "Listing alerts & access guide",
  description:
    "An honest guide to setting saved-search alerts on the major portals (Zillow, Redfin, Realtor.com — we endorse none) and what an unrepresented buyer may miss: MLS-only and pocket listings, portal lag, and coming-soon homes.",
};

export default function ListingAlertsPage() {
  return (
    <ToolPageHeader
      title="Listing alerts & access guide"
      intro={
        <>
          Agents get instant MLS alerts. You can get close with saved-search
          alerts on the consumer portals — and it&apos;s worth being honest about
          the gap that&apos;s left. Here&apos;s how to set alerts well and what
          you might still miss.
        </>
      }
    >
      <ListingAlertsGuide />
    </ToolPageHeader>
  );
}
