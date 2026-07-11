"use client";

import { FormEvent, useMemo, useState } from "react";
import { catalog, type PcListing } from "@/lib/catalog";
import { rankListings, type SearchCriteria } from "@/lib/matching";

const defaults: SearchCriteria = {
  cpu: "Any",
  gpu: "RTX 5080",
  ramGb: 32,
  storageTb: 1,
  motherboard: "Any",
  maxPrice: 3500,
  includeUnclear: true,
};

const cpuOptions = ["Any", "Ryzen 9 9950X", "Ryzen 9 9900X", "Core Ultra 9 285K", "Core i9-14900KF"];
const gpuOptions = ["Any", "RTX 5090", "RTX 5080", "RTX 5070 Ti", "RTX 5070", "Radeon RX 9070 XT"];
const boardOptions = ["Any", "X870E", "X870", "B850", "Z890", "Z790"];

export default function Home() {
  const [criteria, setCriteria] = useState(defaults);
  const [submitted, setSubmitted] = useState(defaults);

  const results = useMemo(() => rankListings(catalog, submitted), [submitted]);

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(criteria);
    document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main>
      <nav className="nav shell" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="RigScout home">
          <span className="brand-mark">R</span>
          <span>RigScout</span>
        </a>
        <div className="nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#results">Sample deals</a>
        </div>
        <button className="ghost-button" type="button" onClick={() => alert("Saved searches are planned for the next build.")}>Save this search</button>
      </nav>

      <section className="hero shell" id="top">
        <div className="eyebrow"><span className="pulse" /> PC deal search, backwards</div>
        <h1>Pick the parts.<br /><span>We’ll find the whole PC.</span></h1>
        <p className="hero-copy">Search prebuilt computers by the components you actually want. Compare exact and close matches across retailers—without opening forty tabs.</p>

        <form className="search-panel" onSubmit={submit}>
          <div className="panel-heading">
            <div>
              <p className="step-label">YOUR BUILD BRIEF</p>
              <h2>What belongs in the box?</h2>
            </div>
            <span className="demo-badge">Prototype · sample inventory</span>
          </div>

          <div className="field-grid">
            <SelectField label="Processor" value={criteria.cpu} options={cpuOptions} onChange={(cpu) => setCriteria({ ...criteria, cpu })} />
            <SelectField label="Graphics card" value={criteria.gpu} options={gpuOptions} onChange={(gpu) => setCriteria({ ...criteria, gpu })} />
            <NumberField label="Minimum memory" value={criteria.ramGb} suffix="GB" step={16} min={16} onChange={(ramGb) => setCriteria({ ...criteria, ramGb })} />
            <NumberField label="Minimum storage" value={criteria.storageTb} suffix="TB" step={1} min={1} onChange={(storageTb) => setCriteria({ ...criteria, storageTb })} />
            <SelectField label="Motherboard chipset" value={criteria.motherboard} options={boardOptions} onChange={(motherboard) => setCriteria({ ...criteria, motherboard })} />
            <NumberField label="Maximum price" value={criteria.maxPrice} prefix="$" step={100} min={500} onChange={(maxPrice) => setCriteria({ ...criteria, maxPrice })} />
          </div>

          <div className="panel-footer">
            <label className="toggle-row">
              <input type="checkbox" checked={criteria.includeUnclear} onChange={(event) => setCriteria({ ...criteria, includeUnclear: event.target.checked })} />
              <span className="toggle" aria-hidden="true" />
              Include listings with unclear secondary specs
            </label>
            <button className="primary-button" type="submit">Find matching PCs <span>→</span></button>
          </div>
        </form>
      </section>

      <section className="trust-strip shell" id="how-it-works" aria-label="How RigScout works">
        <div><strong>01</strong><span><b>You choose the parts</b>Exact models or minimums</span></div>
        <div><strong>02</strong><span><b>We scan the listings</b>Specs normalized across stores</span></div>
        <div><strong>03</strong><span><b>You see the tradeoffs</b>Matched, missing, and unclear</span></div>
      </section>

      <section className="results-section shell" id="results">
        <div className="results-heading">
          <div>
            <p className="step-label">MATCHED TO YOUR BRIEF</p>
            <h2>{results.length} sample systems worth a look</h2>
          </div>
          <div className="result-meta"><span className="pulse" /> Demo inventory · not live retailer data</div>
        </div>

        <div className="results-list">
          {results.map(({ listing, score, reasons, differences }, index) => (
            <ResultCard key={listing.id} listing={listing} score={score} reasons={reasons} differences={differences} rank={index + 1} />
          ))}
        </div>

        <p className="affiliate-note">RigScout may earn a commission when you purchase through our links. This does not affect your price or result ranking. Always verify final specifications, price, and availability with the retailer.</p>
      </section>
    </main>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function NumberField({ label, value, onChange, prefix, suffix, min, step }: { label: string; value: number; onChange: (value: number) => void; prefix?: string; suffix?: string; min: number; step: number }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="number-wrap">
        {prefix && <i>{prefix}</i>}
        <input type="number" value={value} min={min} step={step} onChange={(event) => onChange(Number(event.target.value))} />
        {suffix && <i>{suffix}</i>}
      </div>
    </label>
  );
}

function ResultCard({ listing, score, reasons, differences, rank }: { listing: PcListing; score: number; reasons: string[]; differences: string[]; rank: number }) {
  const tier = score >= 95 ? "Exact match" : score >= 82 ? "Strong match" : "Close match";
  return (
    <article className="result-card">
      <div className="rank">{String(rank).padStart(2, "0")}</div>
      <div className="result-main">
        <div className="result-topline">
          <span className={`match-pill ${score >= 95 ? "exact" : ""}`}>{score}% · {tier}</span>
          <span className="merchant">{listing.retailer}</span>
        </div>
        <h3>{listing.name}</h3>
        <div className="spec-row">
          <Spec label="CPU" value={listing.cpu} confidence={listing.confidence.cpu} />
          <Spec label="GPU" value={listing.gpu} confidence={listing.confidence.gpu} />
          <Spec label="Memory" value={`${listing.ramGb} GB`} confidence={listing.confidence.ram} />
          <Spec label="Storage" value={`${listing.storageTb} TB NVMe`} confidence={listing.confidence.storage} />
          <Spec label="Board" value={listing.motherboard ?? "Unclear"} confidence={listing.confidence.motherboard} />
        </div>
        <div className="verdict">
          <span className="verdict-icon">↳</span>
          <p><b>{reasons[0]}.</b> {differences.length ? differences.join("; ") + "." : "No meaningful differences found in the published specifications."}</p>
        </div>
      </div>
      <div className="price-block">
        {listing.wasPrice && <span className="was-price">${listing.wasPrice.toLocaleString()}</span>}
        <strong>${listing.price.toLocaleString()}</strong>
        {listing.wasPrice && <span className="savings">Save ${(listing.wasPrice - listing.price).toLocaleString()}</span>}
        <a className="deal-button" href={`/go/${listing.id}`} target="_blank" rel="sponsored noopener">View sample deal <span>↗</span></a>
        <small>Affiliate link · sample destination</small>
      </div>
    </article>
  );
}

function Spec({ label, value, confidence }: { label: string; value: string; confidence: number }) {
  return <div className={confidence < 0.8 ? "spec uncertain" : "spec"}><span>{label}{confidence < 0.8 ? " · likely" : ""}</span><b>{value}</b></div>;
}
