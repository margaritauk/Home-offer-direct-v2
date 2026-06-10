import Link from "next/link";
import { getStages, totalSteps } from "@/lib/journey";
import { formatUSD } from "@/lib/savings";

const valueProps = [
  {
    icon: "🧭",
    title: "Every step, in order",
    body: "From budgeting to keys-in-hand — a plain-English roadmap so you always know what's next and what's at stake, with no agent to lean on.",
  },
  {
    icon: "✅",
    title: "Trackable checklists",
    body: "Tick off concrete tasks as you go. Your progress saves on your device. No account, no spam.",
  },
  {
    icon: "🧮",
    title: "Capture the commission",
    body: "Buyer-side commission, closing costs, and credits explained for your deal — so you know exactly what to ask for and negotiate it into real savings.",
  },
  {
    icon: "🛡️",
    title: "Avoid the traps",
    body: "Wire-fraud, missed deadlines, and the closing-disclosure rule flagged loudly — exactly where unrepresented buyers get burned.",
  },
];

export default function HomePage() {
  const stages = getStages();

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="container-page py-20 lg:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-sm font-medium text-brand-700">
              🏡 Buy your home without a realtor
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Buy your home without an agent —{" "}
              <span className="text-brand-600">and keep the commission.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-soft sm:text-xl">
              HomeOffer Direct walks you through the entire purchase on your own
              — search, offer, inspection, and closing — with plain-English steps
              at every stage. No buyer&apos;s agent means roughly{" "}
              <strong className="text-ink">2.5% of the price</strong> is back on
              the table; we show you exactly how to negotiate it into a price cut
              or closing credit, and bring in flat-fee attorneys and inspectors
              only at the moments that matter.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/journey" className="btn-primary text-base">
                Start the journey — free
              </Link>
              <Link href="/listings" className="btn-secondary text-base">
                Search homes
              </Link>
            </div>
            <p className="mt-4 text-sm text-ink-muted">
              {stages.length} stages · {totalSteps()} guided steps · no account
              required
            </p>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="container-page py-16 lg:py-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {valueProps.map((v) => (
            <div key={v.title} className="card">
              <span className="text-3xl" aria-hidden>{v.icon}</span>
              <h3 className="mt-4 text-lg font-semibold">{v.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The commission is yours to capture */}
      <section className="bg-ink text-white">
        <div className="container-page grid gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <h2 className="text-3xl font-bold text-white">
              The commission is yours to capture.
            </h2>
            <p className="mt-4 text-slate-300">
              Since the 2024 NAR settlement, buyer-side commission — around 2.5%
              of the price — is{" "}
              <strong className="text-white">negotiated on every deal</strong>{" "}
              rather than set in advance. With no agent of your own, that money is
              on the table: depending on how your purchase is structured, it can
              become a price reduction or a closing-cost credit. HomeOffer Direct
              shows you these numbers up front, so you know what to ask for and
              can negotiate from knowledge.
            </p>
            <Link
              href="/journey/make-an-offer"
              className="mt-6 inline-block font-semibold text-brand-300 hover:text-brand-200"
            >
              See how offers and credits work →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Stat value="~2.5%" label="buyer-side commission, now negotiated each deal" />
            <Stat value={formatUSD(400_000 * 0.025)} label="example on a $400k home, at ~2.5%" />
            <Stat value="2–5%" label="typical buyer closing costs, as a share of price" />
            <Stat value="All 50" label="states, with state-specific guidance" />
          </div>
        </div>
      </section>

      {/* How it works — stage pipeline */}
      <section className="container-page py-16 lg:py-24">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold">How it works</h2>
          <p className="mt-3 text-ink-soft">
            One clear pipeline. Each stage gives you guidance, a checklist, the
            terms you&apos;ll hear, and the moments to bring in a pro.
          </p>
        </div>
        <ol className="mt-8 flex flex-wrap gap-3">
          {stages.map((stage) => (
            <li key={stage.slug}>
              <Link
                href={`/journey/${stage.slug}`}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-ink-soft transition hover:border-brand-300 hover:text-brand-700"
              >
                <span aria-hidden>{stage.icon}</span>
                <span className="text-xs text-ink-muted">{stage.order}.</span>
                {stage.title}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="bg-brand-600">
        <div className="container-page flex flex-col items-center gap-6 py-16 text-center text-white lg:py-20">
          <h2 className="max-w-2xl text-3xl font-bold text-white sm:text-4xl">
            Ready to buy without an agent?
          </h2>
          <p className="max-w-xl text-brand-50">
            Start the free guided journey today. No account, you can pick up
            right where you left off — and you&apos;ll know exactly how to keep
            the commission savings for yourself.
          </p>
          <Link
            href="/journey"
            className="btn bg-white text-base text-brand-700 hover:bg-brand-50"
          >
            Start the journey
          </Link>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-5">
      <p className="text-3xl font-bold text-brand-300">{value}</p>
      <p className="mt-1 text-sm text-slate-300">{label}</p>
    </div>
  );
}
