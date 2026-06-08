import Link from "next/link";
import { getStages, totalSteps } from "@/lib/journey";

const valueProps = [
  {
    icon: "🧭",
    title: "Every step, in order",
    body: "From budgeting to keys-in-hand — a plain-English roadmap so you always know what's next and what's at stake.",
  },
  {
    icon: "✅",
    title: "Trackable checklists",
    body: "Tick off concrete tasks as you go. Your progress saves on your device. No account, no spam.",
  },
  {
    icon: "🧰",
    title: "Tools for every decision",
    body: "Comps, tour scorecards, an offer builder, lender compare, inspection and closing trackers — the worksheets that turn each step into a clear decision.",
  },
  {
    icon: "🛡️",
    title: "Avoid the traps",
    body: "Wire-fraud, missed deadlines, and the closing-disclosure rule flagged loudly — exactly where buyers get burned.",
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
              🏡 Your home-buying workspace
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              The whole home-buying process,{" "}
              <span className="text-brand-600">guided start to finish.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-soft sm:text-xl">
              HomeOffer Direct gives you{" "}
              <strong className="text-ink">one workspace</strong> for your entire
              home purchase — search, offer, inspection, closing and beyond.
              Clear next steps, every deadline tracked, and all your homes,
              numbers, and documents in one place from first showing to keys in
              hand.
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

      {/* Everything in one workspace */}
      <section className="bg-ink text-white">
        <div className="container-page grid gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <h2 className="text-3xl font-bold text-white">
              Your whole purchase, in one place.
            </h2>
            <p className="mt-4 text-slate-300">
              Buying a home means juggling showings, offers, inspections,
              deadlines, and a stack of documents. HomeOffer Direct keeps it all
              in <strong className="text-white">one workspace</strong> — so you
              always know what&apos;s done, what&apos;s next, and what&apos;s at
              stake.
            </p>
            <Link
              href="/journey"
              className="mt-6 inline-block font-semibold text-brand-300 hover:text-brand-200"
            >
              See how the journey works →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Stat value={String(stages.length)} label="stages, budgeting to keys-in-hand" />
            <Stat value={String(totalSteps())} label="guided steps, in order" />
            <Stat value="All 50" label="states, with state-specific guidance" />
            <Stat value="$0" label="free — no account required" />
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
            Ready to take charge of your purchase?
          </h2>
          <p className="max-w-xl text-brand-50">
            Start the guided journey today. It&apos;s free, there&apos;s no
            account, and you can pick up right where you left off.
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
