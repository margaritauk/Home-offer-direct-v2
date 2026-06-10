import type { Metadata } from "next";
import {
  LegalNotice,
  NOT_A_LAW_FIRM,
  SUBJECT_TO_ATTORNEY_REVIEW,
} from "@/components/legal-notice";

export const metadata: Metadata = {
  title: "Legal & disclaimers",
  description:
    "HomeOffer Direct is an educational worksheet tool — not a law firm or brokerage. Read what we are, what we are not, and why every document should be reviewed by a licensed attorney in your state.",
};

export default function LegalPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Legal &amp; disclaimers</h1>
        <p className="mt-4 text-lg text-ink-soft">
          HomeOffer Direct helps you understand and organize a home purchase. So
          you always know what we are — and what we are not — here is the plain
          version.
        </p>
      </div>

      <div className="mt-8 max-w-3xl">
        <LegalNotice />
      </div>

      <div className="mt-10 max-w-2xl space-y-10 text-ink-soft">
        <section>
          <h2 className="text-xl font-bold text-ink">
            Not a law firm, not legal advice, not a brokerage
          </h2>
          <p className="mt-3">{NOT_A_LAW_FIRM}</p>
          <p className="mt-3">
            What we are: an educational, self-serve worksheet tool. We help you
            learn the steps of buying a home and organize the numbers and choices
            you enter into clear summaries you can read and share.
          </p>
          <p className="mt-3">
            What we are not: we are not your lawyer, your real-estate agent, or
            your broker. We do not represent you, we do not advocate on your
            behalf, and nothing here creates an attorney–client relationship. We
            do not tell you what to do — we explain trade-offs so you can decide
            with the right professionals.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink">Subject to attorney review</h2>
          <p className="mt-3">{SUBJECT_TO_ATTORNEY_REVIEW}</p>
          <p className="mt-3">
            Every document, worksheet, and summary you produce here should be
            reviewed by a licensed attorney in the buyer&apos;s state before you
            sign anything. Real-estate law, required forms, and disclosure rules
            vary by state and by transaction. A worksheet from this tool is a
            starting point for that conversation — never a substitute for it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink">AI features notice</h2>
          <p className="mt-3">
            Where HomeOffer Direct uses AI, it only explains and organizes
            information you provide. It does not give legal or financial advice,
            and it does not decide anything for you.
          </p>
          <p className="mt-3 text-sm text-ink-muted">
            This is forward-looking: AI features are gated and may not be active
            on your account. When they are, the same guardrails apply — review by
            a licensed attorney is still required before signing.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-ink">Estimates, not advice</h2>
          <p className="mt-3">
            Our calculators and tools produce estimates for education. Figures
            such as savings, closing costs, and timelines depend on assumptions
            and on details specific to your purchase. Treat every number as an
            illustration to discuss with your lender, attorney, or other
            qualified professional — not as a guarantee or as advice.
          </p>
        </section>

        <section
          aria-label="Draft paid-documents terms"
          className="rounded-xl border border-slate-300 bg-slate-50 p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Draft — not yet active; pending legal review
          </p>
          <h2 className="mt-2 text-xl font-bold text-ink">
            Paid documents (future)
          </h2>
          <p className="mt-3">
            HomeOffer Direct does not currently sell or charge for any document
            export. The terms below are a <strong>draft</strong> for a possible
            future paid export feature. They are not in effect, no paid feature is
            enabled, and the language is pending review by a licensed attorney
            before it could ever apply.
          </p>

          <h3 className="mt-5 font-semibold text-ink">
            Draft Terms of Service (paid export)
          </h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm">
            <li>
              A paid export would deliver the same educational worksheet without
              the sample watermark. It would remain a worksheet — not a binding
              contract and not legal advice.
            </li>
            <li>
              {NOT_A_LAW_FIRM} Purchasing an export would not change that and
              would not create an attorney–client relationship.
            </li>
            <li>
              You would remain responsible for having the document reviewed by a
              licensed attorney in your state before signing.
            </li>
          </ul>

          <h3 className="mt-5 font-semibold text-ink">
            Draft refund policy (paid export)
          </h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm">
            <li>
              Because an export is a digital good delivered immediately, refunds
              would be considered case by case — for example, if a technical
              fault prevented delivery.
            </li>
            <li>
              Final refund terms would be published here and confirmed by legal
              review before any paid feature launches.
            </li>
          </ul>

          <p className="mt-4 text-sm text-ink-muted">
            Status: draft only. No paid feature is active.
          </p>
        </section>
      </div>
    </div>
  );
}
