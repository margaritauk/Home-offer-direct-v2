import type { Metadata } from "next";
import { CompsWorksheet } from "@/components/tools/comps-worksheet";

export const metadata: Metadata = {
  title: "Comps worksheet",
  description:
    "Enter comparable sales to estimate a fair-value range for a home before you make an offer. An estimate, not an appraisal.",
};

export default function CompsPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Comps worksheet</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Ground your offer in recent comparable sales. Enter the subject home
          and a few comps, adjust for differences, and see an estimated
          fair-value range based on adjusted price per square foot.
        </p>
      </div>
      <div className="mt-8">
        <CompsWorksheet />
      </div>
    </div>
  );
}
