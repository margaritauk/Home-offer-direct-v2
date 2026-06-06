import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="text-5xl">🧭</p>
      <h1 className="mt-4 text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-ink-soft">
        That page wandered off. Let&apos;s get you back on track.
      </p>
      <Link href="/journey" className="btn-primary mt-6">
        Go to the journey
      </Link>
    </div>
  );
}
