import type { Metadata } from "next";
import { MoveInTracker } from "@/components/tools/move-in";
import { ToolPageHeader } from "@/components/tools/tool-page-header";

export const metadata: Metadata = {
  title: "Move-in & post-purchase tracker",
  description:
    "Your first-weeks checklist after closing: utilities, homestead exemption, mortgage setup, locks and safety, maintenance reminders, and a document vault. Education, not tax or legal advice.",
};

export default function MoveInPage() {
  return (
    <ToolPageHeader
      title="Move-in & post-purchase"
      intro={
        <>
          The keys are yours — now settle in. Work through utilities, your
          mortgage and address updates, locks and safety, maintenance reminders,
          and confirm your closing documents are stored safely.
        </>
      }
    >
      <MoveInTracker />
    </ToolPageHeader>
  );
}
