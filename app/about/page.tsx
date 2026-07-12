export const metadata = {
  title: "About - Prebuilts.co",
  description: "How Prebuilts.co compares prebuilt PCs and explains the tradeoffs.",
};

export default function AboutPage() {
  return (
    <main className="info-page shell">
      <Link className="info-brand" href="/">Prebuilts.co</Link>
      <p className="step-label">ABOUT</p>
      <h1>Find the whole PC by the parts inside.</h1>
      <p className="info-lead">
        Prebuilts.co helps shoppers search complete PCs by the CPU, GPU, memory,
        storage, and secondary components they actually want.
      </p>
      <section>
        <h2>How comparisons work</h2>
        <p>
          Published retailer specifications are normalized into a consistent
          format. Deterministic scoring compares those specifications with your
          build brief, while workload-aware rules explain useful alternatives
          and visible compromises.
        </p>
      </section>
      <section>
        <h2>Confidence and uncertainty</h2>
        <p>
          Retailers do not always publish motherboard, power-supply, cooling,
          or memory-configuration details. We label uncertain fields and lower
          confidence instead of presenting an inference as confirmed fact.
        </p>
      </section>
      <section>
        <h2>Data freshness</h2>
        <p>
          Live retailer data is refreshed daily and expires automatically when
          it becomes stale. Prices, specifications, and availability can still
          change before checkout, so the retailer page remains the final source.
        </p>
      </section>
      <Link className="primary-button info-cta" href="/">Search prebuilt PCs</Link>
    </main>
  );
}
import Link from "next/link";
