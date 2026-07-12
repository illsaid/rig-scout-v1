export const metadata = {
  title: "Privacy - Prebuilts.co",
  description: "Privacy information for Prebuilts.co.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="info-page shell">
      <Link className="info-brand" href="/">Prebuilts.co</Link>
      <p className="step-label">PRIVACY</p>
      <h1>A small product with a small data footprint.</h1>
      <p className="info-lead">
        Prebuilts.co does not currently require user accounts or collect payment information.
      </p>
      <section>
        <h2>Information collected</h2>
        <p>
          Hosting infrastructure may process standard request information such
          as IP address, browser type, requested pages, and timestamps for
          security, reliability, and aggregate performance measurement.
        </p>
      </section>
      <section>
        <h2>Retailer links</h2>
        <p>
          When you follow a retailer link, that retailer receives the request
          and applies its own privacy policy. Eligible links may contain
          referral parameters used to measure purchases or site traffic.
        </p>
        <p>
          Prebuilts.co records the listing, retailer, destination domain,
          referring domain, and time of an outbound click. The application does
          not store your IP address with this click record.
        </p>
      </section>
      <section>
        <h2>Future features</h2>
        <p>
          If saved searches, email alerts, or accounts are introduced, this
          notice will be updated before those features collect personal data.
        </p>
      </section>
      <p className="info-updated">Last updated July 12, 2026.</p>
    </main>
  );
}
import Link from "next/link";
