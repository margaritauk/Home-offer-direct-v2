import type { Metadata } from "next";
import { AccountPanel } from "@/components/account-panel";

export const metadata: Metadata = {
  title: "Account",
  description:
    "Create an account to sync your home-buying progress, selected state, and tracker across devices.",
};

export default function AccountPage() {
  return (
    <div className="container-page py-12 lg:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Your account</h1>
        <p className="mt-4 text-lg text-ink-soft">
          Optional, and free. An account syncs your journey progress, selected
          state, and deadline tracker across every device you use — handy when
          you switch between your laptop and phone mid-deal.
        </p>
      </div>
      <div className="mt-8">
        <AccountPanel />
      </div>
    </div>
  );
}
