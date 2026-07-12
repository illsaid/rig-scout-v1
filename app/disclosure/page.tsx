export const metadata = {
  title: "Affiliate Disclosure - Prebuilts.co",
  description: "How retailer links and commissions work on Prebuilts.co.",
};

export default function DisclosurePage() {
  return (
    <main className="info-page shell">
      <Link className="info-brand" href="/">Prebuilts.co</Link>
      <p className="step-label">DISCLOSURE</p>
      <h1>Retailer relationships do not determine rankings.</h1>
      <p className="info-lead">
        Prebuilts.co may earn a commission when a purchase is made through an
        eligible, clearly disclosed retailer link.
      </p>
      <section>
        <h2>How links work</h2>
        <p>
          Some retailer links may be ordinary outbound links and others may be
          affiliate links. A commission does not increase your purchase price.
        </p>
      </section>
      <section>
        <h2>How rankings work</h2>
        <p>
          Results are ranked from the requested specifications, published
          product details, price limits, confidence, and workload fit. Affiliate
          eligibility is not a ranking input.
        </p>
      </section>
      <section>
        <h2>Verify before purchasing</h2>
        <p>
          Retailer prices, availability, promotions, and configurations can
          change. Confirm the final model, specifications, price, and return
          terms on the retailer site before checkout.
        </p>
      </section>
    </main>
  );
}
import Link from "next/link";
